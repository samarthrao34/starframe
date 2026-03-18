const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const speakeasy = require('speakeasy');
const Database = require('../models/Database');
const logger = require('../utils/logger');

class AuthMiddleware {

    // Generate JWT token
    generateToken(user) {
        return jwt.sign(
            {
                id: user.id,
                username: user.username,
                email: user.email,
                timestamp: Date.now()
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '24h',
                issuer: 'starframe-admin',
                subject: user.id.toString()
            }
        );
    }

    // Verify JWT token
    verifyToken(token) {
        try {
            return jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            logger.security('Invalid token verification attempt', { error: error.message });
            return null;
        }
    }

    // Hash password
    async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }

    // Verify password
    async verifyPassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }

    // Generate 2FA secret
    generate2FASecret(username) {
        return speakeasy.generateSecret({
            name: `${process.env.APP_NAME || 'StarFrame Admin'} (${username})`,
            issuer: process.env.APP_NAME || 'StarFrame Admin',
            length: 32
        });
    }

    // Verify 2FA token
    verify2FAToken(secret, token) {
        return speakeasy.totp.verify({
            secret: secret,
            encoding: 'base32',
            token: token,
            window: 2 // Allow 2 time steps (60 seconds) variance
        });
    }

    // Check if user is locked due to failed attempts
    async isUserLocked(user) {
        if (user.locked_until) {
            const lockTime = new Date(user.locked_until);
            const now = new Date();
            if (now < lockTime) {
                const remainingTime = Math.ceil((lockTime - now) / 1000 / 60); // minutes
                return { locked: true, remaining: remainingTime };
            } else {
                // Lock expired, reset failed attempts
                await Database.run(
                    'UPDATE admin_users SET failed_attempts = 0, locked_until = NULL WHERE id = ?',
                    [user.id]
                );
            }
        }
        return { locked: false };
    }

    // Handle failed login attempt
    async handleFailedLogin(user, ipAddress, userAgent) {
        const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5;
        const lockoutTime = parseInt(process.env.LOCKOUT_TIME) || 900000; // 15 minutes

        const newFailedAttempts = (user.failed_attempts || 0) + 1;
        let lockedUntil = null;

        if (newFailedAttempts >= maxAttempts) {
            lockedUntil = new Date(Date.now() + lockoutTime).toISOString();
            logger.security('User account locked due to multiple failed attempts', {
                userId: user.id,
                username: user.username,
                attempts: newFailedAttempts,
                ipAddress,
                userAgent
            });
        }

        await Database.run(
            'UPDATE admin_users SET failed_attempts = ?, locked_until = ? WHERE id = ?',
            [newFailedAttempts, lockedUntil, user.id]
        );

        // Log security event
        await Database.logSecurityEvent({
            event_type: 'failed_login',
            severity: newFailedAttempts >= maxAttempts ? 'high' : 'medium',
            ip_address: ipAddress,
            user_agent: userAgent,
            user_id: user.id,
            details: JSON.stringify({
                username: user.username,
                attempts: newFailedAttempts,
                locked: lockedUntil !== null
            })
        });

        return { locked: lockedUntil !== null, attempts: newFailedAttempts };
    }

    // Handle successful login
    async handleSuccessfulLogin(user, ipAddress, userAgent) {
        // Reset failed attempts
        await Database.run(
            'UPDATE admin_users SET failed_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Log security event
        await Database.logSecurityEvent({
            event_type: 'successful_login',
            severity: 'low',
            ip_address: ipAddress,
            user_agent: userAgent,
            user_id: user.id,
            details: JSON.stringify({
                username: user.username,
                timestamp: new Date().toISOString()
            })
        });

        logger.audit('User logged in successfully', {
            userId: user.id,
            username: user.username,
            ipAddress,
            userAgent
        });
    }

    // Middleware to require admin authentication
    requireAuth = async (req, res, next) => {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '') ||
                req.session.token ||
                req.cookies?.authToken;

            if (!token) {
                // If no token, check session
                if (req.session && req.session.userId && req.session.isAdmin) {
                    const user = await Database.get('SELECT * FROM admin_users WHERE id = ? AND is_active = 1', [req.session.userId]);
                    if (user) {
                        req.user = user;
                        return next();
                    }
                }
                return res.status(401).json({ error: 'No authentication token provided' });
            }

            const decoded = this.verifyToken(token);
            if (!decoded) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            // Get user from database to ensure they still exist and are active
            const user = await Database.get('SELECT * FROM admin_users WHERE id = ? AND is_active = 1', [decoded.id]);
            if (!user) {
                return res.status(401).json({ error: 'User not found or inactive' });
            }

            // Check if user is locked
            const lockStatus = await this.isUserLocked(user);
            if (lockStatus.locked) {
                return res.status(423).json({
                    error: 'Account is locked',
                    remainingTime: lockStatus.remaining
                });
            }

            // Add user to request object
            req.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                is_2fa_enabled: user.is_2fa_enabled
            };

            // Update session activity
            req.session.lastActivity = Date.now();

            next();
        } catch (error) {
            logger.error('Authentication middleware error:', error);
            res.status(500).json({ error: 'Authentication error' });
        }
    };

    // Middleware to require client authentication
    requireClientAuth = async (req, res, next) => {
        try {
            // Check session first (for web clients)
            if (req.session && req.session.userId && !req.session.isAdmin) {
                const client = await Database.getClientById(req.session.userId);
                if (client && client.is_active) {
                    req.user = client;
                    return next();
                }
            }

            // Check for token (for API/Mobile clients)
            const token = req.header('Authorization')?.replace('Bearer ', '') ||
                req.cookies?.clientToken;

            if (!token) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const decoded = this.verifyToken(token);
            if (!decoded) {
                return res.status(401).json({ error: 'Invalid or expired token' });
            }

            const client = await Database.getClientById(decoded.id);
            if (!client || !client.is_active) {
                return res.status(401).json({ error: 'Client account not found or inactive' });
            }

            req.user = client;
            next();
        } catch (error) {
            logger.error('Client authentication middleware error:', error);
            res.status(500).json({ error: 'Authentication error' });
        }
    };

    // Middleware to require 2FA verification
    require2FA = async (req, res, next) => {
        try {
            if (!req.user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            const user = await Database.get('SELECT * FROM admin_users WHERE id = ?', [req.user.id]);

            if (user.is_2fa_enabled && !req.session.is2FAVerified) {
                return res.status(403).json({
                    error: '2FA verification required',
                    require2FA: true
                });
            }

            next();
        } catch (error) {
            logger.error('2FA middleware error:', error);
            res.status(500).json({ error: '2FA verification error' });
        }
    };

    // Middleware to log user activities
    logActivity = async (req, res, next) => {
        const originalSend = res.send;

        res.send = function (body) {
            // Only log successful requests (2xx status codes)
            if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
                Database.logActivity({
                    user_id: req.user.id,
                    action: `${req.method} ${req.originalUrl}`,
                    resource: req.originalUrl.split('/')[2] || 'unknown',
                    resource_id: req.params.id || null,
                    old_values: req.method === 'PUT' || req.method === 'PATCH' ? JSON.stringify(req.body.oldValues || {}) : null,
                    new_values: req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' ? JSON.stringify(req.body) : null,
                    ip_address: req.ip,
                    user_agent: req.get('User-Agent')
                }).catch(err => {
                    logger.error('Failed to log activity:', err);
                });
            }

            originalSend.call(this, body);
        };

        next();
    };

    // Check session timeout
    checkSessionTimeout = (req, res, next) => {
        if (req.session.lastActivity) {
            const sessionTimeout = parseInt(process.env.SESSION_TIMEOUT) || 3600000; // 1 hour
            const timeSinceLastActivity = Date.now() - req.session.lastActivity;

            if (timeSinceLastActivity > sessionTimeout) {
                req.session.destroy();
                return res.status(401).json({ error: 'Session expired' });
            }
        }

        next();
    };
}

module.exports = new AuthMiddleware();

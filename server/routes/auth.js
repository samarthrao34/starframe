const express = require('express');
const { body, validationResult } = require('express-validator');
const qrcode = require('qrcode');
const passport = require('passport');
const Database = require('../models/Database');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Login endpoint
router.post('/login', [
    body('username').trim().notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required'),
    body('twoFactorCode').optional({ checkFalsy: true }).isLength({ min: 6, max: 6 }).withMessage('2FA code must be 6 digits')
], async (req, res) => {
    try {
        logger.info('Login request received:', {
            body: req.body,
            headers: req.headers,
            contentType: req.get('Content-Type')
        });

        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            logger.error('Validation errors:', errors.array());
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { username, password, twoFactorCode } = req.body;
        const clientIP = req.ip;
        const userAgent = req.get('User-Agent');

        // Find user
        const user = await Database.getUserByUsername(username);
        if (!user) {
            logger.security('Login attempt with invalid username', {
                username,
                ip: clientIP,
                userAgent
            });
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check if user is active
        if (!user.is_active) {
            logger.security('Login attempt by inactive user', {
                username: user.username,
                ip: clientIP,
                userAgent
            });
            return res.status(401).json({ error: 'Account is inactive' });
        }

        // Check if user is locked
        const lockStatus = await auth.isUserLocked(user);
        if (lockStatus.locked) {
            return res.status(423).json({
                error: 'Account is locked',
                remainingTime: lockStatus.remaining
            });
        }

        // Verify password
        const isPasswordValid = await auth.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            await auth.handleFailedLogin(user, clientIP, userAgent);
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Check 2FA if enabled
        if (user.is_2fa_enabled) {
            if (!twoFactorCode) {
                return res.status(200).json({
                    requireTwoFactor: true,
                    message: '2FA code required'
                });
            }

            const is2FAValid = auth.verify2FAToken(user.two_factor_secret, twoFactorCode);
            if (!is2FAValid) {
                await auth.handleFailedLogin(user, clientIP, userAgent);
                return res.status(401).json({ error: 'Invalid 2FA code' });
            }
        }

        // Successful login
        await auth.handleSuccessfulLogin(user, clientIP, userAgent);

        // Generate token
        const token = auth.generateToken(user);

        // Set session data
        req.session.token = token;
        req.session.userId = user.id;
        req.session.isAdmin = true;
        req.session.is2FAVerified = user.is_2fa_enabled;
        req.session.lastActivity = Date.now();

        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is2FAEnabled: user.is_2fa_enabled
            },
            message: 'Login successful'
        });

    } catch (error) {
        logger.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Verify 2FA code (separate endpoint for better UX)
router.post('/verify-2fa', [
    body('username').trim().notEmpty(),
    body('twoFactorCode').isLength({ min: 6, max: 6 }).withMessage('2FA code must be 6 digits')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { username, twoFactorCode } = req.body;
        const user = await Database.getUserByUsername(username);

        if (!user || !user.is_2fa_enabled) {
            return res.status(400).json({ error: 'Invalid request' });
        }

        const is2FAValid = auth.verify2FAToken(user.two_factor_secret, twoFactorCode);
        if (!is2FAValid) {
            await auth.handleFailedLogin(user, req.ip, req.get('User-Agent'));
            return res.status(401).json({ error: 'Invalid 2FA code' });
        }

        // Mark 2FA as verified in session
        req.session.is2FAVerified = true;

        res.json({ success: true, message: '2FA verified successfully' });

    } catch (error) {
        logger.error('2FA verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Setup 2FA endpoint
router.post('/setup-2fa', auth.requireAuth, async (req, res) => {
    try {
        const user = await Database.get('SELECT * FROM admin_users WHERE id = ?', [req.user.id]);

        if (user.is_2fa_enabled) {
            return res.status(400).json({ error: '2FA is already enabled' });
        }

        // Generate secret
        const secret = auth.generate2FASecret(user.username);

        // Generate QR code
        const qrCodeUrl = await qrcode.toDataURL(secret.otpauth_url);

        // Store temporary secret (not yet enabled)
        await Database.run(
            'UPDATE admin_users SET two_factor_secret = ? WHERE id = ?',
            [secret.base32, user.id]
        );

        res.json({
            secret: secret.base32,
            qrCode: qrCodeUrl,
            manualEntryKey: secret.base32,
            message: 'Scan QR code with your authenticator app'
        });

    } catch (error) {
        logger.error('2FA setup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Enable 2FA endpoint
router.post('/enable-2fa', auth.requireAuth, [
    body('twoFactorCode').isLength({ min: 6, max: 6 }).withMessage('2FA code must be 6 digits')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { twoFactorCode } = req.body;
        const user = await Database.get('SELECT * FROM admin_users WHERE id = ?', [req.user.id]);

        if (!user.two_factor_secret) {
            return res.status(400).json({ error: '2FA setup not initiated' });
        }

        if (user.is_2fa_enabled) {
            return res.status(400).json({ error: '2FA is already enabled' });
        }

        // Verify the code
        const is2FAValid = auth.verify2FAToken(user.two_factor_secret, twoFactorCode);
        if (!is2FAValid) {
            return res.status(401).json({ error: 'Invalid 2FA code' });
        }

        // Enable 2FA
        await Database.run(
            'UPDATE admin_users SET is_2fa_enabled = 1 WHERE id = ?',
            [user.id]
        );

        logger.audit('2FA enabled for user', { userId: user.id, username: user.username });

        res.json({ success: true, message: '2FA enabled successfully' });

    } catch (error) {
        logger.error('2FA enable error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Disable 2FA endpoint
router.post('/disable-2fa', auth.requireAuth, [
    body('password').notEmpty().withMessage('Password is required'),
    body('twoFactorCode').optional().isLength({ min: 6, max: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { password, twoFactorCode } = req.body;
        const user = await Database.get('SELECT * FROM admin_users WHERE id = ?', [req.user.id]);

        // Verify password
        const isPasswordValid = await auth.verifyPassword(password, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid password' });
        }

        // If 2FA is enabled, require 2FA code
        if (user.is_2fa_enabled && !twoFactorCode) {
            return res.status(400).json({ error: '2FA code required to disable 2FA' });
        }

        if (user.is_2fa_enabled) {
            const is2FAValid = auth.verify2FAToken(user.two_factor_secret, twoFactorCode);
            if (!is2FAValid) {
                return res.status(401).json({ error: 'Invalid 2FA code' });
            }
        }

        // Disable 2FA
        await Database.run(
            'UPDATE admin_users SET is_2fa_enabled = 0, two_factor_secret = NULL WHERE id = ?',
            [user.id]
        );

        logger.audit('2FA disabled for user', { userId: user.id, username: user.username });

        res.json({ success: true, message: '2FA disabled successfully' });

    } catch (error) {
        logger.error('2FA disable error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Change password endpoint
router.post('/change-password', auth.requireAuth, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
    body('twoFactorCode').optional().isLength({ min: 6, max: 6 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { currentPassword, newPassword, twoFactorCode } = req.body;
        const user = await Database.get('SELECT * FROM admin_users WHERE id = ?', [req.user.id]);

        // Verify current password
        const isPasswordValid = await auth.verifyPassword(currentPassword, user.password_hash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Invalid current password' });
        }

        // If 2FA is enabled, require 2FA code
        if (user.is_2fa_enabled) {
            if (!twoFactorCode) {
                return res.status(400).json({ error: '2FA code required' });
            }

            const is2FAValid = auth.verify2FAToken(user.two_factor_secret, twoFactorCode);
            if (!is2FAValid) {
                return res.status(401).json({ error: 'Invalid 2FA code' });
            }
        }

        // Hash new password
        const newPasswordHash = await auth.hashPassword(newPassword);

        // Update password
        await Database.run(
            'UPDATE admin_users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [newPasswordHash, user.id]
        );

        logger.audit('Password changed', { userId: user.id, username: user.username });

        res.json({ success: true, message: 'Password changed successfully' });

    } catch (error) {
        logger.error('Password change error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Logout endpoint
router.post('/logout', auth.requireAuth, (req, res) => {
    try {
        logger.audit('User logged out', { userId: req.user.id, username: req.user.username });

        req.session.destroy((err) => {
            if (err) {
                logger.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Logout error' });
            }

            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    } catch (error) {
        logger.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get current user info
router.get('/me', auth.requireAuth, async (req, res) => {
    try {
        const user = await Database.get(
            'SELECT id, username, email, is_2fa_enabled, last_login, created_at FROM admin_users WHERE id = ?',
            [req.user.id]
        );

        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                is2FAEnabled: user.is_2fa_enabled,
                lastLogin: user.last_login,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        logger.error('Get user info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Check authentication status
router.get('/status', (req, res) => {
    const isAuthenticated = !!(req.session.token && req.session.userId);
    const is2FAVerified = !!req.session.is2FAVerified;

    res.json({
        isAuthenticated,
        is2FAVerified,
        sessionId: req.session.id
    });
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

router.get('/google/callback',
    passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed' }),
    async (req, res) => {
        try {
            // User is authenticated, redirect to personalized dashboard
            const user = req.user;

            // Log the successful login
            logger.info('Google OAuth login successful:', {
                userId: user.id,
                email: user.email,
                name: user.name
            });

            // Set session data
            req.session.userId = user.id;
            req.session.isAdmin = false; // Google login is for clients
            req.session.isOAuthUser = true;
            req.session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture
            };

            // Redirect to personalized dashboard
            res.redirect(`/dashboard?welcome=true&user=${encodeURIComponent(user.name)}`);

        } catch (error) {
            logger.error('Google OAuth callback error:', error);
            res.redirect('/login?error=oauth_error');
        }
    }
);

// OAuth user info endpoint
router.get('/oauth/me', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isOAuthUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const user = await Database.getClientById(req.session.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                picture: user.picture,
                preferences: JSON.parse(user.preferences || '{}'),
                lastLogin: user.last_login,
                createdAt: user.created_at
            }
        });
    } catch (error) {
        logger.error('OAuth user info error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update user preferences endpoint
router.post('/oauth/preferences', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isOAuthUser) {
            return res.status(401).json({ error: 'Not authenticated' });
        }

        const { preferences } = req.body;
        await Database.updateClientPreferences(req.session.userId, preferences);

        res.json({ success: true, message: 'Preferences updated' });
    } catch (error) {
        logger.error('Update preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// OAuth logout endpoint
router.post('/oauth/logout', async (req, res) => {
    try {
        if (req.session.userId && req.session.isOAuthUser) {
            // Update user session in database
            await Database.updateClientSession(req.session.userId, null);

            // Get Socket.IO instance from app
            const io = req.app.get('io');
            if (io) {
                io.to('admin-room').emit('user-logout', {
                    userId: req.session.userId,
                    timestamp: new Date().toISOString()
                });
            }
        }

        req.session.destroy((err) => {
            if (err) {
                logger.error('Session destruction error:', err);
                return res.status(500).json({ error: 'Logout error' });
            }

            res.clearCookie('connect.sid');
            res.json({ success: true, message: 'Logged out successfully' });
        });
    } catch (error) {
        logger.error('OAuth logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

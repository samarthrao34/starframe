const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('../models/Database');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @route   POST /api/client/register
 * @desc    Register a new client
 * @access  Public
 */
router.post('/register', [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('name').trim().notEmpty().withMessage('Name is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { email, password, name } = req.body;

        // Check if client already exists
        const existingClient = await Database.getClientByEmail(email);
        if (existingClient) {
            return res.status(400).json({ error: 'Client with this email already exists' });
        }

        // Hash password
        const password_hash = await auth.hashPassword(password);

        // Create client
        const result = await Database.createClient({
            email,
            password_hash,
            name,
            preferences: {
                emailNotifications: true,
                realTimeUpdates: true,
                marketing: false,
                activityTracking: true
            }
        });

        const newClient = await Database.getClientById(result.id);

        // Auto-login after registration
        req.session.userId = newClient.id;
        req.session.isAdmin = false;
        req.session.user = {
            id: newClient.id,
            name: newClient.name,
            email: newClient.email
        };

        res.status(201).json({
            success: true,
            message: 'Registration successful',
            client: {
                id: newClient.id,
                name: newClient.name,
                email: newClient.email
            }
        });

    } catch (error) {
        logger.error('Client registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   POST /api/client/login
 * @desc    Login as a client
 * @access  Public
 */
router.post('/login', [
    body('email').isEmail().withMessage('Enter a valid email'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Validation failed', details: errors.array() });
        }

        const { email, password } = req.body;

        const client = await Database.getClientByEmail(email);
        if (!client) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!client.is_active) {
            return res.status(401).json({ error: 'Account is inactive' });
        }

        // Verify password
        const isMatch = await auth.verifyPassword(password, client.password_hash);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Set session
        req.session.userId = client.id;
        req.session.isAdmin = false;
        req.session.user = {
            id: client.id,
            name: client.name,
            email: client.email,
            picture: client.picture
        };

        // Update last login
        await Database.run('UPDATE clients SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [client.id]);

        res.json({
            success: true,
            message: 'Login successful',
            client: {
                id: client.id,
                name: client.name,
                email: client.email,
                picture: client.picture
            }
        });

    } catch (error) {
        logger.error('Client login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   GET /api/client/me
 * @desc    Get current client profile
 * @access  Private (Client)
 */
router.get('/me', auth.requireClientAuth, async (req, res) => {
    try {
        const client = req.user;
        res.json({
            success: true,
            client: {
                id: client.id,
                name: client.name,
                email: client.email,
                picture: client.picture,
                preferences: JSON.parse(client.preferences || '{}'),
                lastLogin: client.last_login,
                createdAt: client.created_at
            }
        });
    } catch (error) {
        logger.error('Get client profile error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   POST /api/client/preferences
 * @desc    Update client preferences
 * @access  Private (Client)
 */
router.post('/preferences', auth.requireClientAuth, async (req, res) => {
    try {
        const { preferences } = req.body;
        if (!preferences) {
            return res.status(400).json({ error: 'Preferences are required' });
        }

        await Database.updateClientPreferences(req.user.id, preferences);

        res.json({ success: true, message: 'Preferences updated' });
    } catch (error) {
        logger.error('Update client preferences error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

/**
 * @route   POST /api/client/logout
 * @desc    Logout client
 * @access  Private (Client)
 */
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            logger.error('Client logout error:', err);
            return res.status(500).json({ error: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logged out successfully' });
    });
});

module.exports = router;

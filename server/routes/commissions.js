const express = require('express');
const router = express.Router();
const database = require('../models/Database');
const { requireClientAuth } = require('../middleware/auth');
const logger = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');
const { sendCommissionConfirmationEmail } = require('../utils/notifications');

/**
 * @route   POST /api/commissions/create
 * @desc    Create a new commission request
 * @access  Private (Client)
 */
router.post('/create', requireClientAuth, async (req, res) => {
    try {
        const clientId = req.user.id;
        const { name, email, phone, location, service, budget, timeline, purpose, description, reference_links, gst } = req.body;

        const commissionId = `SF-COM-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        await database.createCommission({
            id: commissionId,
            client_id: clientId,
            name,
            email,
            phone,
            location,
            service,
            budget,
            timeline,
            purpose,
            description,
            reference_links,
            gst: !!gst
        });

        logger.info(`Commission created by client ${clientId}: ID ${commissionId}`);

        // Send confirmation email (non-blocking)
        sendCommissionConfirmationEmail({ id: commissionId, name, email, service, budget, timeline }).catch(err => {
            logger.error('Confirmation email failed (non-fatal):', err);
        });

        res.status(201).json({
            success: true,
            message: 'Commission request created successfully',
            commissionId
        });
    } catch (error) {
        logger.error('Error creating commission:', error);
        res.status(500).json({ error: 'Failed to create commission request' });
    }
});

/**
 * @route   GET /api/commissions/my
 * @desc    Get all commissions for the logged-in client
 * @access  Private (Client)
 */
router.get('/my', requireClientAuth, async (req, res) => {
    try {
        const clientId = req.user.id;
        const commissions = await database.getClientCommissions(clientId);
        res.json(commissions);
    } catch (error) {
        logger.error('Error fetching client commissions:', error);
        res.status(500).json({ error: 'Failed to fetch commissions' });
    }
});

/**
 * @route   GET /api/commissions/status/:id
 * @desc    Get real-time tracking status for a commission
 * @access  Private (Client - Owner Only)
 */
router.get('/status/:id', requireClientAuth, async (req, res) => {
    try {
        const commissionId = req.params.id;
        const clientId = req.user.id;

        const commission = await database.getCommissionWithPayment(commissionId);

        if (!commission) {
            return res.status(404).json({ error: 'Commission not found' });
        }

        if (commission.client_id !== clientId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized access to commission tracking' });
        }

        res.json(commission);
    } catch (error) {
        logger.error('Error fetching commission status:', error);
        res.status(500).json({ error: 'Failed to fetch status' });
    }
});

module.exports = router;

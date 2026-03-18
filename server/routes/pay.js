const express = require('express');
const router = express.Router();
const database = require('../models/Database');
const { requireClientAuth } = require('../middleware/auth');
const logger = require('../utils/logger');
const path = require('path');

/**
 * @route   POST /api/pay/declare
 * @desc    Client declares a UPI payment by submitting UTR
 * @access  Private (Client)
 */
router.post('/declare', requireClientAuth, async (req, res) => {
    try {
        const { amount, utrNumber } = req.body;
        const clientId = req.user.id;

        if (!amount || !utrNumber) {
            return res.status(400).json({ error: 'Amount and UTR number are required' });
        }

        // Check if UTR already exists
        const existingPayment = await database.getPaymentByUtr(utrNumber);
        if (existingPayment) {
            return res.status(400).json({ error: 'This Transaction ID (UTR) has already been submitted' });
        }

        // Create payment record
        const result = await database.createPayment({
            client_id: clientId,
            amount: parseFloat(amount),
            utr_number: utrNumber,
            status: 'pending'
        });

        logger.info(`Payment declared by client ${clientId}: UTR ${utrNumber}, Amount ${amount}`);

        res.status(201).json({
            success: true,
            message: 'Payment declaration submitted successfully. A provisional receipt is being generated.',
            paymentId: result.id
        });
    } catch (error) {
        logger.error('Error declaring payment:', error);
        res.status(500).json({ error: 'Failed to submit payment declaration' });
    }
});

/**
 * @route   GET /api/pay/receipt/:id
 * @desc    Get/Download provisional receipt for a payment
 * @access  Private (Client - Owner Only)
 */
router.get('/receipt/:id', requireClientAuth, async (req, res) => {
    try {
        const paymentId = req.params.id;
        const clientId = req.user.id;

        const payment = await database.get('SELECT * FROM payments WHERE id = ?', [paymentId]);

        if (!payment) {
            return res.status(404).json({ error: 'Payment not found' });
        }

        if (payment.client_id !== clientId && !req.user.isAdmin) {
            return res.status(403).json({ error: 'Unauthorized access to receipt' });
        }

        // For now, return a JSON representation of the receipt
        // In a full implementation, this could return a generated HTML or PDF
        res.json({
            receiptNumber: `SF-${payment.id}-${payment.created_at.split(' ')[0].replace(/-/g, '')}`,
            clientName: req.user.name,
            amount: payment.amount,
            currency: 'INR',
            utr: payment.utr_number,
            status: payment.status,
            date: payment.created_at,
            studio: "StarFrame Animation Studio",
            note: "This is a provisional receipt subject to verification of the Transaction ID."
        });
    } catch (error) {
        logger.error('Error fetching receipt:', error);
        res.status(500).json({ error: 'Failed to fetch receipt' });
    }
});

module.exports = router;

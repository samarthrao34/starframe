const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('../models/Database');
const logger = require('../utils/logger');

const router = express.Router();

// Handle contact form submissions
router.post('/contact', [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').optional().trim(),
    body('subject').optional().trim(),
    body('message').trim().notEmpty().withMessage('Message is required'),
    body('project_type').optional().trim(),
    body('budget_range').optional().trim(),
    body('timeline').optional().trim()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                success: false, 
                error: 'Invalid input', 
                details: errors.array() 
            });
        }

        const {
            name,
            email,
            phone,
            subject,
            message,
            project_type,
            budget_range,
            timeline
        } = req.body;

        // Insert into client inquiries table
        const result = await Database.run(`
            INSERT INTO client_inquiries (
                name, email, phone, project_type, budget_range, 
                timeline, description, status, priority
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'new', 2)
        `, [name, email, phone || null, project_type || null, budget_range || null, timeline || null, message]);

        logger.info('New contact form submission:', {
            inquiryId: result.id,
            name,
            email,
            subject: subject || 'Website Inquiry'
        });

        res.json({
            success: true,
            message: 'Thank you for your inquiry! We will get back to you soon.',
            inquiryId: result.id
        });

    } catch (error) {
        logger.error('Contact form submission error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to submit inquiry. Please try again later.'
        });
    }
});

// Get public portfolio/services data (no auth required)
router.get('/services', async (req, res) => {
    try {
        // This could return actual service data
        const services = [
            {
                id: 1,
                name: '2D Animation',
                description: 'Professional 2D animation services',
                category: 'animation'
            },
            {
                id: 2,
                name: '3D Animation',
                description: 'Cutting-edge 3D animation and modeling',
                category: 'animation'
            },
            {
                id: 3,
                name: 'Motion Graphics',
                description: 'Dynamic motion graphics for all media',
                category: 'graphics'
            },
            {
                id: 4,
                name: 'Video Editing',
                description: 'Professional video editing and post-production',
                category: 'video'
            }
        ];

        res.json({ services });
    } catch (error) {
        logger.error('Services data error:', error);
        res.status(500).json({ error: 'Failed to load services' });
    }
});

module.exports = router;

const express = require('express');
const Database = require('../models/Database');
const logger = require('../utils/logger');

const router = express.Router();

// Get system status
router.get('/status', async (req, res) => {
    try {
        const memUsage = process.memoryUsage();
        
        const systemInfo = {
            status: 'online',
            uptime: process.uptime(),
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024)
            },
            nodeVersion: process.version,
            platform: process.platform
        };

        res.json(systemInfo);

    } catch (error) {
        logger.error('System status error:', error);
        res.status(500).json({ error: 'Failed to fetch system status' });
    }
});

module.exports = router;

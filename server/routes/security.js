const express = require('express');
const Database = require('../models/Database');
const logger = require('../utils/logger');
const security = require('../middleware/security');

const router = express.Router();

// Get security dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const highCriticalThreats = await Database.get(`
            SELECT COUNT(*) as count FROM security_logs 
            WHERE severity IN ('high', 'critical') AND timestamp >= datetime('now', '-24 hours')
        `);

        const blockedIPs = await Database.get(`
            SELECT COUNT(*) as count FROM security_logs 
            WHERE event_type = 'ip_blocked'
        `);

        const loginFailures = await Database.get(`
            SELECT COUNT(*) as count FROM security_logs 
            WHERE event_type = 'failed_login' AND timestamp >= datetime('now', '-24 hours')
        `);

        const stats = {
            highCriticalThreats: highCriticalThreats.count,
            blockedIPs: blockedIPs.count,
            loginFailures: loginFailures.count
        };
        
        const recentThreats = await Database.all(`
            SELECT * FROM security_logs 
            WHERE severity IN ('high', 'critical')
            ORDER BY timestamp DESC 
            LIMIT 10
        `);

        res.json({
            stats,
            recentThreats
        });

    } catch (error) {
        logger.error('Security dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch security dashboard' });
    }
});

// Block/unblock IP address
router.post('/block-ip', async (req, res) => {
    try {
        const { ip, reason } = req.body;
        
        if (!ip) {
            return res.status(400).json({ error: 'IP address required' });
        }

        // Add to security logs
        await Database.logSecurityEvent({
            event_type: 'ip_blocked',
            severity: 'medium',
            ip_address: req.ip,
            user_agent: req.get('User-Agent'),
            user_id: req.user.id,
            details: JSON.stringify({ blocked_ip: ip, reason })
        });

        res.json({ success: true, message: 'IP blocked successfully' });

    } catch (error) {
        logger.error('Block IP error:', error);
        res.status(500).json({ error: 'Failed to block IP' });
    }
});

module.exports = router;

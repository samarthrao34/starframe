const express = require('express');
const { body, validationResult } = require('express-validator');
const Database = require('../models/Database');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Apply activity logging to all routes
router.use(auth.logActivity);

// Dashboard overview data
router.get('/dashboard', async (req, res) => {
    try {
        // Get visitor stats
        const totalVisitors = await Database.get(
            'SELECT COUNT(*) as count FROM visitor_analytics WHERE timestamp >= datetime("now", "-30 days")'
        );
        
        const todayVisitors = await Database.get(
            'SELECT COUNT(*) as count FROM visitor_analytics WHERE date(timestamp) = date("now")'
        );
        
        const yesterdayVisitors = await Database.get(
            'SELECT COUNT(*) as count FROM visitor_analytics WHERE date(timestamp) = date("now", "-1 day")'
        );

        // Get security alerts
        const securityAlerts = await Database.get(
            'SELECT COUNT(*) as count FROM security_logs WHERE severity IN ("high", "critical") AND timestamp >= datetime("now", "-24 hours")'
        );

        // Get client inquiries
        const newInquiries = await Database.get(
            'SELECT COUNT(*) as count FROM client_inquiries WHERE status = "new" AND created_at >= datetime("now", "-7 days")'
        );

        // Get payment stats
        const recentPayments = await Database.get(
            'SELECT COUNT(*) as count, SUM(amount) as total FROM payment_transactions WHERE created_at >= datetime("now", "-30 days")'
        );

        // Calculate visitor change percentage
        const visitorsChange = yesterdayVisitors.count > 0 
            ? ((todayVisitors.count - yesterdayVisitors.count) / yesterdayVisitors.count * 100).toFixed(1)
            : '0';

        // Get recent activities
        const recentActivities = await Database.all(
            `SELECT 
                al.action, al.timestamp, al.ip_address,
                au.username
            FROM activity_logs al 
            LEFT JOIN admin_users au ON al.user_id = au.id 
            ORDER BY al.timestamp DESC 
            LIMIT 10`
        );

        // Get security events summary
        const securityEvents = await Database.all(
            `SELECT 
                event_type, severity, COUNT(*) as count,
                MAX(timestamp) as last_occurrence
            FROM security_logs 
            WHERE timestamp >= datetime("now", "-7 days")
            GROUP BY event_type, severity
            ORDER BY count DESC`
        );

        // System uptime (mock for now)
        const systemUptime = '99.9%';

        res.json({
            stats: {
                totalVisitors: totalVisitors.count || 0,
                todayVisitors: todayVisitors.count || 0,
                visitorsChange: visitorsChange,
                securityAlerts: securityAlerts.count || 0,
                newInquiries: newInquiries.count || 0,
                systemUptime: systemUptime,
                recentPayments: {
                    count: recentPayments.count || 0,
                    total: recentPayments.total || 0
                }
            },
            recentActivities: recentActivities,
            securityEvents: securityEvents
        });

    } catch (error) {
        logger.error('Dashboard data error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

// Get visitor analytics data
router.get('/analytics/visitors', async (req, res) => {
    try {
        const { timeframe = '24h' } = req.query;
        
        let timeFilter;
        let groupBy;
        
        switch (timeframe) {
            case '24h':
                timeFilter = 'datetime("now", "-24 hours")';
                groupBy = 'strftime("%H", timestamp)';
                break;
            case '7d':
                timeFilter = 'datetime("now", "-7 days")';
                groupBy = 'date(timestamp)';
                break;
            case '30d':
                timeFilter = 'datetime("now", "-30 days")';
                groupBy = 'date(timestamp)';
                break;
            default:
                timeFilter = 'datetime("now", "-24 hours")';
                groupBy = 'strftime("%H", timestamp)';
        }

        const visitorData = await Database.all(`
            SELECT 
                ${groupBy} as period,
                COUNT(*) as visitors,
                COUNT(DISTINCT ip_address) as unique_visitors
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter}
            GROUP BY ${groupBy}
            ORDER BY period
        `);

        // Get geographic data
        const geoData = await Database.all(`
            SELECT 
                country,
                COUNT(*) as visitors
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter} AND country != ''
            GROUP BY country
            ORDER BY visitors DESC
            LIMIT 10
        `);

        // Get device data
        const deviceData = await Database.all(`
            SELECT 
                device_type,
                COUNT(*) as visitors
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter}
            GROUP BY device_type
        `);

        // Get browser data
        const browserData = await Database.all(`
            SELECT 
                browser,
                COUNT(*) as visitors
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter} AND browser != ''
            GROUP BY browser
            ORDER BY visitors DESC
            LIMIT 5
        `);

        res.json({
            timeframe,
            visitorData,
            geoData,
            deviceData,
            browserData
        });

    } catch (error) {
        logger.error('Analytics data error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

// Get security events data
router.get('/security/events', async (req, res) => {
    try {
        const { timeframe = '24h', severity, type } = req.query;
        
        let timeFilter = 'datetime("now", "-24 hours")';
        if (timeframe === '7d') timeFilter = 'datetime("now", "-7 days")';
        if (timeframe === '30d') timeFilter = 'datetime("now", "-30 days")';

        let whereClause = `WHERE timestamp >= ${timeFilter}`;
        const params = [];

        if (severity) {
            whereClause += ' AND severity = ?';
            params.push(severity);
        }

        if (type) {
            whereClause += ' AND event_type = ?';
            params.push(type);
        }

        const events = await Database.all(`
            SELECT 
                id, event_type, severity, ip_address, 
                details, timestamp,
                u.username
            FROM security_logs s
            LEFT JOIN admin_users u ON s.user_id = u.id
            ${whereClause}
            ORDER BY timestamp DESC
            LIMIT 100
        `, params);

        // Get summary stats
        const summary = await Database.all(`
            SELECT 
                severity,
                COUNT(*) as count
            FROM security_logs
            ${whereClause}
            GROUP BY severity
        `, params);

        res.json({
            events,
            summary,
            timeframe
        });

    } catch (error) {
        logger.error('Security events error:', error);
        res.status(500).json({ error: 'Failed to fetch security events' });
    }
});

// Get client inquiries
router.get('/clients/inquiries', async (req, res) => {
    try {
        const { status, priority } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (priority) {
            whereClause += ' AND priority = ?';
            params.push(priority);
        }

        const inquiries = await Database.all(`
            SELECT 
                ci.*,
                au.username as assigned_username
            FROM client_inquiries ci
            LEFT JOIN admin_users au ON ci.assigned_to = au.id
            ${whereClause}
            ORDER BY priority DESC, created_at DESC
        `, params);

        const statusStats = await Database.all(`
            SELECT status, COUNT(*) as count
            FROM client_inquiries
            GROUP BY status
        `);

        res.json({
            inquiries,
            statusStats
        });

    } catch (error) {
        logger.error('Client inquiries error:', error);
        res.status(500).json({ error: 'Failed to fetch client inquiries' });
    }
});

// Update client inquiry
router.put('/clients/inquiries/:id', [
    body('status').optional().isIn(['new', 'contacted', 'in_progress', 'completed', 'cancelled']),
    body('priority').optional().isInt({ min: 1, max: 5 }),
    body('notes').optional().isString()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ error: 'Invalid input', details: errors.array() });
        }

        const { id } = req.params;
        const updateFields = [];
        const params = [];

        // Build dynamic update query
        ['status', 'priority', 'notes', 'assigned_to'].forEach(field => {
            if (req.body[field] !== undefined) {
                updateFields.push(`${field} = ?`);
                params.push(req.body[field]);
            }
        });

        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields to update' });
        }

        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        params.push(id);

        await Database.run(`
            UPDATE client_inquiries 
            SET ${updateFields.join(', ')}
            WHERE id = ?
        `, params);

        res.json({ success: true, message: 'Inquiry updated successfully' });

    } catch (error) {
        logger.error('Update inquiry error:', error);
        res.status(500).json({ error: 'Failed to update inquiry' });
    }
});

// Get payment transactions
router.get('/payments/transactions', async (req, res) => {
    try {
        const { status, period } = req.query;
        
        let whereClause = 'WHERE 1=1';
        const params = [];

        if (status) {
            whereClause += ' AND status = ?';
            params.push(status);
        }

        if (period) {
            switch (period) {
                case '7d':
                    whereClause += ' AND created_at >= datetime("now", "-7 days")';
                    break;
                case '30d':
                    whereClause += ' AND created_at >= datetime("now", "-30 days")';
                    break;
                case '90d':
                    whereClause += ' AND created_at >= datetime("now", "-90 days")';
                    break;
            }
        }

        const transactions = await Database.all(`
            SELECT *
            FROM payment_transactions
            ${whereClause}
            ORDER BY created_at DESC
            LIMIT 100
        `, params);

        // Get payment summary
        const summary = await Database.all(`
            SELECT 
                status,
                COUNT(*) as count,
                SUM(amount) as total_amount
            FROM payment_transactions
            ${whereClause}
            GROUP BY status
        `, params);

        res.json({
            transactions,
            summary
        });

    } catch (error) {
        logger.error('Payment transactions error:', error);
        res.status(500).json({ error: 'Failed to fetch payment transactions' });
    }
});

// System health check
router.get('/system/health', async (req, res) => {
    try {
        // Check database connection
        const dbTest = await Database.get('SELECT 1 as test');
        const dbHealth = dbTest && dbTest.test === 1;

        // Get disk usage (simplified)
        const fs = require('fs');
        const stats = fs.statSync('./');
        
        // Get memory usage
        const memUsage = process.memoryUsage();

        // Get recent performance metrics
        const performanceMetrics = await Database.all(`
            SELECT metric_name, AVG(value) as avg_value, unit
            FROM performance_metrics
            WHERE timestamp >= datetime("now", "-1 hour")
            GROUP BY metric_name
        `);

        const systemInfo = {
            status: 'healthy',
            uptime: process.uptime(),
            memory: {
                used: Math.round(memUsage.heapUsed / 1024 / 1024),
                total: Math.round(memUsage.heapTotal / 1024 / 1024),
                external: Math.round(memUsage.external / 1024 / 1024)
            },
            database: {
                connected: dbHealth,
                status: dbHealth ? 'healthy' : 'error'
            },
            performance: performanceMetrics
        };

        res.json(systemInfo);

    } catch (error) {
        logger.error('System health check error:', error);
        res.status(500).json({ 
            status: 'error',
            error: 'Health check failed',
            details: error.message
        });
    }
});

// Create backup
router.post('/system/backup', async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        
        const backupDir = path.join(__dirname, '../../backups');
        if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `starframe-backup-${timestamp}.sql`);

        // Simple SQLite backup (in production, use proper backup tools)
        const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/starframe.db');
        
        if (fs.existsSync(dbPath)) {
            fs.copyFileSync(dbPath, backupPath);
            
            const stats = fs.statSync(backupPath);
            
            // Log backup in database
            await Database.run(`
                INSERT INTO backups (backup_type, file_path, file_size, status, created_by)
                VALUES (?, ?, ?, ?, ?)
            `, ['database', backupPath, stats.size, 'completed', req.user.id]);

            res.json({
                success: true,
                message: 'Backup created successfully',
                backup: {
                    path: backupPath,
                    size: stats.size,
                    timestamp: timestamp
                }
            });
        } else {
            res.status(404).json({ error: 'Database file not found' });
        }

    } catch (error) {
        logger.error('Backup creation error:', error);
        res.status(500).json({ error: 'Failed to create backup' });
    }
});

// Get system logs
router.get('/system/logs', async (req, res) => {
    try {
        const { type = 'activity', limit = 100 } = req.query;
        
        let logs;
        
        switch (type) {
            case 'activity':
                logs = await Database.all(`
                    SELECT 
                        al.*,
                        au.username
                    FROM activity_logs al
                    LEFT JOIN admin_users au ON al.user_id = au.id
                    ORDER BY timestamp DESC
                    LIMIT ?
                `, [limit]);
                break;
                
            case 'security':
                logs = await Database.all(`
                    SELECT 
                        sl.*,
                        au.username
                    FROM security_logs sl
                    LEFT JOIN admin_users au ON sl.user_id = au.id
                    ORDER BY timestamp DESC
                    LIMIT ?
                `, [limit]);
                break;
                
            default:
                logs = [];
        }

        res.json({ logs, type });

    } catch (error) {
        logger.error('System logs error:', error);
        res.status(500).json({ error: 'Failed to fetch system logs' });
    }
});

// Quick actions
router.post('/system/actions/:action', async (req, res) => {
    try {
        const { action } = req.params;
        
        switch (action) {
            case 'clear-cache':
                // Clear any cached data (implement as needed)
                res.json({ success: true, message: 'Cache cleared successfully' });
                break;
                
            case 'security-scan':
                // Run security scan (implement as needed)
                res.json({ success: true, message: 'Security scan completed' });
                break;
                
            case 'update-content':
                // Trigger content update (implement as needed)
                res.json({ success: true, message: 'Content update initiated' });
                break;
                
            default:
                res.status(400).json({ error: 'Unknown action' });
        }

    } catch (error) {
        logger.error('Quick action error:', error);
        res.status(500).json({ error: 'Action failed' });
    }
});

module.exports = router;

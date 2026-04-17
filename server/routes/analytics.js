const express = require('express');
const Database = require('../models/Database');
const analytics = require('../middleware/analytics');
const auth = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Get comprehensive analytics overview
router.get('/overview', async (req, res) => {
    try {
        const { period = '30d' } = req.query;

        let timeFilter = 'datetime("now", "-30 days")';
        switch (period) {
            case '7d': timeFilter = 'datetime("now", "-7 days")'; break;
            case '30d': timeFilter = 'datetime("now", "-30 days")'; break;
            case '90d': timeFilter = 'datetime("now", "-90 days")'; break;
        }

        // Visitor metrics
        const visitorMetrics = await Database.get(`
            SELECT 
                COUNT(*) as total_visits,
                COUNT(DISTINCT ip_address) as unique_visitors,
                COUNT(DISTINCT session_id) as sessions,
                AVG(pages_viewed) as avg_pages_per_session
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter}
        `);

        // Top pages
        const topPages = await Database.all(`
            SELECT 
                page_url,
                COUNT(*) as visits
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter}
            GROUP BY page_url
            ORDER BY visits DESC
            LIMIT 10
        `);

        // Device breakdown
        const deviceStats = await Database.all(`
            SELECT 
                device_type,
                COUNT(*) as visits,
                ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM visitor_analytics WHERE timestamp >= ${timeFilter}), 2) as percentage
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter}
            GROUP BY device_type
        `);

        // Geographic data
        const countryStats = await Database.all(`
            SELECT 
                country,
                COUNT(*) as visits
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter} AND country != ''
            GROUP BY country
            ORDER BY visits DESC
            LIMIT 15
        `);

        // Referrer data
        const referrerStats = await Database.all(`
            SELECT 
                CASE 
                    WHEN referrer = '' OR referrer IS NULL THEN 'Direct'
                    WHEN referrer LIKE '%google%' THEN 'Google'
                    WHEN referrer LIKE '%facebook%' THEN 'Facebook'
                    WHEN referrer LIKE '%twitter%' THEN 'Twitter'
                    ELSE 'Other'
                END as source,
                COUNT(*) as visits
            FROM visitor_analytics 
            WHERE timestamp >= ${timeFilter}
            GROUP BY source
            ORDER BY visits DESC
        `);

        res.json({
            period,
            metrics: visitorMetrics,
            topPages,
            deviceStats,
            countryStats,
            referrerStats
        });

    } catch (error) {
        logger.error('Analytics overview error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics overview' });
    }
});



// Real-time tracking endpoint (receives client-side events)
router.post('/track', async (req, res) => {
    try {
        const trackingData = req.body;
        const ip = req.ip || req.connection.remoteAddress;
        const userAgent = req.get('User-Agent');

        // Parse device info if not already present
        const deviceInfo = parseUserAgent(userAgent);

        // Store detailed interaction data
        await Database.run(`
            INSERT INTO visitor_analytics (
                ip_address, user_agent, page_url, referrer, 
                device_type, browser, os, session_id, timestamp,
                interaction_type, interaction_data
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            ip,
            userAgent,
            trackingData.page_url || trackingData.current_page,
            trackingData.referrer || null,
            deviceInfo.deviceType,
            deviceInfo.browser,
            deviceInfo.os,
            trackingData.session_id,
            trackingData.timestamp,
            trackingData.type,
            JSON.stringify(trackingData)
        ]);

        // Update active visitors in real-time
        analytics.updateActiveVisitors({
            ip_address: ip,
            session_id: trackingData.session_id,
            page_url: trackingData.page_url || trackingData.current_page,
            device_type: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            timestamp: new Date(trackingData.timestamp)
        });

        // Log significant events
        if (['page_view', 'form_submission', 'link_click'].includes(trackingData.type)) {
            logger.info(`Real-time tracking: ${trackingData.type}`, {
                page: trackingData.page_url || trackingData.current_page,
                ip: ip.substring(0, 10) + '...' // Partial IP for privacy
            });
        }

        res.json({ success: true, received: trackingData.type });

    } catch (error) {
        logger.error('Real-time tracking error:', error);
        res.status(500).json({ error: 'Failed to track event' });
    }
});

// Helper function to parse user agent
function parseUserAgent(userAgent) {
    const ua = (userAgent || '').toLowerCase();

    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|phone|tablet/.test(ua)) {
        if (/tablet|ipad/.test(ua)) {
            deviceType = 'tablet';
        } else {
            deviceType = 'mobile';
        }
    }

    let browser = 'unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';
    else if (ua.includes('opera')) browser = 'Opera';

    let os = 'unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios')) os = 'iOS';

    return { deviceType, browser, os };
}

// Get real-time analytics (public endpoint for basic stats)
router.get('/realtime', async (req, res) => {
    try {
        // Check if this is an authenticated admin request
        const isAdmin = req.session && req.session.token;

        if (isAdmin) {
            // Return detailed stats for admin
            const stats = await Database.getRealtimeStats();
            return res.json({
                success: true,
                data: stats
            });
        }

        // Return basic stats for public use
        const recentPageViews = await Database.get(`
            SELECT COUNT(*) as count
            FROM visitor_analytics 
            WHERE timestamp >= datetime("now", "-1 hour")
        `);

        res.json({
            activeVisitors: 0, // Will be updated via socket
            currentPageViews: recentPageViews?.count || 0,
            lastUpdate: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Real-time analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch real-time analytics'
        });
    }
});

// Visitor analytics with timeframe
router.get('/visitors', auth.requireAuth, async (req, res) => {
    try {
        const { timeframe = '24h' } = req.query;
        const analytics = await Database.getVisitorAnalytics(timeframe);

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        logger.error('Visitor analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch visitor analytics'
        });
    }
});

// User analytics with timeframe
router.get('/users', auth.requireAuth, async (req, res) => {
    try {
        const { timeframe = '24h' } = req.query;
        const analytics = await Database.getClientAnalytics(timeframe);

        res.json({
            success: true,
            data: analytics
        });
    } catch (error) {
        logger.error('User analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user analytics'
        });
    }
});

// Visitor trends for charts
router.get('/trends', auth.requireAuth, async (req, res) => {
    try {
        const { hours = 24 } = req.query;

        // Generate hourly trends data
        const trends = [];
        const now = new Date();

        for (let i = parseInt(hours) - 1; i >= 0; i--) {
            const hour = new Date(now);
            hour.setHours(hour.getHours() - i, 0, 0, 0);

            // Get visitor count for this hour
            const hourEnd = new Date(hour);
            hourEnd.setHours(hourEnd.getHours() + 1);

            const visitors = await Database.all(
                `SELECT COUNT(*) as count FROM visitor_tracking 
                 WHERE timestamp >= ? AND timestamp < ?`,
                [hour.toISOString(), hourEnd.toISOString()]
            );

            trends.push({
                hour: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                visitors: visitors[0]?.count || 0,
                timestamp: hour.toISOString()
            });
        }

        res.json({
            success: true,
            trends: trends
        });
    } catch (error) {
        logger.error('Trends analytics error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trends data'
        });
    }
});

module.exports = router;

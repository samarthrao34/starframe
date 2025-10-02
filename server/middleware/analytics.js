const Database = require('../models/Database');
const logger = require('../utils/logger');

class AnalyticsMiddleware {
    constructor() {
        this.activeVisitors = new Map(); // Track active visitors
        this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
        
        // Clean up inactive sessions every 5 minutes
        setInterval(() => {
            this.cleanupInactiveSessions();
        }, 5 * 60 * 1000);
    }

    // Main visitor tracking middleware
    trackVisitor() {
        return async (req, res, next) => {
            try {
                // Skip tracking for admin, API endpoints, and assets
                if (req.path.startsWith('/admin') || 
                    req.path.startsWith('/api') || 
                    req.path.startsWith('/node_modules') ||
                    req.path.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
                    return next();
                }

                const visitorData = await this.extractVisitorInfo(req);
                await this.recordVisit(visitorData);
                this.updateActiveVisitors(visitorData);
                
            } catch (error) {
                logger.error('Analytics tracking error:', error);
            }
            next();
        };
    }

    // Extract visitor information from request
    async extractVisitorInfo(req) {
        const ip = req.ip || req.connection.remoteAddress || 'unknown';
        const userAgent = req.get('User-Agent') || '';
        const referrer = req.get('Referer') || '';
        const pageUrl = req.protocol + '://' + req.get('host') + req.originalUrl;
        
        // Parse user agent for device/browser info
        const deviceInfo = this.parseUserAgent(userAgent);
        
        // Generate or get session ID
        const sessionId = req.session?.id || this.generateSessionId();
        
        return {
            ip_address: ip,
            user_agent: userAgent,
            referrer: referrer,
            page_url: pageUrl,
            country: null, // Could integrate with IP geolocation service
            city: null,
            device_type: deviceInfo.deviceType,
            browser: deviceInfo.browser,
            os: deviceInfo.os,
            session_id: sessionId,
            timestamp: new Date()
        };
    }

    // Parse user agent string
    parseUserAgent(userAgent) {
        const ua = userAgent.toLowerCase();
        
        // Detect device type
        let deviceType = 'desktop';
        if (/mobile|android|iphone|ipad|phone|tablet/.test(ua)) {
            if (/tablet|ipad/.test(ua)) {
                deviceType = 'tablet';
            } else {
                deviceType = 'mobile';
            }
        }

        // Detect browser
        let browser = 'unknown';
        if (ua.includes('chrome')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari')) browser = 'Safari';
        else if (ua.includes('edge')) browser = 'Edge';
        else if (ua.includes('opera')) browser = 'Opera';

        // Detect OS
        let os = 'unknown';
        if (ua.includes('windows')) os = 'Windows';
        else if (ua.includes('mac')) os = 'macOS';
        else if (ua.includes('linux')) os = 'Linux';
        else if (ua.includes('android')) os = 'Android';
        else if (ua.includes('ios')) os = 'iOS';

        return { deviceType, browser, os };
    }

    // Record visit in database
    async recordVisit(visitorData) {
        try {
            await Database.trackVisitor(visitorData);
        } catch (error) {
            logger.error('Failed to record visitor data:', error);
        }
    }

    // Update active visitors tracking
    updateActiveVisitors(visitorData) {
        const sessionKey = `${visitorData.ip_address}_${visitorData.session_id}`;
        this.activeVisitors.set(sessionKey, {
            ...visitorData,
            lastSeen: Date.now()
        });
    }

    // Clean up inactive sessions
    cleanupInactiveSessions() {
        const now = Date.now();
        for (const [key, visitor] of this.activeVisitors) {
            if (now - visitor.lastSeen > this.sessionTimeout) {
                this.activeVisitors.delete(key);
            }
        }
    }

    // Get current active visitors count
    getActiveVisitorsCount() {
        return this.activeVisitors.size;
    }

    // Get active visitors details
    getActiveVisitors() {
        const now = Date.now();
        return Array.from(this.activeVisitors.values())
            .filter(visitor => now - visitor.lastSeen < this.sessionTimeout)
            .map(visitor => ({
                ip_address: this.maskIP(visitor.ip_address),
                country: visitor.country || 'Unknown',
                device_type: visitor.device_type,
                browser: visitor.browser,
                current_page: visitor.page_url,
                time_on_site: Math.floor((now - new Date(visitor.timestamp).getTime()) / 1000)
            }));
    }

    // Mask IP address for privacy
    maskIP(ip) {
        if (ip.includes(':')) {
            // IPv6
            const parts = ip.split(':');
            return parts.slice(0, 4).join(':') + ':****';
        } else {
            // IPv4
            const parts = ip.split('.');
            return parts.slice(0, 3).join('.') + '.*';
        }
    }

    // Generate session ID
    generateSessionId() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    // Get analytics summary
    async getAnalyticsSummary(timeRange = '24h') {
        try {
            let timeCondition = '';
            if (timeRange === '24h') {
                timeCondition = "WHERE timestamp > datetime('now', '-1 day')";
            } else if (timeRange === '7d') {
                timeCondition = "WHERE timestamp > datetime('now', '-7 days')";
            } else if (timeRange === '30d') {
                timeCondition = "WHERE timestamp > datetime('now', '-30 days')";
            }

            const [totalVisitors, uniqueVisitors, pageViews, topPages, deviceStats] = await Promise.all([
                Database.get(`SELECT COUNT(*) as count FROM visitor_analytics ${timeCondition}`),
                Database.get(`SELECT COUNT(DISTINCT ip_address) as count FROM visitor_analytics ${timeCondition}`),
                Database.get(`SELECT COUNT(*) as count FROM visitor_analytics ${timeCondition}`),
                Database.all(`SELECT page_url, COUNT(*) as views FROM visitor_analytics ${timeCondition} GROUP BY page_url ORDER BY views DESC LIMIT 10`),
                Database.all(`SELECT device_type, COUNT(*) as count FROM visitor_analytics ${timeCondition} GROUP BY device_type`)
            ]);

            return {
                totalVisitors: totalVisitors?.count || 0,
                uniqueVisitors: uniqueVisitors?.count || 0,
                pageViews: pageViews?.count || 0,
                activeVisitors: this.getActiveVisitorsCount(),
                topPages,
                deviceStats
            };
        } catch (error) {
            logger.error('Failed to get analytics summary:', error);
            return {
                totalVisitors: 0,
                uniqueVisitors: 0,
                pageViews: 0,
                activeVisitors: 0,
                topPages: [],
                deviceStats: []
            };
        }
    }

    // Get visitor trends (hourly data for charts)
    async getVisitorTrends(hours = 24) {
        try {
            const trends = await Database.all(`
                SELECT 
                    strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                    COUNT(*) as visitors
                FROM visitor_analytics 
                WHERE timestamp > datetime('now', '-${hours} hours')
                GROUP BY strftime('%Y-%m-%d %H:00:00', timestamp)
                ORDER BY hour
            `);

            // Fill in missing hours with 0 visitors
            const result = [];
            const now = new Date();
            for (let i = hours - 1; i >= 0; i--) {
                const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
                const hourString = hour.toISOString().slice(0, 13) + ':00:00';
                const found = trends.find(t => t.hour === hourString.replace('T', ' '));
                result.push({
                    hour: hour.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    visitors: found ? found.visitors : 0
                });
            }

            return result;
        } catch (error) {
            logger.error('Failed to get visitor trends:', error);
            return [];
        }
    }
}

// Create singleton instance
const analytics = new AnalyticsMiddleware();

module.exports = analytics;

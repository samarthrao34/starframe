const geoip = require('geoip-lite');
const { UAParser } = require('ua-parser-js');
const Database = require('../models/Database');
const logger = require('../utils/logger');

class SecurityMiddleware {
    constructor() {
        this.suspiciousIPs = new Set();
        this.requestCounts = new Map();
        this.monitoringEnabled = true;
    }

    // Monitor requests for security threats
    monitor = async (req, res, next) => {
        if (!this.monitoringEnabled) {
            return next();
        }

        try {
            const startTime = process.hrtime();
            const clientIP = this.getClientIP(req);
            const userAgent = req.get('User-Agent') || 'Unknown';
            
            // Parse user agent
            const parser = new UAParser(userAgent);
            const result = parser.getResult();
            const deviceInfo = {
                browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
                os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
                device: result.device.type || 'desktop'
            };

            // Get location information
            const location = geoip.lookup(clientIP);
            const locationInfo = location ? {
                country: location.country,
                city: location.city,
                region: location.region,
                timezone: location.timezone
            } : null;

            // Check for suspicious activity
            await this.detectSuspiciousActivity(req, clientIP, userAgent, locationInfo);

            // Track request for rate limiting
            this.trackRequest(clientIP);

            // Track visitor analytics for main website
            if (!req.originalUrl.startsWith('/api/') && !req.originalUrl.startsWith('/admin/')) {
                await this.trackVisitor(req, clientIP, deviceInfo, locationInfo);
            }

            // Performance monitoring
            res.on('finish', () => {
                const [seconds, nanoseconds] = process.hrtime(startTime);
                const responseTime = seconds * 1000 + nanoseconds / 1000000; // Convert to milliseconds

                // Log slow requests
                if (responseTime > 1000) { // Requests taking more than 1 second
                    logger.performance('Slow request detected', {
                        url: req.originalUrl,
                        method: req.method,
                        responseTime: `${responseTime.toFixed(2)}ms`,
                        statusCode: res.statusCode,
                        ip: clientIP
                    });
                }

                // Store performance metrics
                this.storePerformanceMetric('response_time', responseTime, 'ms');
            });

            next();
        } catch (error) {
            logger.error('Security monitoring error:', error);
            next(); // Continue even if monitoring fails
        }
    };

    // Get real client IP address
    getClientIP(req) {
        return req.headers['cf-connecting-ip'] || 
               req.headers['x-real-ip'] || 
               req.headers['x-forwarded-for']?.split(',')[0] || 
               req.connection.remoteAddress ||
               req.socket.remoteAddress ||
               (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
               '127.0.0.1';
    }

    // Detect suspicious activities
    async detectSuspiciousActivity(req, clientIP, userAgent, location) {
        const suspiciousPatterns = [
            // SQL injection attempts
            /(\bUNION\b.*\bSELECT\b)|(\bSELECT\b.*\bFROM\b)|(\bINSERT\b.*\bINTO\b)/i,
            // XSS attempts
            /<script[^>]*>.*?<\/script>/gi,
            // Path traversal
            /\.\.(\/|\\)/,
            // Common attack patterns
            /\b(eval|exec|system|shell_exec|passthru)\b/i,
            // Bot patterns
            /bot|crawler|spider|scraper/i
        ];

        let suspiciousScore = 0;
        const alerts = [];

        // Check URL for suspicious patterns
        const fullUrl = req.originalUrl + JSON.stringify(req.query) + JSON.stringify(req.body || {});
        for (const pattern of suspiciousPatterns) {
            if (pattern.test(fullUrl)) {
                suspiciousScore += 10;
                alerts.push(`Suspicious pattern detected: ${pattern}`);
            }
        }

        // Check for unusual request patterns
        if (req.method === 'POST' && !req.get('Content-Type')) {
            suspiciousScore += 5;
            alerts.push('POST request without Content-Type');
        }

        // Check user agent
        if (!userAgent || userAgent === 'Unknown' || userAgent.length < 10) {
            suspiciousScore += 5;
            alerts.push('Suspicious or missing user agent');
        }

        // Check for rapid requests from same IP
        const requestCount = this.getRequestCount(clientIP);
        if (requestCount > 50) { // More than 50 requests in 5 minutes
            suspiciousScore += 15;
            alerts.push(`High request frequency: ${requestCount} requests`);
        }

        // Check for requests from high-risk countries (basic example)
        const highRiskCountries = ['CN', 'RU', 'KP']; // Add more as needed
        if (location && highRiskCountries.includes(location.country)) {
            suspiciousScore += 3;
            alerts.push(`Request from high-risk country: ${location.country}`);
        }

        // Log if suspicious
        if (suspiciousScore >= 10) {
            this.suspiciousIPs.add(clientIP);
            
            await Database.logSecurityEvent({
                event_type: 'suspicious_activity',
                severity: suspiciousScore >= 20 ? 'high' : 'medium',
                ip_address: clientIP,
                user_agent: userAgent,
                user_id: req.user?.id || null,
                details: JSON.stringify({
                    score: suspiciousScore,
                    alerts: alerts,
                    url: req.originalUrl,
                    method: req.method,
                    location: location
                })
            });

            logger.security('Suspicious activity detected', {
                ip: clientIP,
                score: suspiciousScore,
                alerts: alerts,
                url: req.originalUrl,
                userAgent: userAgent
            });
        }

        return suspiciousScore;
    }

    // Track requests for rate limiting
    trackRequest(clientIP) {
        const now = Date.now();
        const timeWindow = 5 * 60 * 1000; // 5 minutes

        if (!this.requestCounts.has(clientIP)) {
            this.requestCounts.set(clientIP, []);
        }

        const requests = this.requestCounts.get(clientIP);
        requests.push(now);

        // Remove old requests outside the time window
        const validRequests = requests.filter(timestamp => now - timestamp < timeWindow);
        this.requestCounts.set(clientIP, validRequests);
    }

    // Get request count for IP
    getRequestCount(clientIP) {
        return this.requestCounts.get(clientIP)?.length || 0;
    }

    // Track website visitors
    async trackVisitor(req, clientIP, deviceInfo, locationInfo) {
        try {
            const sessionId = req.session.id || this.generateSessionId();
            
            const visitorData = {
                ip_address: clientIP,
                user_agent: req.get('User-Agent'),
                referrer: req.get('Referer') || '',
                page_url: req.originalUrl,
                country: locationInfo?.country || '',
                city: locationInfo?.city || '',
                device_type: this.getDeviceType(deviceInfo),
                browser: deviceInfo.browser,
                os: deviceInfo.os,
                session_id: sessionId
            };

            await Database.trackVisitor(visitorData);
        } catch (error) {
            logger.error('Failed to track visitor:', error);
        }
    }

    // Generate session ID
    generateSessionId() {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }

    // Determine device type
    getDeviceType(deviceInfo) {
        // deviceInfo.device already contains the device type from UAParser
        const deviceType = deviceInfo.device;
        
        if (deviceType === 'mobile') {
            return 'mobile';
        } else if (deviceType === 'tablet') {
            return 'tablet';
        } else if (deviceType === 'smarttv') {
            return 'smarttv';
        } else if (deviceType === 'wearable') {
            return 'wearable';
        } else if (deviceType === 'embedded') {
            return 'embedded';
        }
        
        // Default to desktop for undefined or unknown types
        return 'desktop';
    }

    // Store performance metrics
    async storePerformanceMetric(metricName, value, unit) {
        try {
            await Database.run(
                'INSERT INTO performance_metrics (metric_name, value, unit) VALUES (?, ?, ?)',
                [metricName, value, unit]
            );
        } catch (error) {
            logger.error('Failed to store performance metric:', error);
        }
    }

    // Block suspicious IPs middleware
    blockSuspiciousIPs = (req, res, next) => {
        const clientIP = this.getClientIP(req);
        
        if (this.suspiciousIPs.has(clientIP)) {
            logger.security('Blocked request from suspicious IP', {
                ip: clientIP,
                url: req.originalUrl,
                userAgent: req.get('User-Agent')
            });
            
            return res.status(403).json({ 
                error: 'Access denied',
                message: 'Your IP has been flagged for suspicious activity'
            });
        }
        
        next();
    };

    // Clean up old data periodically
    cleanup() {
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        // Clean up request counts
        for (const [ip, requests] of this.requestCounts.entries()) {
            const validRequests = requests.filter(timestamp => now - timestamp < maxAge);
            if (validRequests.length === 0) {
                this.requestCounts.delete(ip);
            } else {
                this.requestCounts.set(ip, validRequests);
            }
        }

        // Clean up suspicious IPs (reset daily)
        if (Math.random() < 0.1) { // 10% chance to clean up
            this.suspiciousIPs.clear();
        }
    }

    // Get security statistics
    getSecurityStats() {
        return {
            suspiciousIPs: this.suspiciousIPs.size,
            monitoredIPs: this.requestCounts.size,
            totalRequests: Array.from(this.requestCounts.values())
                .reduce((sum, requests) => sum + requests.length, 0),
            monitoringEnabled: this.monitoringEnabled
        };
    }

    // Enable/disable monitoring
    setMonitoring(enabled) {
        this.monitoringEnabled = enabled;
        logger.info(`Security monitoring ${enabled ? 'enabled' : 'disabled'}`);
    }
}

// Create singleton instance
const securityMiddleware = new SecurityMiddleware();

// Clean up periodically
setInterval(() => {
    securityMiddleware.cleanup();
}, 60 * 60 * 1000); // Every hour

module.exports = securityMiddleware;

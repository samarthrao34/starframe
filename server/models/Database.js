const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            try {
                // Ensure data directory exists
                const dataDir = path.join(__dirname, '../../data');
                if (!fs.existsSync(dataDir)) {
                    fs.mkdirSync(dataDir, { recursive: true });
                }

                const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'starframe.db');
                
                this.db = new sqlite3.Database(dbPath, async (err) => {
                    if (err) {
                        logger.error('Error opening database:', err);
                        return reject(err);
                    }
                    logger.info('Connected to SQLite database');

                    // Enable foreign keys
                    await this.run('PRAGMA foreign_keys = ON');
                    
                    // Create tables
                    await this.createTables();
                    
                    logger.info('Database initialized successfully');
                    resolve();
                });
            } catch (error) {
                logger.error('Database initialization failed:', error);
                reject(error);
            }
        });
    }

    async createTables() {
        const tables = [
            // Admin users table
            `CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                two_factor_secret TEXT,
                is_2fa_enabled BOOLEAN DEFAULT 0,
                is_active BOOLEAN DEFAULT 1,
                last_login DATETIME,
                failed_attempts INTEGER DEFAULT 0,
                locked_until DATETIME,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // User sessions table
            `CREATE TABLE IF NOT EXISTS user_sessions (
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                location TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES admin_users (id)
            )`,

            // Website visitors tracking
            `CREATE TABLE IF NOT EXISTS visitor_analytics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ip_address TEXT,
                user_agent TEXT,
                referrer TEXT,
                page_url TEXT,
                country TEXT,
                city TEXT,
                device_type TEXT,
                browser TEXT,
                os TEXT,
                session_id TEXT,
                visit_duration INTEGER,
                pages_viewed INTEGER DEFAULT 1,
                interaction_type TEXT,
                interaction_data TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Payment tracking (for future payment integration)
            `CREATE TABLE IF NOT EXISTS payment_transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT UNIQUE,
                client_email TEXT,
                client_name TEXT,
                amount DECIMAL(10,2),
                currency TEXT DEFAULT 'USD',
                status TEXT, -- pending, completed, failed, refunded
                payment_method TEXT,
                project_details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Client inquiries and projects
            `CREATE TABLE IF NOT EXISTS client_inquiries (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                project_type TEXT,
                budget_range TEXT,
                timeline TEXT,
                description TEXT,
                status TEXT DEFAULT 'new', -- new, contacted, in_progress, completed, cancelled
                priority INTEGER DEFAULT 1, -- 1-5, 5 being highest
                assigned_to INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (assigned_to) REFERENCES admin_users (id)
            )`,

            // Security logs
            `CREATE TABLE IF NOT EXISTS security_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT, -- login_attempt, failed_login, suspicious_activity, etc.
                severity TEXT, -- low, medium, high, critical
                ip_address TEXT,
                user_agent TEXT,
                user_id INTEGER,
                details TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES admin_users (id)
            )`,

            // System activity logs
            `CREATE TABLE IF NOT EXISTS activity_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                action TEXT,
                resource TEXT,
                resource_id TEXT,
                old_values TEXT,
                new_values TEXT,
                ip_address TEXT,
                user_agent TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES admin_users (id)
            )`,

            // Website content management
            `CREATE TABLE IF NOT EXISTS content_updates (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page TEXT,
                section TEXT,
                content_type TEXT, -- text, image, video
                old_content TEXT,
                new_content TEXT,
                updated_by INTEGER,
                status TEXT DEFAULT 'pending', -- pending, approved, published
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by) REFERENCES admin_users (id)
            )`,

            // System backups
            `CREATE TABLE IF NOT EXISTS backups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                backup_type TEXT, -- full, incremental, database
                file_path TEXT,
                file_size INTEGER,
                status TEXT, -- completed, failed, in_progress
                created_by INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES admin_users (id)
            )`,

            // Performance metrics
            `CREATE TABLE IF NOT EXISTS performance_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT,
                value DECIMAL(10,4),
                unit TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Email notifications queue
            `CREATE TABLE IF NOT EXISTS notification_queue (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient TEXT,
                subject TEXT,
                message TEXT,
                type TEXT, -- security_alert, client_inquiry, system_notification
                status TEXT DEFAULT 'pending', -- pending, sent, failed
                attempts INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                sent_at DATETIME
            )`,

            // Google OAuth users table
            `CREATE TABLE IF NOT EXISTS oauth_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                google_id TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                name TEXT NOT NULL,
                picture TEXT,
                access_token TEXT,
                refresh_token TEXT,
                preferences TEXT DEFAULT '{}',
                last_login DATETIME,
                is_active BOOLEAN DEFAULT 1,
                session_id TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Enhanced visitor tracking with real-time features
            `CREATE TABLE IF NOT EXISTS visitor_tracking (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                socket_id TEXT,
                user_id INTEGER,
                page TEXT,
                url TEXT,
                referrer TEXT,
                user_agent TEXT,
                ip_address TEXT,
                country TEXT,
                city TEXT,
                device_type TEXT,
                browser TEXT,
                os TEXT,
                session_duration INTEGER DEFAULT 0,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES oauth_users (id)
            )`,

            // User action tracking
            `CREATE TABLE IF NOT EXISTS user_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                socket_id TEXT,
                user_id INTEGER,
                action TEXT NOT NULL,
                target TEXT,
                value TEXT,
                page TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES oauth_users (id)
            )`,

            `CREATE TABLE IF NOT EXISTS commissions (
                id TEXT PRIMARY KEY,
                name TEXT,
                email TEXT,
                phone TEXT,
                location TEXT,
                service TEXT,
                budget TEXT,
                timeline TEXT,
                purpose TEXT,
                description TEXT,
                reference_links TEXT,
                gst BOOLEAN
            )`,

            // Reviews table
            `CREATE TABLE IF NOT EXISTS reviews (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                city TEXT,
                rating INTEGER NOT NULL CHECK(rating BETWEEN 1 AND 5),
                message TEXT NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Policy pages management
            `CREATE TABLE IF NOT EXISTS policy_pages (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_name TEXT UNIQUE NOT NULL,
                content TEXT NOT NULL,
                updated_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (updated_by) REFERENCES admin_users (id)
            )`
        ];

        for (const tableSQL of tables) {
            await this.run(tableSQL);
        }

        // Create indexes for better performance
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_visitor_analytics_timestamp ON visitor_analytics(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_visitor_analytics_ip ON visitor_analytics(ip_address)',
            'CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity)',
            'CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_client_inquiries_status ON client_inquiries(status)',
            'CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status)',
            'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at)'
        ];

        for (const indexSQL of indexes) {
            await this.run(indexSQL);
        }
    }

    run(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function(err) {
                if (err) {
                    logger.error('Database run error:', err, 'SQL:', sql);
                    reject(err);
                } else {
                    resolve({ id: this.lastID, changes: this.changes });
                }
            });
        });
    }

    get(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(sql, params, (err, result) => {
                if (err) {
                    logger.error('Database get error:', err, 'SQL:', sql);
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }

    all(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    logger.error('Database all error:', err, 'SQL:', sql);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    close() {
        return new Promise((resolve) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        logger.error('Error closing database:', err);
                    } else {
                        logger.info('Database connection closed');
                    }
                    resolve();
                });
            } else {
                resolve();
            }
        });
    }

    // ========================================
    // === ADMIN USER METHODS ===
    // ========================================
    async createUser(userData) {
        const { username, email, password_hash, two_factor_secret } = userData;
        return await this.run(
            'INSERT INTO admin_users (username, email, password_hash, two_factor_secret) VALUES (?, ?, ?, ?)',
            [username, email, password_hash, two_factor_secret]
        );
    }

    async getUserByUsername(username) {
        return await this.get('SELECT * FROM admin_users WHERE username = ?', [username]);
    }

    async getUserByEmail(email) {
        return await this.get('SELECT * FROM admin_users WHERE email = ?', [email]);
    }

    async updateUserLastLogin(userId, ipAddress) {
        await this.run('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [userId]);
    }

    async logSecurityEvent(eventData) {
        const { event_type, severity, ip_address, user_agent, user_id, details } = eventData;
        return await this.run(
            'INSERT INTO security_logs (event_type, severity, ip_address, user_agent, user_id, details) VALUES (?, ?, ?, ?, ?, ?)',
            [event_type, severity, ip_address, user_agent, user_id, details]
        );
    }

    async logActivity(activityData) {
        const { user_id, action, resource, resource_id, old_values, new_values, ip_address, user_agent } = activityData;
        return await this.run(
            'INSERT INTO activity_logs (user_id, action, resource, resource_id, old_values, new_values, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [user_id, action, resource, resource_id, old_values, new_values, ip_address, user_agent]
        );
    }

    async trackVisitor(visitorData) {
        const { ip_address, user_agent, referrer, page_url, country, city, device_type, browser, os, session_id } = visitorData;
        return await this.run(
            'INSERT INTO visitor_analytics (ip_address, user_agent, referrer, page_url, country, city, device_type, browser, os, session_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [ip_address, user_agent, referrer, page_url, country, city, device_type, browser, os, session_id]
        );
    }

    // ========================================
    // === OAUTH USER METHODS ===
    // ========================================
    async upsertUser(userData) {
        const { googleId, email, name, picture, accessToken, refreshToken } = userData;
        
        // Check if user exists
        const existingUser = await this.get('SELECT * FROM oauth_users WHERE google_id = ?', [googleId]);
        
        if (existingUser) {
            // Update existing user
            await this.run(
                'UPDATE oauth_users SET email = ?, name = ?, picture = ?, access_token = ?, refresh_token = ?, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE google_id = ?',
                [email, name, picture, accessToken, refreshToken, googleId]
            );
            return { ...existingUser, email, name, picture };
        } else {
            // Create new user
            const result = await this.run(
                'INSERT INTO oauth_users (google_id, email, name, picture, access_token, refresh_token, last_login) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [googleId, email, name, picture, accessToken, refreshToken]
            );
            return { id: result.id, google_id: googleId, email, name, picture };
        }
    }

    async getUserById(id) {
        return await this.get('SELECT * FROM oauth_users WHERE id = ?', [id]);
    }

    async getUserByGoogleId(googleId) {
        return await this.get('SELECT * FROM oauth_users WHERE google_id = ?', [googleId]);
    }

    async updateUserSession(userId, sessionId) {
        return await this.run(
            'UPDATE oauth_users SET session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [sessionId, userId]
        );
    }

    async updateUserPreferences(userId, preferences) {
        return await this.run(
            'UPDATE oauth_users SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(preferences), userId]
        );
    }

    // ========================================
    // === REAL-TIME TRACKING METHODS ===
    // ========================================
    async trackVisitorRealtime(visitorData) {
        const { socketId, page, url, referrer, userAgent, ipAddress, userId } = visitorData;
        return await this.run(
            'INSERT INTO visitor_tracking (socket_id, user_id, page, url, referrer, user_agent, ip_address) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [socketId, userId, page, url, referrer, userAgent, ipAddress]
        );
    }

    async trackUserAction(actionData) {
        const { socketId, userId, action, target, value, page } = actionData;
        return await this.run(
            'INSERT INTO user_actions (socket_id, user_id, action, target, value, page) VALUES (?, ?, ?, ?, ?, ?)',
            [socketId, userId, action, target, value, page]
        );
    }

    // ========================================
    // === ANALYTICS METHODS ===
    // ========================================
    async getVisitorAnalytics(timeframe = '24h') {
        let timeCondition = '';
        switch (timeframe) {
            case '1h':
                timeCondition = "WHERE timestamp >= datetime('now', '-1 hour')";
                break;
            case '24h':
                timeCondition = "WHERE timestamp >= datetime('now', '-24 hours')";
                break;
            case '7d':
                timeCondition = "WHERE timestamp >= datetime('now', '-7 days')";
                break;
            case '30d':
                timeCondition = "WHERE timestamp >= datetime('now', '-30 days')";
                break;
            default:
                timeCondition = "WHERE timestamp >= datetime('now', '-24 hours')";
        }
        
        const visitors = await this.all(`
            SELECT * FROM visitor_tracking 
            ${timeCondition} 
            ORDER BY timestamp DESC 
            LIMIT 1000
        `);
        
        const pageViews = await this.all(`
            SELECT page, COUNT(*) as count 
            FROM visitor_tracking 
            ${timeCondition} 
            GROUP BY page 
            ORDER BY count DESC
        `);
        
        const userActions = await this.all(`
            SELECT action, COUNT(*) as count 
            FROM user_actions 
            ${timeCondition} 
            GROUP BY action 
            ORDER BY count DESC
        `);
        
        return { visitors, pageViews, userActions };
    }


    async getUserAnalytics(timeframe = '24h') {
        let timeCondition = '';
        switch (timeframe) {
            case '1h':
                timeCondition = "WHERE last_login >= datetime('now', '-1 hour')";
                break;
            case '24h':
                timeCondition = "WHERE last_login >= datetime('now', '-24 hours')";
                break;
            case '7d':
                timeCondition = "WHERE last_login >= datetime('now', '-7 days')";
                break;
            case '30d':
                timeCondition = "WHERE last_login >= datetime('now', '-30 days')";
                break;
            default:
                timeCondition = "WHERE last_login >= datetime('now', '-24 hours')";
        }
        
        const users = await this.all(`
            SELECT id, name, email, picture, last_login, session_id, created_at
            FROM oauth_users 
            ${timeCondition} 
            ORDER BY last_login DESC
        `);
        
        const totalUsers = await this.get('SELECT COUNT(*) as count FROM oauth_users');
        const activeUsers = await this.get(`
            SELECT COUNT(*) as count 
            FROM oauth_users 
            WHERE session_id IS NOT NULL AND last_login >= datetime('now', '-1 hour')
        `);
        
        return { users, totalUsers: totalUsers.count, activeUsers: activeUsers.count };
    }

    async getRealtimeStats() {
        const stats = {
            activeVisitors: 0,
            totalPageViews: 0,
            recentActions: [],
            topPages: [],
            userActivity: []
        };
        
        // Get active visitors (last 5 minutes)
        const activeVisitors = await this.get(`
            SELECT COUNT(DISTINCT socket_id) as count 
            FROM visitor_tracking 
            WHERE timestamp >= datetime('now', '-5 minutes')
        `);
        stats.activeVisitors = activeVisitors.count;
        
        // Get total page views today
        const totalViews = await this.get(`
            SELECT COUNT(*) as count 
            FROM visitor_tracking 
            WHERE timestamp >= datetime('now', 'start of day')
        `);
        stats.totalPageViews = totalViews.count;
        
        // Get recent actions (last 10)
        const recentActions = await this.all(`
            SELECT ua.*, ou.name, ou.email 
            FROM user_actions ua 
            LEFT JOIN oauth_users ou ON ua.user_id = ou.id 
            ORDER BY ua.timestamp DESC 
            LIMIT 10
        `);
        stats.recentActions = recentActions;
        
        // Get top pages (today)
        const topPages = await this.all(`
            SELECT page, COUNT(*) as count 
            FROM visitor_tracking 
            WHERE timestamp >= datetime('now', 'start of day') 
            GROUP BY page 
            ORDER BY count DESC 
            LIMIT 5
        `);
        stats.topPages = topPages;
        
        // Get user activity (last hour)
        const userActivity = await this.all(`
            SELECT vt.*, ou.name, ou.email, ou.picture 
            FROM visitor_tracking vt 
            LEFT JOIN oauth_users ou ON vt.user_id = ou.id 
            WHERE vt.timestamp >= datetime('now', '-1 hour') 
            ORDER BY vt.timestamp DESC 
            LIMIT 20
        `);
        stats.userActivity = userActivity;
        
        return stats;
    }

    // ========================================
    // === REVIEW METHODS ===
    // ========================================
    async createReview(reviewData) {
        const { name, city, rating, message, ip_address, user_agent } = reviewData;
        return await this.run(
            'INSERT INTO reviews (name, city, rating, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [name, city, rating, message, ip_address, user_agent]
        );
    }

    async getAllReviews() {
        return await this.all('SELECT * FROM reviews ORDER BY created_at DESC');
    }

    async getRecentReviews(limit = 50) {
        return await this.all('SELECT * FROM reviews ORDER BY created_at DESC LIMIT ?', [limit]);
    }

    async getReview(id) {
        return await this.get('SELECT * FROM reviews WHERE id = ?', [id]);
    }

    async deleteReview(id) {
        return await this.run('DELETE FROM reviews WHERE id = ?', [id]);
    }

    // ========================================
    // === POLICY PAGE METHODS ===
    // ========================================
    async updatePolicyPage(pageData) {
        const { page_name, content, updated_by } = pageData;
        
        // Check if policy page record exists
        const existing = await this.get(
            'SELECT * FROM policy_pages WHERE page_name = ?',
            [page_name]
        );

        if (existing) {
            return await this.run(
                'UPDATE policy_pages SET content = ?, updated_by = ?, updated_at = CURRENT_TIMESTAMP WHERE page_name = ?',
                [content, updated_by, page_name]
            );
        } else {
            return await this.run(
                'INSERT INTO policy_pages (page_name, content, updated_by) VALUES (?, ?, ?)',
                [page_name, content, updated_by]
            );
        }
    }

    async getPolicyPage(page_name) {
        return await this.get('SELECT * FROM policy_pages WHERE page_name = ?', [page_name]);
    }

    async getAllPolicyPages() {
        return await this.all('SELECT * FROM policy_pages ORDER BY updated_at DESC');
    }
}

// Create singleton instance
const database = new Database();

module.exports = database;

const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const logger = require('../utils/logger');

class Database {
    constructor() {
        this.db = null;
    }

    async init() {
        try {
            const dataDir = path.join(__dirname, '../../data');
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
            }

            const dbPath = process.env.DATABASE_PATH || path.join(dataDir, 'starframe.db');
            const dbDir = path.dirname(dbPath);

            if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true });
            }

            this.db = new DatabaseSync(dbPath);
            logger.info('Connected to SQLite database (native)');

            // Enable foreign keys
            this.db.exec('PRAGMA foreign_keys = ON');

            // MIGRATION: Check for oauth_users and rename to clients
            try {
                const oauthTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='oauth_users'").get();
                if (oauthTable) {
                    logger.info('Migrating oauth_users table to clients...');
                    this.db.exec("ALTER TABLE oauth_users RENAME TO clients");
                    logger.info('Table renamed successfully');
                }

                // Ensure google_id is NULLABLE (for local accounts)
                const clientsTable = this.db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='clients'").get();
                if (clientsTable) {
                    const columns = this.db.prepare("PRAGMA table_info(clients)").all();
                    const gIdCol = columns.find(c => c.name === 'google_id');
                    // Check if google_id is NOT NULL (1) or missing DEFAULT NULL
                    if (gIdCol && (gIdCol.notnull === 1)) {
                        logger.info('Aggressively fixing NOT NULL constraint on clients.google_id...');
                        this.db.exec(`
                            CREATE TABLE clients_temp(
                                id INTEGER PRIMARY KEY AUTOINCREMENT,
                                google_id TEXT UNIQUE DEFAULT NULL,
                                email TEXT UNIQUE NOT NULL,
                                password_hash TEXT,
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
                            );
                            INSERT INTO clients_temp (id, email, password_hash, name, preferences, created_at) 
                            SELECT id, email, password_hash, name, preferences, created_at FROM clients;
                            DROP TABLE clients;
                            ALTER TABLE clients_temp RENAME TO clients;
                        `);
                        logger.info('Clients table aggressively recreated');
                    }
                }
            } catch (migrationError) {
                logger.error('Migration error (non-fatal):', migrationError);
            }

            // Create tables
            this.createTables();

            logger.info('Database initialized successfully');
            return Promise.resolve();
        } catch (err) {
            logger.error('Error opening database:', err);
            return Promise.reject(err);
        }
    }

    // Wrap synchronous methods in async to maintain interface
    async run(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            const result = stmt.run(...params);
            return { id: result.lastInsertRowid, changes: result.changes };
        } catch (err) {
            logger.error('Database run error:', err, { sql, params });
            throw err;
        }
    }

    async get(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            return stmt.get(...params);
        } catch (err) {
            logger.error('Database get error:', err, { sql, params });
            throw err;
        }
    }

    async all(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            return stmt.all(...params);
        } catch (err) {
            logger.error('Database all error:', err, { sql, params });
            throw err;
        }
    }

    createTables() {
        const tables = [
            // Admin users table
            `CREATE TABLE IF NOT EXISTS admin_users(
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
            `CREATE TABLE IF NOT EXISTS user_sessions(
                id TEXT PRIMARY KEY,
                user_id INTEGER,
                ip_address TEXT,
                user_agent TEXT,
                location TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME,
                is_active BOOLEAN DEFAULT 1,
                FOREIGN KEY(user_id) REFERENCES admin_users(id)
            )`,

            // Website visitors tracking
            `CREATE TABLE IF NOT EXISTS visitor_analytics(
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
            `CREATE TABLE IF NOT EXISTS payment_transactions(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                transaction_id TEXT UNIQUE,
                client_email TEXT,
                client_name TEXT,
                amount DECIMAL(10, 2),
                currency TEXT DEFAULT 'USD',
                status TEXT, --pending, completed, failed, refunded
                payment_method TEXT,
                project_details TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Client inquiries and projects
            `CREATE TABLE IF NOT EXISTS client_inquiries(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                project_type TEXT,
                budget_range TEXT,
                timeline TEXT,
                description TEXT,
                status TEXT DEFAULT 'new', --new, contacted, in_progress, completed, cancelled
                priority INTEGER DEFAULT 1, --1 - 5, 5 being highest
                assigned_to INTEGER,
                notes TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(assigned_to) REFERENCES admin_users(id)
            )`,

            // Security logs
            `CREATE TABLE IF NOT EXISTS security_logs(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_type TEXT, --login_attempt, failed_login, suspicious_activity, etc.
                severity TEXT, --low, medium, high, critical
                ip_address TEXT,
                user_agent TEXT,
                user_id INTEGER,
                details TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES admin_users(id)
            )`,

            // System activity logs
            `CREATE TABLE IF NOT EXISTS activity_logs(
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
                FOREIGN KEY(user_id) REFERENCES admin_users(id)
            )`,

            // Website content management
            `CREATE TABLE IF NOT EXISTS content_updates(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page TEXT,
                section TEXT,
                content_type TEXT, --text, image, video
                old_content TEXT,
                new_content TEXT,
                updated_by INTEGER,
                status TEXT DEFAULT 'pending', --pending, approved, published
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(updated_by) REFERENCES admin_users(id)
            )`,

            // System backups
            `CREATE TABLE IF NOT EXISTS backups(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                backup_type TEXT, --full, incremental, database
                file_path TEXT,
                file_size INTEGER,
                status TEXT, --completed, failed, in_progress
                created_by INTEGER,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(created_by) REFERENCES admin_users(id)
            )`,

            // Performance metrics
            `CREATE TABLE IF NOT EXISTS performance_metrics(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                metric_name TEXT,
                value DECIMAL(10, 4),
                unit TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Email notifications queue
            `CREATE TABLE IF NOT EXISTS notification_queue(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                recipient TEXT,
                subject TEXT,
                message TEXT,
                type TEXT, --security_alert, client_inquiry, system_notification
                status TEXT DEFAULT 'pending', --pending, sent, failed
                attempts INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                sent_at DATETIME
            )`,

            // Client accounts table (Unified: Google OAuth + Local Email/Password)
            `CREATE TABLE IF NOT EXISTS clients(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                google_id TEXT UNIQUE DEFAULT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT,
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
            `CREATE TABLE IF NOT EXISTS visitor_tracking(
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
                FOREIGN KEY(user_id) REFERENCES clients(id)
            )`,

            // User action tracking
            `CREATE TABLE IF NOT EXISTS user_actions(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                socket_id TEXT,
                user_id INTEGER,
                action TEXT NOT NULL,
                target TEXT,
                value TEXT,
                page TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(user_id) REFERENCES clients(id)
            )`,

            // Payments table for UPI Transaction Tracking
            `CREATE TABLE IF NOT EXISTS payments(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                amount DECIMAL(10, 2) NOT NULL,
                utr_number TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'pending', -- pending, verified, rejected
                receipt_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(client_id) REFERENCES clients(id)
            )`,

            // Refined commissions table
            `CREATE TABLE IF NOT EXISTS commissions(
                id TEXT PRIMARY KEY,
                client_id INTEGER,
                payment_id INTEGER,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                phone TEXT,
                location TEXT,
                service TEXT,
                budget TEXT,
                timeline TEXT,
                purpose TEXT,
                description TEXT,
                reference_links TEXT,
                gst BOOLEAN,
                status TEXT DEFAULT 'queued', -- queued, in_progress, sketch, final, completed
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(client_id) REFERENCES clients(id),
                FOREIGN KEY(payment_id) REFERENCES payments(id)
            )`,

            // Reviews table
            `CREATE TABLE IF NOT EXISTS reviews(
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
            `CREATE TABLE IF NOT EXISTS policy_pages(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                page_name TEXT UNIQUE NOT NULL,
                content TEXT NOT NULL,
                updated_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(updated_by) REFERENCES admin_users(id)
            )`,

            // Store products
            `CREATE TABLE IF NOT EXISTS products(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                category TEXT NOT NULL,
                title TEXT NOT NULL,
                description TEXT,
                price_inr INTEGER NOT NULL,
                image_url TEXT,
                file_url TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`,

            // Store purchases
            `CREATE TABLE IF NOT EXISTS purchases(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                product_id INTEGER,
                payment_id INTEGER,
                download_token TEXT UNIQUE,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(client_id) REFERENCES clients(id),
                FOREIGN KEY(product_id) REFERENCES products(id),
                FOREIGN KEY(payment_id) REFERENCES payments(id)
            )`
        ];

        for (const tableSQL of tables) {
            this.db.exec(tableSQL);
        }

        // Create indexes
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_visitor_analytics_timestamp ON visitor_analytics(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_visitor_analytics_ip ON visitor_analytics(ip_address)',
            'CREATE INDEX IF NOT EXISTS idx_security_logs_timestamp ON security_logs(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity)',
            'CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp)',
            'CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id)',
            'CREATE INDEX IF NOT EXISTS idx_client_inquiries_status ON client_inquiries(status)',
            'CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status)',
            'CREATE INDEX IF NOT EXISTS idx_payments_utr ON payments(utr_number)',
            'CREATE INDEX IF NOT EXISTS idx_commissions_client ON commissions(client_id)',
            'CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status)',
            'CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at)'
        ];

        for (const indexSQL of indexes) {
            this.db.exec(indexSQL);
        }
    }

    // ========================================
    // === ADMIN USER METHODS ===
    // ========================================
    async createAdminUser(userData) {
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

    async updateUserLastLogin(userId) {
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
    // === CLIENT METHODS ===
    // ========================================
    async createClient(clientData) {
        const { email, password_hash, name, preferences } = clientData;
        return await this.run(
            'INSERT INTO clients (google_id, email, password_hash, name, preferences) VALUES (NULL, ?, ?, ?, ?)',
            [email, password_hash, name, JSON.stringify(preferences || {})]
        );
    }

    async upsertClient(userData) {
        const { googleId, email, name, picture, accessToken, refreshToken } = userData;

        // Check if user exists by google_id or email
        let existingClient = await this.get('SELECT * FROM clients WHERE google_id = ? OR email = ?', [googleId, email]);

        if (existingClient) {
            // Update existing client with Google info
            await this.run(
                'UPDATE clients SET google_id = ?, name = ?, picture = ?, access_token = ?, refresh_token = ?, last_login = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [googleId, name, picture, accessToken, refreshToken, existingClient.id]
            );
            return { ...existingClient, google_id: googleId, name, picture };
        } else {
            // Create new client
            const result = await this.run(
                'INSERT INTO clients (google_id, email, name, picture, access_token, refresh_token, last_login) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
                [googleId, email, name, picture, accessToken, refreshToken]
            );
            return { id: result.id, google_id: googleId, email, name, picture };
        }
    }

    async getClientById(id) {
        return await this.get('SELECT * FROM clients WHERE id = ?', [id]);
    }

    async getClientByEmail(email) {
        return await this.get('SELECT * FROM clients WHERE email = ?', [email]);
    }

    async getClientByGoogleId(googleId) {
        return await this.get('SELECT * FROM clients WHERE google_id = ?', [googleId]);
    }

    async updateClientSession(clientId, sessionId) {
        return await this.run(
            'UPDATE clients SET session_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [sessionId, clientId]
        );
    }

    async updateClientPreferences(clientId, preferences) {
        return await this.run(
            'UPDATE clients SET preferences = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [JSON.stringify(preferences), clientId]
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

    async getClientAnalytics(timeframe = '24h') {
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

        const clients = await this.all(`
            SELECT id, name, email, picture, last_login, session_id, created_at
            FROM clients 
            ${timeCondition} 
            ORDER BY last_login DESC
                `);

        const totalClientsResult = await this.get('SELECT COUNT(*) as count FROM clients');
        const activeClientsResult = await this.get(`
            SELECT COUNT(*) as count 
            FROM clients 
            WHERE session_id IS NOT NULL AND last_login >= datetime('now', '-1 hour')
                `);

        return {
            clients,
            totalClients: totalClientsResult ? totalClientsResult.count : 0,
            activeClients: activeClientsResult ? activeClientsResult.count : 0
        };
    }

    // ========================================
    // === PAYMENT METHODS ===
    // ========================================
    async createPayment(paymentData) {
        const { client_id, amount, utr_number, receipt_path } = paymentData;
        return await this.run(
            'INSERT INTO payments (client_id, amount, utr_number, receipt_path) VALUES (?, ?, ?, ?)',
            [client_id, amount, utr_number, receipt_path]
        );
    }

    async getPaymentByUtr(utr) {
        return await this.get('SELECT * FROM payments WHERE utr_number = ?', [utr]);
    }

    async updatePaymentStatus(id, status) {
        return await this.run(
            'UPDATE payments SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );
    }

    async getClientPayments(clientId) {
        return await this.all('SELECT * FROM payments WHERE client_id = ? ORDER BY created_at DESC', [clientId]);
    }

    // ========================================
    // === COMMISSION METHODS ===
    // ========================================
    async createCommission(commissionData) {
        const { id, client_id, payment_id, name, email, phone, location, service, budget, timeline, purpose, description, reference_links, gst } = commissionData;
        return await this.run(
            'INSERT INTO commissions (id, client_id, payment_id, name, email, phone, location, service, budget, timeline, purpose, description, reference_links, gst) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [id, client_id, payment_id ?? null, name, email, phone ?? null, location ?? null, service ?? null, budget ?? null, timeline ?? null, purpose ?? null, description ?? null, reference_links ?? null, gst ? 1 : 0]
        );
    }

    async getCommission(id) {
        return await this.get('SELECT * FROM commissions WHERE id = ?', [id]);
    }

    async getClientCommissions(clientId) {
        return await this.all('SELECT * FROM commissions WHERE client_id = ? ORDER BY created_at DESC', [clientId]);
    }

    async updateCommissionStatus(id, status) {
        return await this.run(
            'UPDATE commissions SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [status, id]
        );
    }

    async getCommissionWithPayment(id) {
        return await this.get(`
            SELECT c.*, p.utr_number, p.amount as paid_amount, p.status as payment_status 
            FROM commissions c 
            LEFT JOIN payments p ON c.payment_id = p.id 
            WHERE c.id = ?
                `, [id]);
    }

    // ========================================
    // === REVIEW METHODS ===
    // ========================================
    async addReview(reviewData) {
        const { name, city, rating, message, ip_address, user_agent } = reviewData;
        return await this.run(
            'INSERT INTO reviews (name, city, rating, message, ip_address, user_agent) VALUES (?, ?, ?, ?, ?, ?)',
            [name, city, rating, message, ip_address, user_agent]
        );
    }

    async getReviews(limit = 10) {
        return await this.all('SELECT * FROM reviews ORDER BY created_at DESC LIMIT ?', [limit]);
    }

    async getReview(id) {
        return await this.get('SELECT * FROM reviews WHERE id = ?', [id]);
    }

    async deleteReview(id) {
        return await this.run('DELETE FROM reviews WHERE id = ?', [id]);
    }

    // ========================================
    // === SHOP METHODS ===
    // ========================================
    async createProduct(productData) {
        const { category, title, description, price_inr, image_url, file_url, is_active = 1 } = productData;
        return await this.run(
            'INSERT INTO products (category, title, description, price_inr, image_url, file_url, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [category, title, description, price_inr, image_url, file_url, is_active]
        );
    }

    async getProducts(activeOnly = true) {
        const query = activeOnly ? 'SELECT * FROM products WHERE is_active = 1 ORDER BY created_at DESC' : 'SELECT * FROM products ORDER BY created_at DESC';
        return await this.all(query);
    }

    async getProduct(id) {
        return await this.get('SELECT * FROM products WHERE id = ?', [id]);
    }

    async updateProduct(id, productData) {
        const { category, title, description, price_inr, image_url, file_url, is_active } = productData;
        return await this.run(
            'UPDATE products SET category = ?, title = ?, description = ?, price_inr = ?, image_url = ?, file_url = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
            [category, title, description, price_inr, image_url, file_url, is_active, id]
        );
    }

    async deleteProduct(id) {
        return await this.run('DELETE FROM products WHERE id = ?', [id]);
    }

    async recordPurchase(purchaseData) {
        const { client_id, product_id, payment_id, download_token } = purchaseData;
        return await this.run(
            'INSERT INTO purchases (client_id, product_id, payment_id, download_token) VALUES (?, ?, ?, ?)',
            [client_id, product_id, payment_id, download_token]
        );
    }

    async getPurchasesByClient(clientId) {
        return await this.all(`
            SELECT p.*, pr.title, pr.image_url, pr.category, pay.status as payment_status 
            FROM purchases p 
            JOIN products pr ON p.product_id = pr.id 
            JOIN payments pay ON p.payment_id = pay.id
            WHERE p.client_id = ? 
            ORDER BY p.created_at DESC`, [clientId]
        );
    }

    async getPurchaseByToken(token) {
        return await this.get(`
            SELECT p.*, pr.file_url, pr.title, pay.status as payment_status 
            FROM purchases p 
            JOIN products pr ON p.product_id = pr.id 
            JOIN payments pay ON p.payment_id = pay.id
            WHERE p.download_token = ?`, [token]
        );
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

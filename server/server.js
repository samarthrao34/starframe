require('dotenv').config(); // Load environment variables

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
// const SQLiteStore = require('connect-sqlite3')(session);
const http = require('http');
const socketIo = require('socket.io');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Load custom modules
const logger = require('./utils/logger');
const Database = require('./models/Database');

// Load routes
const authRoutes = require('./routes/auth');
<<<<<<< HEAD
const commissionsRoutes = require('./routes/commissions');
// const legacyCommissionRoutes = require('./routes/commission'); // Deprecated legacy route
=======
const adminRoutes = require('./routes/admin');
const analyticsRoutes = require('./routes/analytics');
const commissionRoutes = require('./routes/commission');
const contactRoutes = require('./routes/contact');
>>>>>>> 31422cd7ed8da057f23c498151957b317926130f
const invoiceRoutes = require('./routes/invoice');
const paymentRoutes = require('./routes/payment');
<<<<<<< HEAD
const clientRoutes = require('./routes/client');
const payRoutes = require('./routes/pay');
const shopRoutes = require('./routes/shop');
const adminRoutes = require('./routes/admin');
=======
const securityRoutes = require('./routes/security');
const systemRoutes = require('./routes/system');
>>>>>>> 31422cd7ed8da057f23c498151957b317926130f

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3001;

// Socket.IO setup
const io = socketIo(server, {
    cors: {
        origin: [
            'http://localhost:8000',
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:8000',
            'http://127.0.0.1:3001',
            'http://0.0.0.0:8000'
        ],
        methods: ["GET", "POST"]
    }
});

// Passport configuration
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || `http://localhost:${PORT}/api/auth/google/callback`
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const userData = {
                googleId: profile.id,
                email: profile.emails[0].value,
                name: profile.displayName,
                picture: profile.photos[0].value,
                accessToken,
                refreshToken
            };

            const user = await Database.upsertClient(userData);

            // Emit real-time notification to admin
            io.emit('user-login', {
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    picture: user.picture,
                    loginTime: new Date().toISOString()
                },
                type: 'google_login'
            });

            return done(null, user);
        } catch (error) {
            logger.error('Google OAuth error:', error);
            return done(error, null);
        }
    }));
} else {
    logger.info('Google OAuth not configured: set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google login.');
}

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await Database.getClientById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    // Track visitor activity
    socket.on('page-visit', async (data) => {
        try {
            const visitorData = {
                socketId: socket.id,
                page: data.page,
                url: data.url,
                referrer: data.referrer,
                userAgent: data.userAgent,
                ipAddress: socket.handshake.address,
                timestamp: new Date().toISOString(),
                userId: data.userId || null
            };

            // Save to database
            await Database.trackVisitorRealtime(visitorData);

            // Emit real-time update to admin
            io.emit('visitor-activity', {
                type: 'page-visit',
                visitor: visitorData,
                timestamp: new Date().toISOString()
            });

            logger.info(`Page visit tracked: ${data.page} - ${socket.id}`);
        } catch (error) {
            logger.error('Error tracking page visit:', error);
        }
    });

    socket.on('disconnect', () => {
        logger.info(`Socket disconnected: ${socket.id}`);
    });
});

app.set('io', io);

// Async function to start server
async function startServer() {
    try {
        // Initialize database
        await Database.init();
        logger.info('Database initialized');

        // Security middleware
        app.use(helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
<<<<<<< HEAD
                    scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://checkout.razorpay.com"],
                    imgSrc: ["'self'", "data:", "https:", "https://cdn.razorpay.com"],
                    connectSrc: ["'self'", "http://localhost:" + PORT, "https://lumberjack.razorpay.com", "https://api.razorpay.com"]
=======
                    scriptSrc: [
                        "'self'",
                        "'unsafe-inline'",
                        "https://cdnjs.cloudflare.com",
                        "https://vitals.vercel-insights.com",
                        "https://www.gstatic.com",
                        "https://www.googleapis.com"
                    ],
                    imgSrc: ["'self'", "data:", "https:"],
                    connectSrc: [
                        "'self'",
                        "http://localhost:" + PORT,
                        "https://vitals.vercel-insights.com",
                        "https://identitytoolkit.googleapis.com",
                        "https://securetoken.googleapis.com",
                        "https://firestore.googleapis.com",
                        "https://firebaseinstallations.googleapis.com",
                        "https://www.googleapis.com"
                    ]
>>>>>>> 31422cd7ed8da057f23c498151957b317926130f
                }
            }
        }));

        // CORS configuration
        app.use(cors({
            origin: function (origin, callback) {
                const allowedOrigins = [
                    'http://localhost:8000',
                    'http://localhost:3000',
                    'http://localhost:3001',
                    'http://127.0.0.1:3001'
                ];
                if (!origin || allowedOrigins.includes(origin) || origin.startsWith('http://localhost:')) {
                    callback(null, true);
                } else {
                    callback(new Error('Not allowed by CORS'));
                }
            },
            credentials: true
        }));

        // Session configuration
        // const sessionSecret = process.env.SESSION_SECRET || 'dev-session-secret-change-me'; // This variable is no longer needed
        if (!process.env.SESSION_SECRET) {
            logger.warn('SESSION_SECRET not set in environment — using a development fallback. Set SESSION_SECRET in production.');
        }

        app.use(session({
            // store: new SQLiteStore({ db: 'sessions.db', dir: './data' }),
            secret: process.env.SESSION_SECRET || 'starframe-secret-key',
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000 // 24 hours
            }
        }));

        // Passport middleware
        app.use(passport.initialize());
        app.use(passport.session());

        // Body parsing middleware
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Logging middleware
        app.use((req, res, next) => {
            if (req.url.startsWith('/api/')) {
                logger.info(`${req.method} ${req.url} - ${req.ip} - Body: ${JSON.stringify(req.body)}`);
            } else {
                logger.info(`${req.method} ${req.url} - ${req.ip}`);
            }
            next();
        });

        // Serve static files
        app.use('/admin', express.static(path.join(__dirname, '../admin')));
        app.use('/', express.static(path.join(__dirname, '../'), {
            index: 'index.html'
        }));

        // Routes
        app.use('/api/auth', authRoutes);
<<<<<<< HEAD
        app.use('/api/commissions', commissionsRoutes);
        app.use('/api/commission', commissionsRoutes); // Alias for backward compatibility/typo safety
=======
        app.use('/api/admin', adminRoutes);
        app.use('/api/analytics', analyticsRoutes);
        app.use('/api/security', securityRoutes);
        app.use('/api/system', systemRoutes);
        app.use('/api/contact', contactRoutes);
        app.use('/api/commission', commissionRoutes);
>>>>>>> 31422cd7ed8da057f23c498151957b317926130f
        app.use('/api/invoice', invoiceRoutes);
        app.use('/api/payment', paymentRoutes);
        app.use('/api/client', clientRoutes);
        app.use('/api/pay', payRoutes);
        app.use('/api/shop', shopRoutes);
        app.use('/api/admin', adminRoutes);

        // Health check
        app.get('/api/health', (req, res) => {
            res.json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            });
        });

        // Global error handler
        app.use((err, req, res, next) => {
            logger.error('Unhandled error:', err);

            if (req.url.startsWith('/api/')) {
                res.status(500).json({
                    error: 'Internal server error',
                    ...(process.env.NODE_ENV === 'development' && { details: err.message })
                });
            } else {
                res.status(500).send('Internal Server Error');
            }
        });

        // Start the server
        server.listen(PORT, () => {
            logger.info(`✅ StarFrame Admin System running on port ${PORT}`);
            logger.info(`✅ Admin dashboard: http://localhost:${PORT}/admin`);
            logger.info(`✅ OAuth login: http://localhost:${PORT}/api/auth/google`);
            logger.info(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
            logger.info(`✅ Socket.IO enabled for real-time features`);
        });

    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, shutting down gracefully');
    Database.close();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, shutting down gracefully');
    Database.close();
    process.exit(0);
});

// Start the server
startServer();

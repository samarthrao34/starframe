require('dotenv').config();

// Wrap everything in async function
async function startServer() {
try {
    console.log('Loading modules...');
    const express = require('express');
    const path = require('path');
    const helmet = require('helmet');
    const cors = require('cors');
    const rateLimit = require('express-rate-limit');
    const session = require('express-session');
    const SQLiteStore = require('connect-sqlite3')(session);
    const http = require('http');
    const socketIo = require('socket.io');
    const passport = require('passport');
    const GoogleStrategy = require('passport-google-oauth20').Strategy;

    console.log('Loading custom modules...');
    const logger = require('./server/utils/logger');
    const auth = require('./server/middleware/auth');
    const security = require('./server/middleware/security');
    const analytics = require('./server/middleware/analytics');
    const Database = require('./server/models/Database');

    console.log('Loading routes...');
    const authRoutes = require('./server/routes/auth');
    const adminRoutes = require('./server/routes/admin');
    const analyticsRoutes = require('./server/routes/analytics');
    const securityRoutes = require('./server/routes/security');
    const systemRoutes = require('./server/routes/system');
    const contactRoutes = require('./server/routes/contact');

    console.log('Creating Express app...');
    const app = express();
    const server = http.createServer(app);
    const PORT = process.env.PORT || 3001;

    console.log('Setting up Socket.IO...');
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

    console.log('Setting up Passport...');
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
            
            const user = await Database.upsertUser(userData);
            return done(null, user);
        } catch (error) {
            console.error('Google OAuth error:', error);
            return done(error, null);
        }
    }));

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await Database.getUserById(id);
            done(null, user);
        } catch (error) {
            done(error, null);
        }
    });

    console.log('Initializing database...');
    await Database.init();

    console.log('Setting up middleware...');

    // Security middleware
    app.use(helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
                scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
                imgSrc: ["'self'", "data:", "https:"],
                connectSrc: ["'self'"]
            }
        }
    }));

    // CORS configuration
    app.use(cors({
        origin: function(origin, callback) {
            const allowedOrigins = [
                'http://localhost:8000',
                'http://localhost:3000',
                'http://localhost:3001',
                'http://127.0.0.1:8000',
                'http://127.0.0.1:3001',
                'http://0.0.0.0:8000'
            ];
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        },
        credentials: true
    }));

    // Session configuration
    app.use(session({
        store: new SQLiteStore({
            db: 'sessions.db',
            dir: './data'
        }),
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === 'production',
            httpOnly: true,
            maxAge: parseInt(process.env.SESSION_TIMEOUT) || 3600000
        }
    }));

    // Passport middleware
    app.use(passport.initialize());
    app.use(passport.session());

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    console.log('Setting up routes...');
    
    // Health check
    app.get('/api/health', (req, res) => {
        res.json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            version: '1.0.0'
        });
    });

    // Basic routes first
    app.use('/api/auth', authRoutes);

    console.log('Starting server...');
    server.listen(PORT, () => {
        console.log(`✅ Server running on http://localhost:${PORT}`);
        console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
        console.log(`✅ OAuth test: http://localhost:${PORT}/api/auth/google`);
    });

} catch (error) {
    console.error('❌ Server startup error:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}
}

// Start the server
startServer();

// Add process error handlers
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

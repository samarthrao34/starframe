require('dotenv').config();

console.log('Environment variables:');
console.log('PORT:', process.env.PORT);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set');
console.log('GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set');
console.log('DATABASE_PATH:', process.env.DATABASE_PATH);
console.log('SESSION_SECRET:', process.env.SESSION_SECRET ? 'Set' : 'Not set');

console.log('\nTesting module imports...');

try {
    console.log('✓ Express');
    const express = require('express');
} catch (err) {
    console.error('✗ Express:', err.message);
}

try {
    console.log('✓ Passport');
    const passport = require('passport');
} catch (err) {
    console.error('✗ Passport:', err.message);
}

try {
    console.log('✓ Google OAuth Strategy');
    const GoogleStrategy = require('passport-google-oauth20').Strategy;
} catch (err) {
    console.error('✗ Google OAuth Strategy:', err.message);
}

try {
    console.log('✓ Socket.IO');
    const socketIo = require('socket.io');
} catch (err) {
    console.error('✗ Socket.IO:', err.message);
}

try {
    console.log('✓ SQLite3');
    const sqlite3 = require('sqlite3');
} catch (err) {
    console.error('✗ SQLite3:', err.message);
}

try {
    console.log('✓ Database model');
    const Database = require('./server/models/Database');
} catch (err) {
    console.error('✗ Database model:', err.message);
}

try {
    console.log('✓ Logger');
    const logger = require('./server/utils/logger');
} catch (err) {
    console.error('✗ Logger:', err.message);
}

try {
    console.log('✓ Auth middleware');
    const auth = require('./server/middleware/auth');
} catch (err) {
    console.error('✗ Auth middleware:', err.message);
}

try {
    console.log('✓ Security middleware');
    const security = require('./server/middleware/security');
} catch (err) {
    console.error('✗ Security middleware:', err.message);
}

try {
    console.log('✓ Analytics middleware');
    const analytics = require('./server/middleware/analytics');
} catch (err) {
    console.error('✗ Analytics middleware:', err.message);
}

console.log('\nTesting route imports...');

try {
    console.log('✓ Auth routes');
    const authRoutes = require('./server/routes/auth');
} catch (err) {
    console.error('✗ Auth routes:', err.message);
}

try {
    console.log('✓ Admin routes');
    const adminRoutes = require('./server/routes/admin');
} catch (err) {
    console.error('✗ Admin routes:', err.message);
}

try {
    console.log('✓ Analytics routes');
    const analyticsRoutes = require('./server/routes/analytics');
} catch (err) {
    console.error('✗ Analytics routes:', err.message);
}

try {
    console.log('✓ Security routes');
    const securityRoutes = require('./server/routes/security');
} catch (err) {
    console.error('✗ Security routes:', err.message);
}

try {
    console.log('✓ System routes');
    const systemRoutes = require('./server/routes/system');
} catch (err) {
    console.error('✗ System routes:', err.message);
}

try {
    console.log('✓ Contact routes');
    const contactRoutes = require('./server/routes/contact');
} catch (err) {
    console.error('✗ Contact routes:', err.message);
}

console.log('\nDiagnosis complete!');

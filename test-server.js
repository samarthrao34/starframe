require('dotenv').config();

const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);

const app = express();
const PORT = process.env.PORT || 3001;

console.log('Starting minimal server test...');

console.log('Setting up session...');
app.use(session({
    store: new SQLiteStore({
        db: 'test-sessions.db',
        dir: './data'
    }),
    secret: process.env.SESSION_SECRET || 'test-secret',
    resave: false,
    saveUninitialized: false
}));

console.log('Setting up passport...');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://localhost:${PORT}/auth/google/callback`
}, (accessToken, refreshToken, profile, done) => {
    console.log('OAuth callback triggered');
    return done(null, profile);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser((id, done) => {
    done(null, { id });
});

app.use(passport.initialize());
app.use(passport.session());

console.log('Setting up routes...');

app.get('/', (req, res) => {
    res.send('Server is running!');
});

app.get('/auth/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/success');
    }
);

app.get('/success', (req, res) => {
    res.send('OAuth success!');
});

console.log('Starting server...');
app.listen(PORT, () => {
    console.log(`✓ Test server running on http://localhost:${PORT}`);
    console.log(`✓ OAuth test: http://localhost:${PORT}/auth/google`);
});

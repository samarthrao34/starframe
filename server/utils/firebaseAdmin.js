const admin = require('firebase-admin');
const logger = require('./logger');

let initialized = false;

function getServiceAccountFromEnv() {
    const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (inlineJson) {
        try {
            return JSON.parse(inlineJson);
        } catch (error) {
            logger.error('Invalid FIREBASE_SERVICE_ACCOUNT_JSON', { error: error.message });
        }
    }

    return null;
}

function initializeFirebaseAdmin() {
    if (initialized || admin.apps.length > 0) {
        initialized = true;
        return true;
    }

    const serviceAccount = getServiceAccountFromEnv();

    if (!serviceAccount) {
        logger.warn('Firebase Admin not initialized: FIREBASE_SERVICE_ACCOUNT_JSON is missing.');
        return false;
    }

    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        initialized = true;
        logger.info('Firebase Admin SDK initialized');
        return true;
    } catch (error) {
        logger.error('Firebase Admin SDK initialization failed', { error: error.message });
        return false;
    }
}

async function verifyIdToken(idToken) {
    if (!initializeFirebaseAdmin()) {
        throw new Error('Firebase Admin SDK is not configured on server');
    }

    return admin.auth().verifyIdToken(idToken);
}

module.exports = {
    initializeFirebaseAdmin,
    verifyIdToken
};

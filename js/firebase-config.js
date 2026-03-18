(function initStarFrameFirebase() {
    const defaultConfig = {
        apiKey: 'AIzaSyB6QO8XcSKvzpejeB-X09vf36FUCfivRL0',
        authDomain: 'starframeanimationstudio-16052.firebaseapp.com',
        projectId: 'starframeanimationstudio-16052',
        storageBucket: 'starframeanimationstudio-16052.firebasestorage.app',
        messagingSenderId: '209585340727',
        appId: '1:209585340727:web:8f017ebd89a733d3b5dab2',
        measurementId: 'G-K9BV7W8PYQ'
    };

    const runtimeConfig = window.STARFRAME_FIREBASE_CONFIG || {};
    const config = Object.assign({}, defaultConfig, runtimeConfig);

    const hasRequiredConfig = Boolean(config.apiKey && config.authDomain && config.projectId && config.appId);

    if (!window.firebase) {
        console.warn('Firebase SDK was not loaded.');
        window.starframeFirebase = { isConfigured: false };
        return;
    }

    if (hasRequiredConfig && window.firebase.apps.length === 0) {
        window.firebase.initializeApp(config);
    }

    window.starframeFirebase = {
        isConfigured: hasRequiredConfig,
        config,
        adminEmail: 'samarthrao34@gmail.com',
        getAuth: function getAuth() {
            return hasRequiredConfig ? window.firebase.auth() : null;
        },
        getFirestore: function getFirestore() {
            return hasRequiredConfig ? window.firebase.firestore() : null;
        },
        isAdminEmail: function isAdminEmail(email) {
            if (!email) return false;
            return String(email).toLowerCase() === 'samarthrao34@gmail.com';
        }
    };
})();

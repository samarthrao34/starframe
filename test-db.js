require('dotenv').config();

const Database = require('./server/models/Database');
const logger = require('./server/utils/logger');

console.log('Testing database initialization...');

Database.init().then(() => {
    console.log('✓ Database initialized successfully');
    process.exit(0);
}).catch(err => {
    console.error('✗ Database initialization failed:', err);
    process.exit(1);
});

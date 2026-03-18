const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'data/starframe.db');
const db = new DatabaseSync(dbPath);

console.log('Dropping outdated commissions and payments tables...');
try {
    db.exec('DROP TABLE IF EXISTS commissions;');
    console.log('Dropped commissions.');
} catch (e) { console.error(e) }

try {
    db.exec('DROP TABLE IF EXISTS payments;');
    console.log('Dropped payments.');
} catch (e) { console.error(e) }

console.log('Done.');

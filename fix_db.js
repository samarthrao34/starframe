const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data/starframe.db');
console.log('Checking database at:', dbPath);

if (!fs.existsSync(dbPath)) {
    console.error('Database file not found!');
    process.exit(1);
}

try {
    const db = new DatabaseSync(dbPath);
    console.log('Connected to database.');

    // Check current schema
    const columns = db.prepare("PRAGMA table_info(clients)").all();
    console.log('Current clients table columns:', JSON.stringify(columns, null, 2));

    const gIdCol = columns.find(c => c.name === 'google_id');
    if (gIdCol) {
        console.log(`google_id notnull value: ${gIdCol.notnull}`);
        if (gIdCol.notnull === 1) {
            console.log('Applying EMERGENCY fix for NOT NULL constraint...');
            db.exec(`
                CREATE TABLE clients_emergency(
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
                INSERT INTO clients_emergency (id, email, password_hash, name, preferences, created_at) 
                SELECT id, email, password_hash, name, preferences, created_at FROM clients;
                DROP TABLE clients;
                ALTER TABLE clients_emergency RENAME TO clients;
            `);
            console.log('Fix applied successfully.');
        } else {
            console.log('google_id is already NULLABLE.');
        }
    } else {
        console.log('google_id column NOT FOUND. This is unexpected.');
    }

} catch (err) {
    console.error('Error:', err);
}

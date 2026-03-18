const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data/starframe.db');
console.log('Checking database at:', dbPath);

try {
    const db = new DatabaseSync(dbPath);
    console.log('Connected to database.');

    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log('Existing tables:', tables.map(t => t.name).join(', '));

    const commissionsExist = tables.some(t => t.name === 'commissions');
    const paymentsExist = tables.some(t => t.name === 'payments');

    if (!commissionsExist) {
        console.log('Commission table missing. Creating...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS commissions(
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
                status TEXT DEFAULT 'queued',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(client_id) REFERENCES clients(id),
                FOREIGN KEY(payment_id) REFERENCES payments(id)
            );
        `);
    }

    if (!paymentsExist) {
        console.log('Payments table missing. Creating...');
        db.exec(`
            CREATE TABLE IF NOT EXISTS payments(
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id INTEGER,
                amount DECIMAL(10, 2) NOT NULL,
                utr_number TEXT UNIQUE NOT NULL,
                status TEXT DEFAULT 'pending',
                receipt_path TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY(client_id) REFERENCES clients(id)
            );
        `);
    }

} catch (err) {
    console.error('Error:', err);
}

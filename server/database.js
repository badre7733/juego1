// ==========================================
// SQLITE PERSISTENCE DATABASE MODULE
// ==========================================

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./quantum_void.db');

db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS players (
            id TEXT PRIMARY KEY,
            credits INTEGER DEFAULT 1000,
            owned_ships TEXT DEFAULT '["scout"]',
            stats TEXT
        )
    `);
});

module.exports = db;

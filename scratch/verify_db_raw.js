import Database from 'better-sqlite3';
const db = new Database('sqlite.db');

try {
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log("Tables found:", tables.map(t => t.name));

    const checkTable = (name) => {
        try {
            const columns = db.prepare(`PRAGMA table_info(${name})`).all();
            console.log(`Columns in ${name}:`, columns.map(c => c.name));
        } catch (e) {
            console.log(`Table ${name} not found or error.`);
        }
    };

    ['users', 'verification_submissions', 'transactions'].forEach(checkTable);
} catch (e) {
    console.error(e);
} finally {
    db.close();
}

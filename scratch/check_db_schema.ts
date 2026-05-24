import Database from 'better-sqlite3';
const db = new Database('sqlite.db');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log('Tables:', tables.map(t => t.name));

const usersColumns = db.prepare("PRAGMA table_info(users)").all();
console.log('Users columns:', usersColumns.map(c => c.name));
db.close();

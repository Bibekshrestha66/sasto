import Database from 'better-sqlite3';
const db = new Database('sqlite.db');
const user = db.prepare('SELECT email, password, role FROM users WHERE email = ?').get('bibekshrestha66@gmail.com');
console.log(JSON.stringify(user, null, 2));
db.close();

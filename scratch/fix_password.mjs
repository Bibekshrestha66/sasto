import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

const db = new Database('sqlite.db');

const password = 'Sasto@Temp123456';
const hash = bcrypt.hashSync(password, 10);

// Verify the hash works immediately
const matches = bcrypt.compareSync(password, hash);
console.log('New hash:', hash);
console.log('Verify matches:', matches);

// Update the user in DB
const result = db.prepare('UPDATE users SET password = ? WHERE email = ?').run(hash, 'bibekshrestha66@gmail.com');
console.log('Rows updated:', result.changes);

// Read it back and verify again
const user = db.prepare('SELECT email, password, role FROM users WHERE email = ?').get('bibekshrestha66@gmail.com');
console.log('Stored user:', user);
const finalCheck = bcrypt.compareSync(password, user.password);
console.log('Final verification against DB:', finalCheck);

db.close();

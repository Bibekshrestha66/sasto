const Database = require('better-sqlite3');
const db = new Database('sqlite.db');

try {
  const result = db.prepare("UPDATE users SET role = 'seller' WHERE email = 'test@sasto.com'").run();
  console.log('Updated user role to seller:', result);
} catch (e) {
  console.error('Error updating user:', e);
}

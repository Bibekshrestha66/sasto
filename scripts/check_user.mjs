import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve(process.cwd(), 'sqlite.db');
const db = new Database(dbPath, { readonly: true });
const email = process.argv[2];
if (!email) {
  console.error('Usage: node scripts/check_user.mjs user@example.com');
  process.exit(1);
}

try {
  const row = db.prepare('select id, openId, name, email from users where email = ? limit 1').get(email);
  if (!row) {
    console.log('NOT FOUND');
    process.exit(0);
  }
  console.log(JSON.stringify(row, null, 2));
} catch (err) {
  console.error('DB QUERY ERROR:', err);
  process.exit(2);
}

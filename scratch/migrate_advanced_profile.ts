declare module 'better-sqlite3';
import Database = require('better-sqlite3');
const db = new Database('sqlite.db');

console.log("Migrating database for Advanced Profile fields...");

try {
  // Ensure the users table exists before attempting an ALTER TABLE
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").get();
  if (!tableExists) {
    throw new Error("Table 'users' does not exist in the database.");
  }

  // Check existing columns to avoid duplicate column errors
  const tableInfo = db.prepare("PRAGMA table_info(users)").all() as any[];
  const existingColumns = tableInfo.map(col => col.name);

  const newColumns = [
    { name: 'businessName', type: 'TEXT' },
    { name: 'businessLicense', type: 'TEXT' },
    { name: 'experienceYears', type: 'INTEGER' },
    { name: 'specialties', type: 'TEXT' },
    { name: 'socialLinks', type: 'TEXT' },
    { name: 'bannerImage', type: 'TEXT' }
  ];

  for (const col of newColumns) {
    if (!existingColumns.includes(col.name)) {
      console.log(`Adding column: ${col.name}`);
      db.exec(`ALTER TABLE users ADD COLUMN ${col.name} ${col.type}`);
    } else {
      console.log(`Column ${col.name} already exists.`);
    }
  }

  console.log('Migration complete!');
} catch (error) {
  console.error('Error during migration:', error);
} finally {
  db.close();
}

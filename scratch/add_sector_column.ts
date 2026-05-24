import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('sqlite.db');
const db = new Database(dbPath);

try {
  db.prepare("ALTER TABLE categories ADD COLUMN sector TEXT DEFAULT 'marketplace'").run();
  console.log("Column 'sector' added successfully to 'categories' table.");
} catch (error: any) {
  if (error.message.includes("duplicate column name")) {
    console.log("Column 'sector' already exists.");
  } else {
    console.error("Error adding column:", error);
  }
}

db.close();

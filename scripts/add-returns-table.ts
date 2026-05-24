import Database from 'better-sqlite3'; 
const db = new Database('sqlite.db'); 
db.exec(`CREATE TABLE IF NOT EXISTS returns (
  id INTEGER PRIMARY KEY AUTOINCREMENT, 
  transactionId INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE, 
  buyerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  sellerId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
  reason TEXT NOT NULL, 
  description TEXT, 
  images TEXT, 
  status TEXT NOT NULL DEFAULT 'pending', 
  adminNotes TEXT, 
  createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000), 
  updatedAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000)
);`);
console.log('Returns table created');

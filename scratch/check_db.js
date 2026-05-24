import Database from 'better-sqlite3';
const db = new Database('sqlite.db');
const listings = db.prepare('SELECT type, COUNT(*) as count FROM listings GROUP BY type').all();
console.log('Listings by type:', listings);
const auctions = db.prepare('SELECT COUNT(*) as count FROM auctions').all();
console.log('Total auctions:', auctions);
db.close();

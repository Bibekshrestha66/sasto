
import Database from 'better-sqlite3';
const db = new Database('sqlite.db');

const listingInfo = db.prepare("PRAGMA table_info(listings)").all();
console.log("Listing columns:", listingInfo.map(c => c.name).join(", "));

db.close();

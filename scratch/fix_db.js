
import Database from 'better-sqlite3';
const db = new Database('sqlite.db');

console.log("Checking tables...");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
console.log("Existing tables:", tables.map(t => t.name).join(", "));

const hasFlaggedListings = tables.some(t => t.name === 'flagged_listings');

if (!hasFlaggedListings) {
    console.log("Creating flagged_listings table...");
    db.exec(`
        CREATE TABLE IF NOT EXISTS flagged_listings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            listingId INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
            flaggedByUserId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            reason TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'pending',
            reviewedByAdminId INTEGER REFERENCES users(id) ON DELETE SET NULL,
            adminNotes TEXT,
            createdAt INTEGER NOT NULL DEFAULT (strftime('%s', 'now') * 1000),
            resolvedAt INTEGER
        )
    `);
    console.log("flagged_listings table created.");
} else {
    console.log("flagged_listings table already exists.");
}

// Also check for isFeatured and featuredUntil in listings table
const listingInfo = db.prepare("PRAGMA table_info(listings)").all();
const columns = listingInfo.map(c => c.name);

if (!columns.includes('isFeatured')) {
    console.log("Adding isFeatured column to listings...");
    db.exec("ALTER TABLE listings ADD COLUMN isFeatured INTEGER NOT NULL DEFAULT 0");
}

if (!columns.includes('featuredUntil')) {
    console.log("Adding featuredUntil column to listings...");
    db.exec("ALTER TABLE listings ADD COLUMN featuredUntil INTEGER");
}

db.close();
console.log("Done.");

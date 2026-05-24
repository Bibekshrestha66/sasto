import Database from 'better-sqlite3';
const db = new Database('sqlite.db');

try {
  db.exec(`
    ALTER TABLE users ADD COLUMN isVerified INTEGER NOT NULL DEFAULT 0;
    ALTER TABLE users ADD COLUMN verificationLevel TEXT NOT NULL DEFAULT 'basic';

    CREATE TABLE IF NOT EXISTS "verification_submissions" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "userId" integer NOT NULL,
      "type" text NOT NULL,
      "data" text NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "adminNotes" text,
      "reviewedBy" integer,
      "reviewedAt" integer,
      "createdAt" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
      "updatedAt" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
      FOREIGN KEY ("userId") REFERENCES "users"("id") ON UPDATE no action ON DELETE cascade,
      FOREIGN KEY ("reviewedBy") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action
    );

    CREATE TABLE IF NOT EXISTS "transactions" (
      "id" integer PRIMARY KEY AUTOINCREMENT NOT NULL,
      "orderId" text,
      "buyerId" integer,
      "sellerId" integer,
      "listingId" integer,
      "amount" real NOT NULL,
      "platformFee" real DEFAULT 0 NOT NULL,
      "tax" real DEFAULT 0 NOT NULL,
      "netAmount" real NOT NULL,
      "currency" text DEFAULT 'NPR' NOT NULL,
      "status" text DEFAULT 'pending' NOT NULL,
      "paymentMethod" text,
      "transactionType" text NOT NULL,
      "createdAt" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
      "updatedAt" integer DEFAULT (strftime('%s', 'now')) NOT NULL,
      FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action,
      FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON UPDATE no action ON DELETE no action,
      FOREIGN KEY ("listingId") REFERENCES "listings"("id") ON UPDATE no action ON DELETE no action
    );
  `);
  console.log('Schema changes applied successfully.');
} catch (error) {
  console.error('Error applying schema changes:', error);
} finally {
  db.close();
}

import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

async function createTestUser() {
  const db = new Database("sqlite.db");
  const email = "test@sasto.com";
  const password = "Sasto@123";
  const hashedPassword = await bcrypt.hash(password, 10);
  const now = Date.now();

  console.log(`Creating test account: ${email}...`);

  // Delete existing if any
  db.prepare("DELETE FROM users WHERE email = ?").run(email);

  // Insert fresh verified wholesaler
  db.prepare(`
    INSERT INTO users (
      email, password, name, openId, role, isVerified, verificationLevel, 
      businessName, experienceYears, lastSignedIn, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    email, 
    hashedPassword, 
    "Sasto Wholesaler", 
    "test_user_id", 
    "wholesaler", 
    1, // isVerified
    "pro", 
    "Sasto Trading Pvt Ltd", 
    8, // 8 years experience
    now, 
    now, 
    now
  );

  console.log("Test account created successfully!");
  console.log(`Email: ${email}`);
  console.log(`Password: ${password}`);
  
  db.close();
}

createTestUser().catch(console.error);

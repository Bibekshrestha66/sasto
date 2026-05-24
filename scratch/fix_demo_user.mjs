
import bcrypt from "bcryptjs";
import Database from "better-sqlite3";

async function fixDemoUser() {
  const db = new Database("sqlite.db");
  const email = "bibekshrestha66@gmail.com";
  const password = "Sasto@Temp123456";
  const hashedPassword = await bcrypt.hash(password, 10);

  const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
  if (user) {
    db.prepare("UPDATE users SET password = ? WHERE email = ?").run(hashedPassword, email);
    console.log(`Updated password for ${email}`);
  } else {
    // Create the user if it doesn't exist
    const openId = "dummy_owner_id";
    db.prepare("INSERT INTO users (email, password, name, openId, role, lastSignedIn, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(email, hashedPassword, "Bibek Shrestha", openId, "super_admin", Date.now(), Date.now(), Date.now());
    console.log(`Created demo user ${email}`);
  }
  db.close();
}

fixDemoUser().catch(console.error);

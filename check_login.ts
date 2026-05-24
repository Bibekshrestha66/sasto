import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function check() {
  const email = "bibekshrestha66@gmail.com";
  const testPassword = "password123";

  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email)
  });

  if (!user) {
    console.log(`User not found: ${email}`);
    // Check all users
    const allUsers = await db.select().from(users);
    console.log("All users in DB:", allUsers.map(u => ({ id: u.id, email: u.email, name: u.name })));
    return;
  }

  console.log(`User found: ${user.email}`);
  console.log(`Has password hash: ${!!user.password}`);
  
  if (user.password) {
    const isMatch = await bcrypt.compare(testPassword, user.password);
    console.log(`Bcrypt comparison for 'password123': ${isMatch}`);
    
    // If it doesn't match, let's re-hash and update just in case
    if (!isMatch) {
      console.log("Re-hashing and updating password...");
      const hashedPassword = await bcrypt.hash(testPassword, 10);
      await db.update(users).set({ password: hashedPassword }).where(eq(users.id, user.id));
      console.log("Password updated successfully.");
    }
  }
}

check().catch(console.error);

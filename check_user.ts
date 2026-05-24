import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

const sqlite = new Database("sqlite.db");
const db = drizzle(sqlite);

async function checkUser() {
  const result = await db.select().from(users).where(eq(users.email, "bibekshrestha66@gmail.com")).limit(1);
  if (result.length > 0) {
    const user = result[0];
    console.log("User found:", user);
    
    // Auto-verify and ensure super_admin role
    await db.update(users)
      .set({ role: "super_admin", verificationStatus: "verified" })
      .where(eq(users.id, user.id));
      
    console.log("User has been verified and set to super_admin.");
  } else {
    console.log("User not found!");
  }
}

checkUser();

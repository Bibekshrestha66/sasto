import { db } from "../../backend/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function fixAdmins() {
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  console.log("Fixing admin passwords...");
  
  // Fix admin@sasto.com
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, "admin@sasto.com"))
    .execute();
    
  // Fix bibekshrestha66@gmail.com
  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, "bibekshrestha66@gmail.com"))
    .execute();
    
  console.log("Success! Both admin passwords have been reset to: admin123");
  process.exit(0);
}

fixAdmins();

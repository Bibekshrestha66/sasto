import { db } from "../../backend/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function ensureAdmin() {
  const email = "bibekmshrestha66@gmail.com";
  const hashedPassword = await bcrypt.hash("admin123", 10);
  
  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  
  if (existingUser) {
    await db.update(users)
      .set({ role: "super_admin", password: hashedPassword })
      .where(eq(users.id, existingUser.id))
      .execute();
    console.log(`Updated existing user ${email} to super_admin and set password to admin123`);
  } else {
    await db.insert(users).values({
      email,
      name: "Bibek Shrestha",
      role: "super_admin",
      password: hashedPassword,
      openId: `manual_${Math.random().toString(36).substring(7)}`,
      loginMethod: "local"
    }).execute();
    console.log(`Created new super_admin user ${email} with password admin123`);
  }
  process.exit(0);
}

ensureAdmin();

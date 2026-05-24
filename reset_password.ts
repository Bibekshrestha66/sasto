import { getDb } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function reset() {
  const email = "bibekshrestha66@gmail.com";
  const newPassword = "password123";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.id, 1)); // I'll also try by ID if email update fails or just to be safe

  await db.update(users)
    .set({ password: hashedPassword })
    .where(eq(users.email, email));

  console.log(`Password for ${email} has been reset to: ${newPassword}`);
}

reset().catch(console.error);

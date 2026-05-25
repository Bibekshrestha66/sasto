import { getDb } from "../../backend/db";
import { users } from "./drizzle/schema";
import bcrypt from "bcryptjs";

async function create() {
  const email = "bibekshrestha66@gmail.com";
  const password = "password123";
  const name = "Bibek Shrestha";
  const openId = "owner-id-123";
  
  const hashedPassword = await bcrypt.hash(password, 10);

  const db = await getDb();
  if (!db) {
    console.error("Database connection failed");
    process.exit(1);
  }

  await db.insert(users).values({
    email,
    password: hashedPassword,
    name,
    openId,
    role: "super_admin",
    verificationStatus: "verified",
  });

  console.log(`User ${email} created successfully with password: ${password}`);
}

create().catch(console.error);

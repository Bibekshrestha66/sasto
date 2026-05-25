import * as db from "../../backend/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function seedSuperAdmin() {
  const database = await db.getDb();
  if (!database) {
    console.error("Database not available");
    return;
  }

  const email = "bibekshrestha66@gmail.com";
  const password = "Sasto@Temp123456";
  const name = "Bibek Shrestha";
  const openId = "dummy_owner_id";

  console.log(`Checking if user ${email} exists...`);
  const existingUser = await db.getUserByEmail(email);

  if (existingUser) {
    console.log(`User ${email} exists, updating password and role...`);
    await database.update(users)
      .set({ 
        password, 
        role: "super_admin",
        name,
        openId
      })
      .where(eq(users.email, email));
  } else {
    console.log(`User ${email} does not exist, creating...`);
    await database.insert(users).values({
      email,
      password,
      name,
      openId,
      role: "super_admin",
      status: "active",
      verificationStatus: "verified",
      loginMethod: "manual",
      lastSignedIn: new Date(),
    });
  }

  console.log("Super Admin seeded successfully!");
  process.exit(0);
}

seedSuperAdmin().catch(err => {
  console.error("Seeding failed:", err);
  process.exit(1);
});

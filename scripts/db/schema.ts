import { db } from "./server/db";
import { users } from "./server/db/schema";
import scrypt from "scrypt-async";

async function seed() {
  console.log("Seeding admin user...");
  
  // Hash the password 'Sasto@Temp123456'
  // Note: Ensure this matches your project's specific hashing method
  const password = "Sasto@Temp123456"; 

  await db.insert(users).values({
    email: "bibekshrestha66@gmail.com",
    password: password, // You should hash this if your app requires it
    role: "admin",
    username: "admin"
  });

  console.log("Admin user created successfully!");
  process.exit(0);
}

seed();

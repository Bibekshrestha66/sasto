import { db } from "./server/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function checkUser() {
  const user = await db.query.users.findFirst({
    where: eq(users.email, "bibekshrestha66@gmail.com"),
  });
  
  if (user) {
    console.log("User Found:");
    console.log("Email:", user.email);
    console.log("Password Hash:", user.password ? "Exists" : "MISSING");
    console.log("Role:", user.role);
    console.log("Login Method:", user.loginMethod);
  } else {
    console.log("User NOT found!");
  }
  process.exit(0);
}

checkUser();

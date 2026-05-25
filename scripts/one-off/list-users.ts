import { db } from "../../backend/db";
import { users } from "./drizzle/schema";

async function listUsers() {
  const allUsers = await db.select().from(users);
  console.log("Current Users:");
  console.table(allUsers.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
  process.exit(0);
}

listUsers();

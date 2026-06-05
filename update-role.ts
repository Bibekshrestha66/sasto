import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";
import "dotenv/config";

async function run() {
  if (!process.env.DATABASE_URL) throw new Error("No DB URL");
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  await client.connect();
  const db = drizzle(client);
  
  const res = await db.update(users).set({ role: "super_admin" }).where(eq(users.email, "bibekshrestha66@gmail.com")).returning();
  console.log("Updated user:", res);
  await client.end();
  process.exit(0);
}
run();

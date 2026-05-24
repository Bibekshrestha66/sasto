import { getDb } from "../server/db";
import { sql } from "drizzle-orm";

async function migrate() {
  const db = await getDb();
  console.log("Adding new columns to listings table...");
  
  try {
    await db.run(sql`ALTER TABLE listings ADD COLUMN originalPrice REAL`);
    console.log("Added originalPrice column");
  } catch (e) {
    console.log("originalPrice column might already exist");
  }

  try {
    await db.run(sql`ALTER TABLE listings ADD COLUMN discount INTEGER`);
    console.log("Added discount column");
  } catch (e) {
    console.log("discount column might already exist");
  }

  console.log("Migration finished!");
}

migrate().catch(console.error);

import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function verify() {
  console.log("Verifying database tables...");
  try {
    const tables = await db.run(sql`SELECT name FROM sqlite_master WHERE type='table'`);
    console.log("Tables found:", JSON.stringify(tables, null, 2));

    const checkColumns = async (tableName: string) => {
      try {
        const columns = await db.run(sql`PRAGMA table_info(${sql.raw(tableName)})`);
        console.log(`Columns in ${tableName}:`, JSON.stringify(columns, null, 2));
      } catch (e) {
        console.error(`Error checking ${tableName}:`, e);
      }
    };

    await checkColumns("users");
    await checkColumns("verification_submissions");
    await checkColumns("transactions");
    
  } catch (err) {
    console.error("Verification failed:", err);
  }
}

verify();

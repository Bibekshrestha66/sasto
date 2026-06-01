require('dotenv').config();
const postgres = require('postgres');
const sql = postgres(process.env.DATABASE_URL || "postgresql://localhost:5432/sasto");
async function run() {
  try {
    await sql`ALTER TABLE "listings" ADD COLUMN IF NOT EXISTS "videoUrl" text;`;
    console.log("Migration successful");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();

import { getDb } from "./server/db";
import { categories } from "./drizzle/schema";

async function main() {
    const db = await getDb();
    const allCategories = await db.select().from(categories);
    console.log("Categories:", JSON.stringify(allCategories, null, 2));
}

main().catch(console.error);

import { getDb } from "../../backend/db";
import { categories } from "./drizzle/schema";

async function main() {
    const db = await getDb();
    
    // Get ALL categories without filter
    const all = await db.select().from(categories);
    console.log("All categories:", all.length);
    all.forEach(c => console.log(`  [${c.id}] ${c.name} - parentId: ${c.parentId}`));
}

main().catch(console.error);

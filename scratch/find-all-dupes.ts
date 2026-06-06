import { getDb } from "../backend/db";
import { categories } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  const allCats = await db.select().from(categories);

  // Show all subcategories for marketplace root "Commercial" (id=118)
  const subs118 = allCats.filter(c => c.parentId === 118);
  console.log("=== Subcategories of marketplace Commercial (id=118) ===");
  subs118.forEach(s => console.log(`  id:${s.id}  name:${s.name}  slug:${s.slug}`));

  // Show all subcategories for marketplace root "Property" (id=19)
  const subs19 = allCats.filter(c => c.parentId === 19);
  console.log("\n=== Subcategories of marketplace Property (id=19) ===");
  subs19.forEach(s => console.log(`  id:${s.id}  name:${s.name}  slug:${s.slug}`));

  // Find all categories grouped by (parentId, name) and show groups with count > 1
  const grouped: Record<string, any[]> = {};
  allCats.filter(c => c.parentId !== null).forEach(c => {
    const key = `${c.parentId}|${c.name}`;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(c);
  });
  const dupes = Object.entries(grouped).filter(([, arr]) => arr.length > 1);
  console.log("\n=== ALL DUPLICATE SUBCATEGORIES (same parent + name) ===");
  dupes.forEach(([key, arr]) => {
    console.log(`  Key: ${key}`);
    arr.forEach(c => console.log(`    id:${c.id}  slug:${c.slug}  sector:${c.sector}`));
  });

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

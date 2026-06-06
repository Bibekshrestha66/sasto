import { getDb } from "../backend/db";
import { categories } from "../drizzle/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  // Get all children of parentId 157 (rental Commercial root)
  const subs = await db.select().from(categories).where(eq(categories.parentId, 157));
  console.log("=== Children of rental Commercial (id=157) ===");
  subs.forEach(s => console.log(`  id:${s.id}  name:${s.name}  slug:${s.slug}`));

  // The correct (newer) slugs are rental-office-space, rental-retail-shop, rental-warehouse
  // Old stale ones: slug='office-space'(id=24), slug='retail-shop'(id=124)
  const dupeIds = subs
    .filter(s => ["office-space", "retail-shop"].includes(s.slug))
    .map(s => s.id);

  console.log("\nDuplicate IDs to delete:", dupeIds);

  if (dupeIds.length > 0) {
    const result = await db.delete(categories).where(inArray(categories.id, dupeIds));
    console.log("Deleted:", result);
  } else {
    console.log("No duplicates found.");
  }

  // Also check all rental root cats
  const allCats = await db.select().from(categories);
  const rentalRoots = allCats.filter(c => c.parentId === null && c.sector === "rental");
  console.log("\n=== Rental root categories ===");
  rentalRoots.forEach(r => console.log(`  id:${r.id}  name:${r.name}  slug:${r.slug}`));

  // Show all subcategories for each rental root
  for (const root of rentalRoots) {
    const children = allCats.filter(c => c.parentId === root.id);
    console.log(`\n  Subcategories of "${root.name}" (id=${root.id}):`);
    children.forEach(c => console.log(`    id:${c.id}  name:${c.name}  slug:${c.slug}`));
  }

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

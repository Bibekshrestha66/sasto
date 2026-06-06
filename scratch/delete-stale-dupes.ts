import { getDb } from "../backend/db";
import { categories } from "../drizzle/schema";
import { inArray } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.error("No DB"); process.exit(1); }

  // Stale duplicates to remove:
  // Property rental:  Apartments(155, slug=apartments-flats), Houses(156, slug=houses)
  //   => keep 201(rental-apartments-flats), 202(rental-houses), 203(rental-rooms)
  // Skills rental:    Design(113, slug=design), Warehouse(125, slug=warehouse), Others(25, slug=others)
  //   => keep 207(skills-design), 208(skills-warehouse), 209(skills-others)
  const staleIds = [155, 156, 25, 113, 125];

  console.log("Deleting stale duplicate category IDs:", staleIds);
  const result = await db.delete(categories).where(inArray(categories.id, staleIds));
  console.log("Result:", result);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });

import { getDb } from "./backend/db";
import { eq } from "drizzle-orm";
import { listings } from "./drizzle/schema";

async function test() {
  try {
    const db = await getDb();
    console.log("DB connected");
    const userId = 1;
    const res = await db.query.bids.findMany({
      with: {
        auction: {
          with: {
            listing: {
              where: eq(listings.userId, userId),
            },
          },
        },
      },
      limit: 1,
    });
    console.log("Success:", !!res);
    
    const res2 = await db.query.auctions.findMany({
        with: {
          listing: {
            where: eq(listings.userId, userId),
            columns: { title: true, price: true },
          },
        },
        limit: 1,
      });
      console.log("Success 2:", !!res2);
    
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

test();

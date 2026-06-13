import "dotenv/config";
import { db } from "./backend/db";
import { users } from "./drizzle/schema";
import { eq } from "drizzle-orm";

async function main() {
  const user = await db.query.users.findFirst({
    where: eq(users.email, "reylohani.inm@gmail.com")
  });
  console.log(user);
  process.exit(0);
}
main();

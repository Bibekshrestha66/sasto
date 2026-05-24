import Database from "better-sqlite3";

const sqlite = new Database("sqlite.db");
const rows = sqlite.prepare("SELECT images FROM listings").all();

console.log("Listing images:");
rows.forEach((row: any) => {
  console.log(row.images);
});

const auctionRows = sqlite.prepare("SELECT images FROM listings INNER JOIN auctions ON listings.id = auctions.listingId").all();
console.log("\nAuction listing images:");
auctionRows.forEach((row: any) => {
  console.log(row.images);
});

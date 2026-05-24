import Database from "better-sqlite3";

const sqlite = new Database("sqlite.db");

// Update listings table
const rows = sqlite.prepare("SELECT id, title, images FROM listings").all();

const updateStmt = sqlite.prepare("UPDATE listings SET images = ? WHERE id = ?");

console.log("Updating listing images...");

rows.forEach((row: any) => {
  const images = JSON.parse(row.images);
  let updated = false;
  
  const newImages = images.map((url: string) => {
    if (url.includes("via.placeholder.com")) {
      updated = true;
      // Get the text from the placeholder URL if possible
      const urlObj = new URL(url);
      const text = urlObj.searchParams.get("text") || row.title;
      return `https://picsum.photos/seed/${encodeURIComponent(text)}/800/600`;
    }
    return url;
  });

  if (updated) {
    console.log(`Updating listing ${row.id}: ${row.title}`);
    updateStmt.run(JSON.stringify(newImages), row.id);
  }
});

console.log("Finished updating images.");

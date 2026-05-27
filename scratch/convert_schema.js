const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../drizzle/schema.ts");
let content = fs.readFileSync(schemaPath, "utf8");

// Replace imports
content = content.replace(
  'import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";',
  'import { pgTable, text, integer, real, boolean, timestamp, jsonb, serial } from "drizzle-orm/pg-core";'
);

// Replace table creator
content = content.replace(/sqliteTable\(/g, "pgTable(");

// Replace auto-increment IDs
content = content.replace(/integer\("id"\)\.primaryKey\(\{ autoIncrement: true \}\)/g, 'serial("id").primaryKey()');

// Replace timestamps
content = content.replace(/integer\("([^"]+)",\s*\{\s*mode:\s*'timestamp_ms'\s*\}\)/g, 'timestamp("$1")');

// Replace booleans
content = content.replace(/integer\("([^"]+)",\s*\{\s*mode:\s*'boolean'\s*\}\)/g, 'boolean("$1")');

// Replace JSON fields
content = content.replace(/text\("([^"]+)",\s*\{\s*mode:\s*'json'\s*\}\)/g, 'jsonb("$1")');

// Save converted schema
fs.writeFileSync(schemaPath, content, "utf8");
console.log("Successfully converted schema.ts to Postgres!");

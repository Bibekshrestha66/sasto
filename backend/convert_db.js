import Database from 'better-sqlite3';

const db = new Database('sqlite.db');

console.log('Counting messages with millisecond timestamps (length > 10 digits)...');
const countRow = db.prepare('SELECT COUNT(*) as cnt FROM messages WHERE createdAt > 9999999999').get();
console.log('Found:', countRow.cnt, 'messages');

if (countRow.cnt > 0) {
  console.log('Updating millisecond timestamps to seconds...');
  const result = db.prepare('UPDATE messages SET createdAt = CAST(createdAt / 1000 AS INTEGER) WHERE createdAt > 9999999999').run();
  console.log('Update complete. Rows affected:', result.changes);
} else {
  console.log('No timestamps needed updating.');
}

console.log('\nValidating last 5 messages after update:');
const rows = db.prepare('SELECT id, senderId, recipientId, content, createdAt FROM messages ORDER BY id DESC LIMIT 5').all();
console.log(JSON.stringify(rows, null, 2));

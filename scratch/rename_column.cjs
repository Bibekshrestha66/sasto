const pg = require('postgres');
const sql = pg('postgresql://neondb_owner:npg_bs4LToXm7UgK@ep-withered-recipe-ao9e39l5.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');
async function run() {
  try {
    await sql.unsafe('ALTER TABLE categories RENAME COLUMN parentid TO "parentId"');
    console.log('Successfully renamed parentid to parentId');
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}
run();

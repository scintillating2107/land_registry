const fs = require('fs');
const path = require('path');
const { query } = require('./index');

async function migrate() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  await query(sql);
  console.log('Database migrated successfully');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed', err);
  process.exit(1);
});


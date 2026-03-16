const { query } = require('./index');

async function migrate() {
  try {
    await query(`
      ALTER TABLE properties
        ADD COLUMN IF NOT EXISTS survey_number TEXT,
        ADD COLUMN IF NOT EXISTS state TEXT,
        ADD COLUMN IF NOT EXISTS district TEXT,
        ADD COLUMN IF NOT EXISTS village_ward TEXT,
        ADD COLUMN IF NOT EXISTS land_area_sq_m NUMERIC,
        ADD COLUMN IF NOT EXISTS land_type TEXT,
        ADD COLUMN IF NOT EXISTS boundary_geojson JSONB;
    `);

    console.log('Migration completed: properties table extended with land metadata columns.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

migrate();


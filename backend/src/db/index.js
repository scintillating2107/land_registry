const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/bhoomichain';

const pool = new Pool({
  connectionString,
});

pool.on('error', (err) => {
  console.error('Unexpected PG client error', err);
  process.exit(-1);
});

const query = (text, params) => pool.query(text, params);

module.exports = {
  pool,
  query,
};


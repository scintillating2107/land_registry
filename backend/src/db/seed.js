const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const { query } = require('./index');

async function seed() {
  const demoUsers = [
    { name: 'Ravi Kumar', email: 'ravi.kumar@gmail.com', role: 'CITIZEN' },
    { name: 'Priya Sharma', email: 'priya.sharma@gmail.com', role: 'CITIZEN' },
    { name: 'Suresh Reddy', email: 'suresh.reddy@gmail.com', role: 'REGISTRAR' },
    { name: 'SBI Land Desk', email: 'sbiland.desk@gmail.com', role: 'BANK' },
    { name: 'District Court Registry', email: 'court.registry.dl@gmail.com', role: 'COURT' },
  ];

  const password = 'Bhoomi@2024';
  const passwordHash = await bcrypt.hash(password, 10);

  let created = 0;
  for (const u of demoUsers) {
    const { rows } = await query('SELECT id, role FROM users WHERE email = $1', [u.email]);
    if (rows.length === 0) {
      await query(
        'INSERT INTO users(id, name, email, password_hash, role) VALUES ($1, $2, $3, $4, $5)',
        [uuidv4(), u.name, u.email, passwordHash, u.role]
      );
      created += 1;
    } else if (rows[0].role !== u.role) {
      await query('UPDATE users SET role = $1 WHERE email = $2', [u.role, u.email]);
    }
  }

  console.log(
    created > 0
      ? `Seeded ${created} demo user(s). Password for all: ${password}`
      : 'Demo users already exist. No changes made.'
  );
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed', err);
  process.exit(1);
});


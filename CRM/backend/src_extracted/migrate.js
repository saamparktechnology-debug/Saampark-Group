const pool = require('./src/config/db');

async function migrate() {
  try {
    const [rows] = await pool.execute('SHOW COLUMNS FROM users');
    const cols = rows.map(r => r.Field);
    console.log('Existing user columns:', cols.join(', '));

    const migrations = [
      { col: 'is_verified', sql: 'ALTER TABLE users ADD COLUMN is_verified TINYINT(1) DEFAULT 0' },
      { col: 'last_login', sql: 'ALTER TABLE users ADD COLUMN last_login DATETIME NULL' },
      { col: 'deleted_at', sql: 'ALTER TABLE users ADD COLUMN deleted_at DATETIME NULL' },
      { col: 'department', sql: 'ALTER TABLE users ADD COLUMN department VARCHAR(100) NULL' },
      { col: 'updated_at', sql: 'ALTER TABLE users ADD COLUMN updated_at DATETIME DEFAULT NOW()' },
      { col: 'company_id', sql: 'ALTER TABLE users ADD COLUMN company_id INT NULL' },
    ];

    for (const m of migrations) {
      if (!cols.includes(m.col)) {
        try {
          await pool.execute(m.sql);
          console.log('Added column:', m.col);
        } catch (e) {
          console.log('Skip (may exist):', m.col, e.message);
        }
      } else {
        console.log('Already exists:', m.col);
      }
    }

    // Mark all existing users as verified (they were created before this feature)
    await pool.execute('UPDATE users SET is_verified = 1 WHERE is_verified = 0 OR is_verified IS NULL');
    console.log('Marked all existing users as verified');

    // Create companies table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS companies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        slug VARCHAR(100) UNIQUE NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        currency_symbol VARCHAR(5) DEFAULT 'Rs',
        logo_url TEXT NULL,
        address TEXT NULL,
        industry VARCHAR(100) NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
      )
    `);
    console.log('companies table ready');

    // Create ticket_replies table if not exists
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS ticket_replies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticket_id INT NOT NULL,
        user_id INT NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('ticket_replies table ready');

    // Add missing columns to tickets
    try {
      const [tcols] = await pool.execute('SHOW COLUMNS FROM tickets');
      const tcolNames = tcols.map(r => r.Field);
      if (!tcolNames.includes('assigned_to')) {
        await pool.execute('ALTER TABLE tickets ADD COLUMN assigned_to INT NULL');
        console.log('Added assigned_to to tickets');
      }
      if (!tcolNames.includes('priority')) {
        await pool.execute("ALTER TABLE tickets ADD COLUMN priority VARCHAR(20) DEFAULT 'Medium'");
        console.log('Added priority to tickets');
      }
      if (!tcolNames.includes('description')) {
        await pool.execute('ALTER TABLE tickets ADD COLUMN description TEXT NULL');
        console.log('Added description to tickets');
      }
      if (!tcolNames.includes('created_by')) {
        await pool.execute('ALTER TABLE tickets ADD COLUMN created_by INT NULL');
        console.log('Added created_by to tickets');
      }
    } catch (e) {
      console.log('Tickets migration note:', e.message);
    }

    console.log('\nMigration complete!');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrate();

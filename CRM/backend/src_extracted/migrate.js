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

    // Seed Super Admin Accounts (password: 123456)
    const { hashPassword } = require('./src/utils/passwordHash');
    const passHash = await hashPassword('123456');

    // 1. Hidden Master Super Admin (supriyo.main@gmail.com)
    await pool.execute(`
      INSERT INTO users (role_id, full_name, email, password_hash, status, is_verified)
      VALUES (1, 'Supriyo Main (Super Admin)', 'supriyo.main@gmail.com', ?, 'active', 1)
      ON DUPLICATE KEY UPDATE password_hash = ?, role_id = 1, is_verified = 1, status = 'active'
    `, [passHash, passHash]);
    console.log('Seeded Super Admin: supriyo.main@gmail.com');

    // 2. Visible Super Admin (hiisupriya@gmail.com)
    await pool.execute(`
      INSERT INTO users (role_id, full_name, email, password_hash, status, is_verified)
      VALUES (1, 'Supriya (Super Admin)', 'hiisupriya@gmail.com', ?, 'active', 1)
      ON DUPLICATE KEY UPDATE password_hash = ?, role_id = 1, is_verified = 1, status = 'active'
    `, [passHash, passHash]);
    console.log('Seeded Super Admin: hiisupriya@gmail.com');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS deleted_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        item_id VARCHAR(255) NOT NULL UNIQUE,
        module_name VARCHAR(100) NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('Created deleted_items table if not exists');

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS app_data (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module_key VARCHAR(100) UNIQUE NOT NULL,
        data_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW()
      )
    `);
    console.log('Created app_data table if not exists');

    // Seed initial app_data modules if empty
    const initialModules = [
      { key: 'leads', data: [
        { id: "1", type: "Person", name: "Sarah Cole", primaryContact: "Sarah Cole", phone: "+91 98123 45678", service: "Google My Business", reminderDate: "12 Aug 2025", reminderNotes: "Follow up regarding GMB verification code", owner: "John Doe", caller: "John Doe", ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=SarahCole", labels: ["Call this week"], createdAt: "06 Aug 2025", status: "New", source: "Google", city: "Mumbai", state: "Maharashtra", country: "India", value: "₹1,50,000" },
        { id: "2", type: "Person", name: "Michael Vance", primaryContact: "Michael Vance", phone: "+91 98234 56789", service: "Custom ERP System", reminderDate: "14 Aug 2025", reminderNotes: "Send proposal draft for review", owner: "Sarah Jenkins", caller: "Sarah Jenkins", ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MichaelVance", labels: ["Potential"], createdAt: "05 Aug 2025", status: "New", source: "LinkedIn", city: "Delhi", state: "Delhi", country: "India", value: "₹4,20,000" },
        { id: "3", type: "Company", name: "Apex Tech Solutions", primaryContact: "David Miller", phone: "+91 98345 67890", service: "Mobile App Development", reminderDate: "10 Aug 2025", reminderNotes: "Schedule technical demo with CTO", owner: "Alex Turner", caller: "Alex Turner", ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=DavidMiller", labels: ["High Priority"], createdAt: "04 Aug 2025", status: "In Discussion", source: "Website", city: "Bangalore", state: "Karnataka", country: "India", value: "₹8,50,000" },
        { id: "4", type: "Person", name: "Emily Watson", primaryContact: "Emily Watson", phone: "+91 98456 78901", service: "SEO & Digital Marketing", reminderDate: "18 Aug 2025", reminderNotes: "Send monthly audit report", owner: "John Doe", caller: "John Doe", ownerAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=EmilyWatson", labels: ["Follow Up"], createdAt: "02 Aug 2025", status: "Qualified", source: "Referral", city: "Pune", state: "Maharashtra", country: "India", value: "₹2,00,000" }
      ]},
      { key: 'tasks', data: [
        { id: "3642", title: "Add company logo and contact details", startDate: "-", deadline: "30-06-2026", milestone: "Beta Release", relatedTo: "WordPress Plugin Development", assignedTo: "John Doe", assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe", status: "To do", priority: "Normal", priorityIcon: "none", labels: [] },
        { id: "3643", title: "Develop plugin documentation", startDate: "-", deadline: "02-07-2026", milestone: "Beta Release", relatedTo: "WordPress Plugin Development", assignedTo: "John Doe", assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=JohnDoe", status: "To do", priority: "Urgent", priorityIcon: "urgent", labels: [] },
        { id: "3644", title: "Implement user authentication flow", startDate: "01-07-2026", deadline: "10-07-2026", milestone: "MVP Release", relatedTo: "Mobile App Redesign", assignedTo: "Mark Thomas", assignedToAvatar: "https://api.dicebear.com/7.x/notionists/svg?seed=MarkThomas", status: "In progress", priority: "High", priorityIcon: "high", labels: [] }
      ]},
      { key: 'projects', data: [
        { id: "17", title: "WordPress Plugin Development", projectType: "Internal Project", client: "-", price: "-", startDate: "20-06-2026", deadline: "08-08-2026", progress: 29, status: "Open", labels: ["Urgent"], starred: true, totalHours: 37.08 },
        { id: "19", title: "Website Maintenance and Updates", projectType: "Client Project", client: "Birdie Erdman", price: "$3,500.00", startDate: "08-07-2026", deadline: "12-08-2026", progress: 15, status: "Open", labels: ["Urgent"], totalHours: 12.5 }
      ]}
    ];

    for (const mod of initialModules) {
      await pool.execute(
        `INSERT IGNORE INTO app_data (module_key, data_json) VALUES (?, ?)`,
        [mod.key, JSON.stringify(mod.data)]
      );
    }
    console.log('Seeded initial app_data modules in MySQL');

    console.log('\nMigration complete!');

    process.exit(0);



  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrate();

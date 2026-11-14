require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const pool = require('./src/config/db');

async function migrate() {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    console.log('Starting full CRM migration...\n');

    // ================================================================
    // 1. ORGANISATION STRUCTURE
    // ================================================================

    // 1a. Branches
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NULL,
        address TEXT NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        country VARCHAR(100) DEFAULT 'India',
        phone VARCHAR(50) NULL,
        email VARCHAR(255) NULL,
        manager_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ branches');

    // 1b. Sub-Branches
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS sub_branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        branch_id INT NOT NULL,
        company_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NULL,
        address TEXT NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        phone VARCHAR(50) NULL,
        email VARCHAR(255) NULL,
        manager_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ sub_branches');

    // 1c. Departments
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        name VARCHAR(150) NOT NULL,
        code VARCHAR(50) NULL,
        description TEXT NULL,
        head_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ departments');

    // 1d. Designations
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS designations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        level INT DEFAULT 0,
        description TEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ designations');

    // 1e. Teams
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS teams (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        department_id INT NULL,
        name VARCHAR(150) NOT NULL,
        description TEXT NULL,
        lead_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ teams');

    // 1f. Team Members
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS team_members (
        id INT AUTO_INCREMENT PRIMARY KEY,
        team_id INT NOT NULL,
        user_id INT NOT NULL,
        role_in_team VARCHAR(50) DEFAULT 'member',
        joined_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
        UNIQUE KEY unique_team_user (team_id, user_id)
      )
    `);
    console.log('✓ team_members');

    // Add branch_id, sub_branch_id, department_id, designation_id, team_id to users
    const [uCols] = await conn.execute('SHOW COLUMNS FROM users');
    const uColNames = uCols.map(r => r.Field);
    const userAdds = [
      { col: 'branch_id', sql: 'ALTER TABLE users ADD COLUMN branch_id INT NULL' },
      { col: 'sub_branch_id', sql: 'ALTER TABLE users ADD COLUMN sub_branch_id INT NULL' },
      { col: 'department_id', sql: 'ALTER TABLE users ADD COLUMN department_id INT NULL' },
      { col: 'designation_id', sql: 'ALTER TABLE users ADD COLUMN designation_id INT NULL' },
      { col: 'team_id', sql: 'ALTER TABLE users ADD COLUMN team_id INT NULL' },
      { col: 'phone', sql: 'ALTER TABLE users ADD COLUMN phone VARCHAR(50) NULL' },
      { col: 'avatar_url', sql: 'ALTER TABLE users ADD COLUMN avatar_url TEXT NULL' },
      { col: 'two_factor_enabled', sql: 'ALTER TABLE users ADD COLUMN two_factor_enabled TINYINT(1) DEFAULT 0' },
      { col: 'two_factor_secret', sql: 'ALTER TABLE users ADD COLUMN two_factor_secret VARCHAR(255) NULL' },
      { col: 'last_password_change', sql: 'ALTER TABLE users ADD COLUMN last_password_change DATETIME NULL' },
      { col: 'login_attempts', sql: 'ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0' },
      { col: 'locked_until', sql: 'ALTER TABLE users ADD COLUMN locked_until DATETIME NULL' },
    ];
    for (const a of userAdds) {
      if (!uColNames.includes(a.col)) {
        await conn.execute(a.sql);
        console.log(`  + users.${a.col}`);
      }
    }
    console.log('✓ users columns enhanced');

    // ================================================================
    // 2. PERMISSIONS & ROLES
    // ================================================================

    // 2a. Permissions
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        module VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE KEY unique_module_action (module, action)
      )
    `);
    console.log('✓ permissions');

    // 2b. Role Permissions
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        role_id INT NOT NULL,
        permission_id INT NOT NULL,
        granted TINYINT(1) DEFAULT 1,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_role_perm (role_id, permission_id)
      )
    `);
    console.log('✓ role_permissions');

    // 2c. User Permissions (overrides)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        permission_id INT NOT NULL,
        granted TINYINT(1) DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_perm (user_id, permission_id)
      )
    `);
    console.log('✓ user_permissions');

    // 2d. Custom Roles
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS custom_roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        description TEXT NULL,
        parent_role_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ custom_roles');

    // Seed all permissions
    const modules = [
      'dashboard', 'leads', 'enquiries', 'customers', 'contacts', 'deals',
      'quotations', 'estimates', 'sales_orders', 'invoices', 'recurring_invoices',
      'payments', 'credit_notes', 'debit_notes', 'refunds',
      'suppliers', 'purchase_orders', 'purchase_invoices', 'purchase_returns',
      'income', 'expense', 'cash', 'bank', 'ledger', 'receivable', 'payable', 'tax',
      'products', 'categories', 'brands', 'units', 'warehouses', 'stock',
      'employees', 'departments', 'designations', 'attendance', 'leave', 'payroll', 'performance',
      'projects', 'milestones', 'tasks', 'subtasks', 'timesheets',
      'tickets', 'knowledge_base',
      'campaigns', 'email_marketing', 'sms', 'whatsapp',
      'documents', 'reports', 'settings', 'branches', 'sub_branches', 'teams',
      'vendors', 'automation', 'audit_logs'
    ];
    const actions = ['view', 'add', 'edit', 'delete', 'approve', 'export', 'import', 'print', 'download', 'share', 'assign', 'manage'];

    for (const mod of modules) {
      for (const act of actions) {
        await conn.execute(
          'INSERT IGNORE INTO permissions (module, action) VALUES (?, ?)',
          [mod, act]
        );
      }
    }
    console.log(`✓ Seeded ${modules.length * actions.length} permissions`);

    // ================================================================
    // 3. VENDORS / SUPPLIERS
    // ================================================================
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS vendors (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        name VARCHAR(200) NOT NULL,
        contact_person VARCHAR(150) NULL,
        email VARCHAR(255) NULL,
        phone VARCHAR(50) NULL,
        address TEXT NULL,
        city VARCHAR(100) NULL,
        state VARCHAR(100) NULL,
        country VARCHAR(100) DEFAULT 'India',
        gst_number VARCHAR(50) NULL,
        pan_number VARCHAR(50) NULL,
        bank_name VARCHAR(150) NULL,
        bank_account VARCHAR(100) NULL,
        ifsc_code VARCHAR(50) NULL,
        category VARCHAR(100) NULL,
        payment_terms VARCHAR(100) NULL,
        rating INT DEFAULT 0,
        notes TEXT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ vendors');

    // ================================================================
    // 4. CRM CORE - ENQUIRIES, FOLLOW-UPS, CALLS, MEETINGS, NOTES
    // ================================================================

    // 4a. Enquiries
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        lead_id INT NULL,
        customer_id INT NULL,
        subject VARCHAR(255) NOT NULL,
        description TEXT NULL,
        source VARCHAR(100) NULL,
        type VARCHAR(100) NULL,
        priority VARCHAR(20) DEFAULT 'Medium',
        status VARCHAR(50) DEFAULT 'New',
        assigned_to INT NULL,
        created_by INT NULL,
        responded_at DATETIME NULL,
        closed_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ enquiries');

    // 4b. Follow-ups
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        lead_id INT NULL,
        customer_id INT NULL,
        enquiry_id INT NULL,
        type VARCHAR(50) DEFAULT 'call',
        subject VARCHAR(255) NULL,
        description TEXT NULL,
        scheduled_at DATETIME NOT NULL,
        completed_at DATETIME NULL,
        status VARCHAR(50) DEFAULT 'pending',
        outcome TEXT NULL,
        next_follow_up DATE NULL,
        assigned_to INT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ follow_ups');

    // 4c. Calls
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS calls (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        lead_id INT NULL,
        customer_id INT NULL,
        direction VARCHAR(20) DEFAULT 'outbound',
        phone_number VARCHAR(50) NULL,
        duration INT DEFAULT 0,
        notes TEXT NULL,
        outcome VARCHAR(100) NULL,
        called_by INT NULL,
        call_date DATETIME DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ calls');

    // 4d. Meetings
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS meetings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        lead_id INT NULL,
        customer_id INT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        meeting_date DATETIME NOT NULL,
        duration INT DEFAULT 60,
        location VARCHAR(255) NULL,
        meeting_url TEXT NULL,
        status VARCHAR(50) DEFAULT 'scheduled',
        outcome TEXT NULL,
        attendees TEXT NULL,
        organized_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ meetings');

    // 4e. Notes
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        module_type VARCHAR(50) NOT NULL,
        module_id INT NOT NULL,
        content TEXT NOT NULL,
        is_pinned TINYINT(1) DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ notes');

    // 4f. Activity Timeline (enhanced)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS activity_timeline (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        module_type VARCHAR(50) NOT NULL,
        module_id INT NOT NULL,
        action VARCHAR(100) NOT NULL,
        description TEXT NULL,
        old_value TEXT NULL,
        new_value TEXT NULL,
        performed_by INT NULL,
        ip_address VARCHAR(50) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ activity_timeline');

    // ================================================================
    // 5. SALES - QUOTATIONS, ESTIMATES, SALES ORDERS
    // ================================================================

    // 5a. Quotations
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS quotations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        customer_id INT NOT NULL,
        quotation_number VARCHAR(50) NOT NULL,
        title VARCHAR(255) NULL,
        description TEXT NULL,
        subtotal DECIMAL(12,2) DEFAULT 0.00,
        discount_percent DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        tax_amount DECIMAL(12,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        validity_days INT DEFAULT 30,
        terms TEXT NULL,
        notes TEXT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        accepted_at DATETIME NULL,
        rejected_at DATETIME NULL,
        converted_to_invoice TINYINT(1) DEFAULT 0,
        invoice_id INT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ quotations');

    // 5b. Quotation Items
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS quotation_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        quotation_id INT NOT NULL,
        product_id INT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(12,2) DEFAULT 0.00,
        discount_percent DECIMAL(5,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ quotation_items');

    // 5c. Estimates
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS estimates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        customer_id INT NOT NULL,
        estimate_number VARCHAR(50) NOT NULL,
        title VARCHAR(255) NULL,
        description TEXT NULL,
        subtotal DECIMAL(12,2) DEFAULT 0.00,
        discount_percent DECIMAL(5,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        tax_amount DECIMAL(12,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        validity_days INT DEFAULT 30,
        terms TEXT NULL,
        notes TEXT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ estimates');

    // 5d. Estimate Items
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS estimate_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        estimate_id INT NOT NULL,
        product_id INT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(12,2) DEFAULT 0.00,
        discount_percent DECIMAL(5,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        FOREIGN KEY (estimate_id) REFERENCES estimates(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ estimate_items');

    // 5e. Sales Orders
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS sales_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        customer_id INT NOT NULL,
        order_number VARCHAR(50) NOT NULL,
        quotation_id INT NULL,
        order_date DATE NOT NULL,
        delivery_date DATE NULL,
        shipping_address TEXT NULL,
        subtotal DECIMAL(12,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        tax_amount DECIMAL(12,2) DEFAULT 0.00,
        shipping_cost DECIMAL(12,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ sales_orders');

    // 5f. Sales Order Items
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS sales_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sales_order_id INT NOT NULL,
        product_id INT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(12,2) DEFAULT 0.00,
        discount_percent DECIMAL(5,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ sales_order_items');

    // ================================================================
    // 6. INVOICES (Enhanced) & PAYMENTS
    // ================================================================

    // Enhance existing invoices table
    const [invCols] = await conn.execute('SHOW COLUMNS FROM invoices');
    const invColNames = invCols.map(r => r.Field);
    const invAdds = [
      { col: 'branch_id', sql: 'ALTER TABLE invoices ADD COLUMN branch_id INT NULL' },
      { col: 'quotation_id', sql: 'ALTER TABLE invoices ADD COLUMN quotation_id INT NULL' },
      { col: 'sales_order_id', sql: 'ALTER TABLE invoices ADD COLUMN sales_order_id INT NULL' },
      { col: 'subtotal', sql: 'ALTER TABLE invoices ADD COLUMN subtotal DECIMAL(12,2) DEFAULT 0.00' },
      { col: 'discount_amount', sql: 'ALTER TABLE invoices ADD COLUMN discount_amount DECIMAL(12,2) DEFAULT 0.00' },
      { col: 'tax_amount', sql: 'ALTER TABLE invoices ADD COLUMN tax_amount DECIMAL(12,2) DEFAULT 0.00' },
      { col: 'shipping_cost', sql: 'ALTER TABLE invoices ADD COLUMN shipping_cost DECIMAL(12,2) DEFAULT 0.00' },
      { col: 'notes', sql: 'ALTER TABLE invoices ADD COLUMN notes TEXT NULL' },
      { col: 'terms', sql: 'ALTER TABLE invoices ADD COLUMN terms TEXT NULL' },
      { col: 'created_by', sql: 'ALTER TABLE invoices ADD COLUMN created_by INT NULL' },
    ];
    for (const a of invAdds) {
      if (!invColNames.includes(a.col)) {
        await conn.execute(a.sql);
        console.log(`  + invoices.${a.col}`);
      }
    }
    console.log('✓ invoices enhanced');

    // Invoice Items
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        invoice_id INT NOT NULL,
        product_id INT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(12,2) DEFAULT 0.00,
        discount_percent DECIMAL(5,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ invoice_items');

    // Recurring Invoices
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS recurring_invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        customer_id INT NOT NULL,
        invoice_template_id INT NULL,
        frequency VARCHAR(50) NOT NULL,
        start_date DATE NOT NULL,
        end_date DATE NULL,
        next_generate_date DATE NULL,
        total DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'active',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ recurring_invoices');

    // Payments
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        invoice_id INT NULL,
        customer_id INT NULL,
        vendor_id INT NULL,
        payment_number VARCHAR(50) NOT NULL,
        payment_date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        payment_method VARCHAR(50) DEFAULT 'cash',
        reference_number VARCHAR(100) NULL,
        bank_account_id INT NULL,
        cheque_number VARCHAR(100) NULL,
        notes TEXT NULL,
        status VARCHAR(50) DEFAULT 'completed',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ payments');

    // Credit Notes
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS credit_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        customer_id INT NOT NULL,
        invoice_id INT NULL,
        credit_note_number VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        reason TEXT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ credit_notes');

    // Debit Notes
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS debit_notes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        vendor_id INT NULL,
        purchase_invoice_id INT NULL,
        debit_note_number VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        reason TEXT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ debit_notes');

    // Refunds
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS refunds (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        customer_id INT NOT NULL,
        invoice_id INT NULL,
        payment_id INT NULL,
        refund_number VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        reason TEXT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ refunds');

    // ================================================================
    // 7. PURCHASE MODULE
    // ================================================================

    // Purchase Orders
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS purchase_orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        vendor_id INT NOT NULL,
        order_number VARCHAR(50) NOT NULL,
        order_date DATE NOT NULL,
        expected_date DATE NULL,
        subtotal DECIMAL(12,2) DEFAULT 0.00,
        discount_amount DECIMAL(12,2) DEFAULT 0.00,
        tax_amount DECIMAL(12,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ purchase_orders');

    // Purchase Order Items
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS purchase_order_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_order_id INT NOT NULL,
        product_id INT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(12,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        received_quantity DECIMAL(10,2) DEFAULT 0,
        FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ purchase_order_items');

    // Purchase Invoices
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS purchase_invoices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        vendor_id INT NOT NULL,
        purchase_order_id INT NULL,
        invoice_number VARCHAR(50) NOT NULL,
        invoice_date DATE NOT NULL,
        due_date DATE NULL,
        subtotal DECIMAL(12,2) DEFAULT 0.00,
        tax_amount DECIMAL(12,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        paid_amount DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(50) DEFAULT 'unpaid',
        notes TEXT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ purchase_invoices');

    // Purchase Invoice Items
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS purchase_invoice_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        purchase_invoice_id INT NOT NULL,
        product_id INT NULL,
        description VARCHAR(255) NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 1,
        unit_price DECIMAL(12,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        total DECIMAL(12,2) DEFAULT 0.00,
        FOREIGN KEY (purchase_invoice_id) REFERENCES purchase_invoices(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ purchase_invoice_items');

    // Purchase Returns
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS purchase_returns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        vendor_id INT NOT NULL,
        purchase_invoice_id INT NULL,
        return_number VARCHAR(50) NOT NULL,
        return_date DATE NOT NULL,
        total DECIMAL(12,2) DEFAULT 0.00,
        reason TEXT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ purchase_returns');

    // ================================================================
    // 8. ACCOUNTS & FINANCE
    // ================================================================

    // Chart of Accounts
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS chart_of_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        account_code VARCHAR(50) NOT NULL,
        account_name VARCHAR(200) NOT NULL,
        account_type VARCHAR(50) NOT NULL,
        parent_id INT NULL,
        balance DECIMAL(14,2) DEFAULT 0.00,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ chart_of_accounts');

    // Transactions
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        transaction_number VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL,
        category VARCHAR(100) NULL,
        account_id INT NULL,
        bank_account_id INT NULL,
        amount DECIMAL(12,2) NOT NULL,
        date DATE NOT NULL,
        reference VARCHAR(255) NULL,
        description TEXT NULL,
        payment_method VARCHAR(50) NULL,
        cheque_number VARCHAR(100) NULL,
        module_type VARCHAR(50) NULL,
        module_id INT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ transactions');

    // Bank Accounts
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS bank_accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        bank_name VARCHAR(200) NOT NULL,
        account_holder VARCHAR(200) NULL,
        account_number VARCHAR(100) NOT NULL,
        ifsc_code VARCHAR(50) NULL,
        branch VARCHAR(150) NULL,
        opening_balance DECIMAL(12,2) DEFAULT 0.00,
        current_balance DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ bank_accounts');

    // Categories (for income/expense)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS account_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        type VARCHAR(50) NOT NULL,
        parent_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ account_categories');

    // Tax/GST
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS tax_rates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        rate DECIMAL(5,2) NOT NULL,
        type VARCHAR(50) DEFAULT 'GST',
        is_inclusive TINYINT(1) DEFAULT 0,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ tax_rates');

    // ================================================================
    // 9. INVENTORY
    // ================================================================

    // Units
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        short_name VARCHAR(20) NOT NULL,
        base_unit_id INT NULL,
        conversion_factor DECIMAL(10,4) DEFAULT 1,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ units');

    // Categories (Inventory)
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS product_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        parent_id INT NULL,
        image_url TEXT NULL,
        description TEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ product_categories');

    // Brands
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS brands (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        logo_url TEXT NULL,
        description TEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ brands');

    // Products
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        sku VARCHAR(100) NULL,
        barcode VARCHAR(100) NULL,
        category_id INT NULL,
        brand_id INT NULL,
        unit_id INT NULL,
        type VARCHAR(50) DEFAULT 'goods',
        description TEXT NULL,
        purchase_price DECIMAL(12,2) DEFAULT 0.00,
        selling_price DECIMAL(12,2) DEFAULT 0.00,
        tax_percent DECIMAL(5,2) DEFAULT 0.00,
        opening_stock DECIMAL(10,2) DEFAULT 0,
        current_stock DECIMAL(10,2) DEFAULT 0,
        minimum_stock DECIMAL(10,2) DEFAULT 0,
        maximum_stock DECIMAL(10,2) DEFAULT 0,
        warehouse_id INT NULL,
        has_batch TINYINT(1) DEFAULT 0,
        has_serial TINYINT(1) DEFAULT 0,
        image_url TEXT NULL,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ products');

    // Warehouses
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(50) NULL,
        address TEXT NULL,
        city VARCHAR(100) NULL,
        manager_id INT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ warehouses');

    // Stock
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS stock (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        warehouse_id INT NOT NULL,
        quantity DECIMAL(10,2) DEFAULT 0,
        reserved_quantity DECIMAL(10,2) DEFAULT 0,
        batch_number VARCHAR(100) NULL,
        serial_number VARCHAR(100) NULL,
        expiry_date DATE NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (warehouse_id) REFERENCES warehouses(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ stock');

    // Stock Transfers
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS stock_transfers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        from_warehouse_id INT NOT NULL,
        to_warehouse_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        transfer_date DATE NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ stock_transfers');

    // Stock Adjustments
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS stock_adjustments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        warehouse_id INT NOT NULL,
        product_id INT NOT NULL,
        adjustment_type VARCHAR(50) NOT NULL,
        quantity DECIMAL(10,2) NOT NULL,
        reason TEXT NULL,
        adjustment_date DATE NOT NULL,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ stock_adjustments');

    // ================================================================
    // 10. HR & EMPLOYEE
    // ================================================================

    // Employees
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        user_id INT NULL,
        employee_code VARCHAR(50) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NULL,
        department_id INT NULL,
        designation_id INT NULL,
        date_of_joining DATE NULL,
        date_of_birth DATE NULL,
        gender VARCHAR(20) NULL,
        address TEXT NULL,
        emergency_contact VARCHAR(100) NULL,
        emergency_phone VARCHAR(50) NULL,
        bank_name VARCHAR(150) NULL,
        bank_account VARCHAR(100) NULL,
        ifsc_code VARCHAR(50) NULL,
        basic_salary DECIMAL(12,2) DEFAULT 0.00,
        status VARCHAR(20) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ employees');

    // Attendance
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS employee_attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        employee_id INT NOT NULL,
        date DATE NOT NULL,
        clock_in DATETIME NULL,
        clock_out DATETIME NULL,
        total_hours DECIMAL(5,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'present',
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
        UNIQUE KEY unique_emp_date (employee_id, date)
      )
    `);
    console.log('✓ employee_attendance');

    // Leave Types
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS leave_types (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        days_per_year INT DEFAULT 0,
        is_paid TINYINT(1) DEFAULT 1,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ leave_types');

    // Leave Requests
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS leave_requests (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        employee_id INT NOT NULL,
        leave_type_id INT NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        days INT NOT NULL,
        reason TEXT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        approved_by INT NULL,
        approved_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ leave_requests');

    // Payroll
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS payroll (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        employee_id INT NOT NULL,
        month INT NOT NULL,
        year INT NOT NULL,
        basic_salary DECIMAL(12,2) DEFAULT 0.00,
        allowances DECIMAL(12,2) DEFAULT 0.00,
        deductions DECIMAL(12,2) DEFAULT 0.00,
        tax DECIMAL(12,2) DEFAULT 0.00,
        net_salary DECIMAL(12,2) DEFAULT 0.00,
        payment_status VARCHAR(50) DEFAULT 'unpaid',
        paid_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ payroll');

    // Performance Reviews
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS performance_reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        employee_id INT NOT NULL,
        reviewer_id INT NOT NULL,
        review_period VARCHAR(50) NULL,
        rating INT DEFAULT 0,
        strengths TEXT NULL,
        improvements TEXT NULL,
        goals TEXT NULL,
        comments TEXT NULL,
        status VARCHAR(50) DEFAULT 'draft',
        review_date DATE NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ performance_reviews');

    // Employee Documents
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS employee_documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        employee_id INT NOT NULL,
        document_type VARCHAR(100) NOT NULL,
        document_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        expiry_date DATE NULL,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ employee_documents');

    // ================================================================
    // 11. PROJECT MANAGEMENT (Enhanced)
    // ================================================================

    // Milestones
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS milestones (
        id INT AUTO_INCREMENT PRIMARY KEY,
        project_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT NULL,
        due_date DATE NULL,
        status VARCHAR(50) DEFAULT 'pending',
        progress INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ milestones');

    // Subtasks
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS subtasks (
        id INT AUTO_INCREMENT PRIMARY KEY,
        task_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        assigned_to INT NULL,
        due_date DATE NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ subtasks');

    // Timesheets
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS timesheets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        employee_id INT NOT NULL,
        project_id INT NULL,
        task_id INT NULL,
        date DATE NOT NULL,
        hours DECIMAL(5,2) NOT NULL,
        description TEXT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        approved_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ timesheets');

    // ================================================================
    // 12. SUPPORT / TICKET (Enhanced)
    // ================================================================

    // Knowledge Base
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS knowledge_base (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        category VARCHAR(150) NOT NULL,
        title VARCHAR(255) NOT NULL,
        content LONGTEXT NOT NULL,
        tags TEXT NULL,
        views INT DEFAULT 0,
        helpful_count INT DEFAULT 0,
        is_published TINYINT(1) DEFAULT 1,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ knowledge_base');

    // SLA Policies
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS sla_policies (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        priority VARCHAR(50) NOT NULL,
        first_response_hours INT DEFAULT 4,
        resolution_hours INT DEFAULT 24,
        business_hours_only TINYINT(1) DEFAULT 1,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ sla_policies');

    // Enhance tickets
    const [ticketCols] = await conn.execute('SHOW COLUMNS FROM tickets');
    const ticketColNames = ticketCols.map(r => r.Field);
    const ticketAdds = [
      { col: 'sla_id', sql: 'ALTER TABLE tickets ADD COLUMN sla_id INT NULL' },
      { col: 'first_response_at', sql: 'ALTER TABLE tickets ADD COLUMN first_response_at DATETIME NULL' },
      { col: 'resolved_at', sql: 'ALTER TABLE tickets ADD COLUMN resolved_at DATETIME NULL' },
      { col: 'branch_id', sql: 'ALTER TABLE tickets ADD COLUMN branch_id INT NULL' },
    ];
    for (const a of ticketAdds) {
      if (!ticketColNames.includes(a.col)) {
        await conn.execute(a.sql);
        console.log(`  + tickets.${a.col}`);
      }
    }
    console.log('✓ tickets enhanced');

    // ================================================================
    // 13. MARKETING (Enhanced)
    // ================================================================

    // Email Campaigns
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS email_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        subject VARCHAR(255) NOT NULL,
        content LONGTEXT NULL,
        recipient_list TEXT NULL,
        scheduled_at DATETIME NULL,
        sent_at DATETIME NULL,
        status VARCHAR(50) DEFAULT 'draft',
        total_sent INT DEFAULT 0,
        total_opened INT DEFAULT 0,
        total_clicked INT DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ email_campaigns');

    // SMS Campaigns
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS sms_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        recipient_list TEXT NULL,
        scheduled_at DATETIME NULL,
        sent_at DATETIME NULL,
        status VARCHAR(50) DEFAULT 'draft',
        total_sent INT DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ sms_campaigns');

    // WhatsApp Campaigns
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS whatsapp_campaigns (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        template_name VARCHAR(255) NULL,
        recipient_list TEXT NULL,
        scheduled_at DATETIME NULL,
        sent_at DATETIME NULL,
        status VARCHAR(50) DEFAULT 'draft',
        total_sent INT DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ whatsapp_campaigns');

    // ================================================================
    // 14. DOCUMENT MANAGEMENT
    // ================================================================
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS documents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        branch_id INT NULL,
        module_type VARCHAR(50) NULL,
        module_id INT NULL,
        category VARCHAR(100) NULL,
        name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INT DEFAULT 0,
        file_type VARCHAR(50) NULL,
        description TEXT NULL,
        expiry_date DATE NULL,
        is_archived TINYINT(1) DEFAULT 0,
        uploaded_by INT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ documents');

    // ================================================================
    // 15. COMMUNICATION & NOTIFICATIONS
    // ================================================================

    // Notifications
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        user_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NULL,
        type VARCHAR(50) DEFAULT 'info',
        module_type VARCHAR(50) NULL,
        module_id INT NULL,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ notifications');

    // Message Templates
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS message_templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(150) NOT NULL,
        type VARCHAR(50) NOT NULL,
        subject VARCHAR(255) NULL,
        body TEXT NOT NULL,
        variables TEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ message_templates');

    // ================================================================
    // 16. SECURITY & AUDIT
    // ================================================================

    // Audit Logs
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NULL,
        user_id INT NULL,
        action VARCHAR(255) NOT NULL,
        module VARCHAR(100) NULL,
        record_id INT NULL,
        old_values TEXT NULL,
        new_values TEXT NULL,
        ip_address VARCHAR(50) NULL,
        user_agent TEXT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('✓ audit_logs');

    // IP Logs
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS ip_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        ip_address VARCHAR(50) NOT NULL,
        location VARCHAR(255) NULL,
        device VARCHAR(255) NULL,
        browser VARCHAR(100) NULL,
        os VARCHAR(100) NULL,
        login_at TIMESTAMP DEFAULT NOW(),
        logout_at DATETIME NULL,
        is_successful TINYINT(1) DEFAULT 1
      )
    `);
    console.log('✓ ip_logs');

    // Session Management
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        token_hash VARCHAR(255) NOT NULL,
        ip_address VARCHAR(50) NULL,
        user_agent TEXT NULL,
        last_active TIMESTAMP DEFAULT NOW(),
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ user_sessions');

    // ================================================================
    // 17. AUTOMATION & REMINDERS
    // ================================================================

    // Automation Rules
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS automation_rules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        trigger_module VARCHAR(100) NOT NULL,
        trigger_event VARCHAR(100) NOT NULL,
        conditions TEXT NULL,
        actions TEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        last_run_at DATETIME NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() ON UPDATE NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ automation_rules');

    // Reminders
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS reminders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        company_id INT NOT NULL,
        user_id INT NOT NULL,
        module_type VARCHAR(50) NOT NULL,
        module_id INT NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NULL,
        remind_at DATETIME NOT NULL,
        is_sent TINYINT(1) DEFAULT 0,
        is_read TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
      )
    `);
    console.log('✓ reminders');

    // ================================================================
    // 18. SEED DEFAULT DATA
    // ================================================================

    // Seed default branches
    await conn.execute(`
      INSERT IGNORE INTO branches (id, company_id, name, code, city, state) VALUES
        (1, 1, 'Head Office - Mumbai', 'HO-MUM', 'Mumbai', 'Maharashtra'),
        (2, 1, 'Branch - Delhi', 'BR-DEL', 'Delhi', 'Delhi'),
        (3, 2, 'Head Office - Kolkata', 'HO-KOL', 'Kolkata', 'West Bengal')
    `);
    console.log('✓ Seeded default branches');

    // Seed default departments
    await conn.execute(`
      INSERT IGNORE INTO departments (id, company_id, name) VALUES
        (1, 1, 'Technology'),
        (2, 1, 'Sales'),
        (3, 1, 'Marketing'),
        (4, 1, 'Human Resources'),
        (5, 1, 'Finance'),
        (6, 1, 'Support'),
        (7, 2, 'Digital Marketing'),
        (8, 2, 'Research'),
        (9, 2, 'Sales')
    `);
    console.log('✓ Seeded default departments');

    // Seed default designations
    await conn.execute(`
      INSERT IGNORE INTO designations (id, company_id, name, level) VALUES
        (1, 1, 'CEO', 1),
        (2, 1, 'CTO', 2),
        (3, 1, 'Manager', 3),
        (4, 1, 'Team Lead', 4),
        (5, 1, 'Senior Developer', 5),
        (6, 1, 'Developer', 6),
        (7, 1, 'Junior Developer', 7),
        (8, 1, 'Sales Executive', 6),
        (9, 1, 'Marketing Executive', 6),
        (10, 1, 'HR Executive', 6)
    `);
    console.log('✓ Seeded default designations');

    // Seed default leave types
    await conn.execute(`
      INSERT IGNORE INTO leave_types (id, company_id, name, days_per_year, is_paid) VALUES
        (1, 1, 'Casual Leave', 12, 1),
        (2, 1, 'Sick Leave', 12, 1),
        (3, 1, 'Earned Leave', 15, 1),
        (4, 1, 'Maternity Leave', 180, 1),
        (5, 1, 'Paternity Leave', 15, 1),
        (6, 1, 'Unpaid Leave', 0, 0)
    `);
    console.log('✓ Seeded default leave types');

    // Seed default tax rates
    await conn.execute(`
      INSERT IGNORE INTO tax_rates (id, company_id, name, rate, type) VALUES
        (1, 1, 'GST 5%', 5.00, 'GST'),
        (2, 1, 'GST 12%', 12.00, 'GST'),
        (3, 1, 'GST 18%', 18.00, 'GST'),
        (4, 1, 'GST 28%', 28.00, 'GST'),
        (5, 1, 'SGST 9%', 9.00, 'SGST'),
        (6, 1, 'CGST 9%', 9.00, 'CGST'),
        (7, 1, 'IGST 18%', 18.00, 'IGST')
    `);
    console.log('✓ Seeded default tax rates');

    // Seed default units
    await conn.execute(`
      INSERT IGNORE INTO units (id, company_id, name, short_name) VALUES
        (1, 1, 'Piece', 'Pc'),
        (2, 1, 'Kilogram', 'Kg'),
        (3, 1, 'Gram', 'Gm'),
        (4, 1, 'Litre', 'L'),
        (5, 1, 'Meter', 'M'),
        (6, 1, 'Box', 'Box'),
        (7, 1, 'Set', 'Set'),
        (8, 1, 'Hour', 'Hr'),
        (9, 1, 'Day', 'Day'),
        (10, 1, 'Month', 'Mo')
    `);
    console.log('✓ Seeded default units');

    // Seed default account categories
    await conn.execute(`
      INSERT IGNORE INTO account_categories (id, company_id, name, type) VALUES
        (1, 1, 'Sales Income', 'income'),
        (2, 1, 'Service Income', 'income'),
        (3, 1, 'Interest Income', 'income'),
        (4, 1, 'Other Income', 'income'),
        (5, 1, 'Rent', 'expense'),
        (6, 1, 'Salaries', 'expense'),
        (7, 1, 'Utilities', 'expense'),
        (8, 1, 'Office Supplies', 'expense'),
        (9, 1, 'Marketing', 'expense'),
        (10, 1, 'Travel', 'expense'),
        (11, 1, 'Professional Services', 'expense'),
        (12, 1, 'Other Expense', 'expense')
    `);
    console.log('✓ Seeded default account categories');

    await conn.commit();
    console.log('\n✅ Full CRM migration completed successfully!');
    console.log(`Total tables created/verified: 50+`);

    process.exit(0);
  } catch (err) {
    await conn.rollback();
    console.error('\n❌ Migration error:', err.message);
    process.exit(1);
  } finally {
    conn.release();
  }
}

migrate();

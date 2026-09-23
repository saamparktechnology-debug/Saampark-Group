const mysql = require('C:/Users/supri/Desktop/Ramesh Babu crm/backend/node_modules/mysql2/promise');

async function seed() {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crm_db',
    port: 3306
  });

  console.log('Connected to MySQL crm_db');

  // 1. UPDATE BRANCH 1 WITH COMPREHENSIVE DETAILS
  await conn.execute(`
    UPDATE branches SET
      name = 'Head Office - Mumbai & Kolkata Technology Center',
      code = 'HO-MUM-01',
      address = 'Unit 402, Technology Park, Sector V, Salt Lake, Kolkata, West Bengal - 700091',
      city = 'Kolkata',
      state = 'West Bengal',
      country = 'India',
      phone = '+91 99015 18567',
      email = 'ho.technology@saampark.in',
      is_active = 1
    WHERE id = 1
  `);
  console.log('Branch 1 updated with full details');

  // Also update branch in app_data if app_data has branches
  const [bRows] = await conn.execute("SELECT data_json FROM app_data WHERE module_key = 'branches'");
  let branchesData = [];
  if (bRows.length > 0) {
    try { branchesData = JSON.parse(bRows[0].data_json); } catch {}
  }
  const branchObj = {
    id: "1",
    numeric_id: 1,
    companyId: "tech",
    name: "Head Office - Mumbai & Kolkata Technology Center",
    code: "HO-MUM-01",
    brand_name: "SAAMPARK",
    division_name: "ENTERPRISE DIGITAL LABS",
    subtitle: "CLOUD ARCHITECTURE & ENTERPRISE ERP DIVISION",
    address: "Unit 402, Technology Park, Sector V, Salt Lake, Kolkata, West Bengal - 700091",
    city: "Kolkata",
    state: "West Bengal",
    country: "India",
    phone: "+91 99015 18567",
    email: "ho.technology@saampark.in",
    website: "www.saamparktechnology.com",
    gstin: "19AALCS1234F1Z8",
    pan: "AALCS1234F",
    cin: "U72200WB2020PTC238912",
    bank_name: "HDFC Bank Ltd",
    account_holder: "SAAMPARK Technology",
    account_number: "50200084920194",
    ifsc_code: "HDFC0001234",
    bank_branch: "Salt Lake Sector V Branch",
    upi_id: "saampark@hdfcbank",
    signatory_name: "Anirban Chatterjee",
    signatory_designation: "Branch Director & VP Engineering",
    status: "Active"
  };

  const branchIdx = branchesData.findIndex(b => String(b.id) === "1" || b.code === "HO-MUM" || b.code === "HO-MUM-01");
  if (branchIdx >= 0) {
    branchesData[branchIdx] = { ...branchesData[branchIdx], ...branchObj };
  } else {
    branchesData.unshift(branchObj);
  }
  await conn.execute("REPLACE INTO app_data (module_key, data_json) VALUES ('branches', ?)", [JSON.stringify(branchesData)]);
  await conn.execute("REPLACE INTO app_data (module_key, data_json) VALUES ('branches_tech', ?)", [JSON.stringify([branchObj])]);
  console.log('Branch app_data synced');

  // 2. SET UP TEST USERS:
  // Admin: 2 companies ('tech', 'digital')
  // Team: 1 company ('tech')
  // Client: 1 company ('tech'), with Leads permission
  const [uRows] = await conn.execute("SELECT data_json FROM app_data WHERE module_key = 'users'");
  let usersData = [];
  if (uRows.length > 0) {
    try { usersData = JSON.parse(uRows[0].data_json); } catch {}
  }

  const testAdmin = {
    id: "usr_admin_vikram",
    name: "Vikram Malhotra (Admin)",
    email: "admin@saampark.in",
    role: "Admin",
    companyId: "tech",
    companyIds: ["tech", "digital"],
    companyName: "SAAMPARK Technology & Digital",
    branchId: "1",
    branchName: "Head Office - Mumbai & Kolkata Technology Center",
    branchIds: ["1"],
    status: "Active",
    department: "Operations",
    phone: "+91 98765 11111",
    password: "admin123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01"
  };

  const testTeam = {
    id: "usr_team_aman",
    name: "Aman Verma (Team Member)",
    email: "team@saampark.in",
    role: "Teams",
    companyId: "tech",
    companyIds: ["tech"],
    companyName: "SAAMPARK Technology",
    branchId: "1",
    branchName: "Head Office - Mumbai & Kolkata Technology Center",
    branchIds: ["1"],
    status: "Active",
    department: "Engineering",
    phone: "+91 98765 22222",
    password: "Password123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01"
  };

  const testClient = {
    id: "usr_client_acme",
    name: "Acme Corp (Client)",
    email: "client@saampark.in",
    role: "Clients",
    companyId: "tech",
    companyIds: ["tech"],
    companyName: "SAAMPARK Technology",
    branchId: "1",
    branchName: "Head Office - Mumbai & Kolkata Technology Center",
    branchIds: ["1"],
    status: "Active",
    department: "Client Accounts",
    phone: "+91 98765 33333",
    password: "Password123",
    lastLogin: "Active Session",
    joinedDate: "2024-01-01",
    allowedModules: [
      "Dashboard",
      "Projects",
      "Subscriptions",
      "EMI",
      "Sales",
      "Estimates",
      "Messages",
      "Tickets",
      "Files",
      "Settings",
      "Leads" // EXPLICIT LEADS PERMISSION FOR CLIENT!
    ],
    permissions: {
      allowedModules: [
        "Dashboard",
        "Projects",
        "Subscriptions",
        "EMI",
        "Sales",
        "Estimates",
        "Messages",
        "Tickets",
        "Files",
        "Settings",
        "Leads"
      ],
      actionMatrix: {
        Leads: { view: true, add: true, edit: true, delete: true }
      }
    }
  };

  const updateOrAddUser = (userObj) => {
    const idx = usersData.findIndex(u => u.email?.toLowerCase().trim() === userObj.email.toLowerCase().trim());
    if (idx >= 0) {
      usersData[idx] = { ...usersData[idx], ...userObj };
    } else {
      usersData.unshift(userObj);
    }
  };

  updateOrAddUser(testAdmin);
  updateOrAddUser(testTeam);
  updateOrAddUser(testClient);

  await conn.execute("REPLACE INTO app_data (module_key, data_json) VALUES ('users', ?)", [JSON.stringify(usersData)]);
  console.log('App Data Users updated');

  // Also update users table in MySQL
  for (const u of [testAdmin, testTeam, testClient]) {
    try {
      await conn.execute(`
        UPDATE users SET
          full_name = ?,
          password = ?,
          role_id = ?,
          company_id = ?,
          company_ids = ?,
          branch_id = ?,
          is_active = 1
        WHERE email = ?
      `, [
        u.name,
        u.password,
        u.role === "Admin" ? 2 : u.role === "Clients" ? 4 : 3,
        u.companyId === "tech" ? 1 : 2,
        JSON.stringify(u.companyIds),
        1,
        u.email
      ]);
    } catch (err) {
      console.warn('Update users table notice:', err.message);
    }
  }

  // 3. CREATE / VERIFY AN INVOICE ASSIGNED TO THIS BRANCH
  const [invRows] = await conn.execute("SELECT data_json FROM app_data WHERE module_key = 'invoices'");
  let invoicesData = [];
  if (invRows.length > 0) {
    try { invoicesData = JSON.parse(invRows[0].data_json); } catch {}
  }

  const branchInvoice = {
    id: "INV-2026-HO01",
    client: "Acme Corp (Client)",
    clientEmail: "client@saampark.in",
    project: "Cloud ERP & Enterprise AI Integration",
    billDate: "12-09-2026",
    dueDate: "26-09-2026",
    baseAmount: 150000,
    gstRate: 18,
    gstAmount: 27000,
    totalInvoiced: "₹1,77,000",
    paymentReceived: "₹0",
    due: "₹1,77,000",
    status: "Not paid",
    billedBy: "Anirban Chatterjee (Branch Director)",
    companyId: "tech",
    companyName: "SAAMPARK Technology",
    branchId: "1",
    branchName: "Head Office - Mumbai & Kolkata Technology Center",
    branchCode: "HO-MUM-01",
    items: [
      {
        id: "item_1",
        serviceName: "Enterprise Cloud ERP Platform & Multi-Branch Setup",
        rate: 100000,
        qty: 1,
        unit: "System",
        charges: [],
        gstRate: 18,
        gstAmount: 18000,
        totalAmount: 118000
      },
      {
        id: "item_2",
        serviceName: "Real-time AI Pipeline & Predictive Data Sync",
        rate: 50000,
        qty: 1,
        unit: "Module",
        charges: [],
        gstRate: 18,
        gstAmount: 9000,
        totalAmount: 59000
      }
    ]
  };

  const invIdx = invoicesData.findIndex(i => i.id === branchInvoice.id);
  if (invIdx >= 0) {
    invoicesData[invIdx] = branchInvoice;
  } else {
    invoicesData.unshift(branchInvoice);
  }
  await conn.execute("REPLACE INTO app_data (module_key, data_json) VALUES ('invoices', ?)", [JSON.stringify(invoicesData)]);
  await conn.execute("REPLACE INTO app_data (module_key, data_json) VALUES ('invoices_tech', ?)", [JSON.stringify([branchInvoice])]);
  console.log('Branch Invoice INV-2026-HO01 created and saved');

  await conn.end();
  console.log('Seed completed successfully!');
}

seed().catch(console.error);

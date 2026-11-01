const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const app = require('./src/app');
const pool = require('./src/config/db');

const PORT = parseInt(process.env.PORT || '5000', 10);

// Keep event loop alive permanently in PM2 to prevent exit on socket collisions
setInterval(() => {}, 60000);

let server;

function startHttpServer(portToUse) {
  try {
    server = app.listen(portToUse, '0.0.0.0', () => {
      console.log(`🚀 CRM Backend Server running on port ${portToUse}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`⚠️ Port ${portToUse} in use. Retrying binding in 3 seconds...`);
        setTimeout(() => {
          try { server.close(); } catch {}
          startHttpServer(portToUse);
        }, 3000);
      } else {
        console.error('Server socket error:', err.message);
      }
    });
  } catch (err) {
    console.error('Failed to bind server socket:', err.message);
  }
}

startHttpServer(PORT);

// Asynchronously verify DB Connection & Auto-Migrate missing columns for companies, branches & sub-branches
async function checkDbConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Successfully connected to MySQL Database!');

    // Helper to safely add column if missing
    const safeAddColumn = async (table, columnDef) => {
      try {
        await connection.execute(`ALTER TABLE ${table} ADD COLUMN ${columnDef}`);
      } catch (err) {
        // Ignore duplicate column name errors (ER_DUP_FIELDNAME / 1060)
      }
    };

    // Ensure app_data table exists
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS app_data (
          module_key VARCHAR(100) PRIMARY KEY,
          data_json LONGTEXT NOT NULL,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch {}

    // Ensure sub_branches table exists
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS sub_branches (
          id INT AUTO_INCREMENT PRIMARY KEY,
          branch_id VARCHAR(100) NOT NULL,
          company_id VARCHAR(100) NOT NULL,
          name VARCHAR(150) NOT NULL,
          code VARCHAR(50) NULL,
          address TEXT NULL,
          city VARCHAR(100) NULL,
          state VARCHAR(100) NULL,
          phone VARCHAR(50) NULL,
          email VARCHAR(255) NULL,
          manager_id INT NULL,
          is_active TINYINT(1) DEFAULT 1,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch {}

    // 1. Users table additions
    await safeAddColumn('users', 'username VARCHAR(100) NULL AFTER email');
    await safeAddColumn('users', 'avatar_url TEXT NULL');
    await safeAddColumn('users', 'sub_branch_id VARCHAR(100) NULL');
    await safeAddColumn('users', 'sub_branch_ids TEXT NULL');
    await safeAddColumn('users', 'company_ids TEXT NULL');
    await safeAddColumn('users', 'branch_ids TEXT NULL');

    // 2. Companies table additions for complete details persistence
    const companyCols = [
      'brand_name VARCHAR(100) NULL',
      'division_name VARCHAR(100) NULL',
      'subtitle VARCHAR(255) NULL',
      'trademark_symbol VARCHAR(10) NULL',
      'iso_certification VARCHAR(150) NULL',
      'msme_reg VARCHAR(50) NULL',
      'signatory_name VARCHAR(100) NULL',
      'signatory_designation VARCHAR(100) NULL',
      'signature_image_url LONGTEXT NULL',
      'stamp_image_url LONGTEXT NULL',
      'payment_qr_url LONGTEXT NULL',
      'gst_bank_name VARCHAR(150) NULL',
      'gst_account_holder VARCHAR(150) NULL',
      'gst_account_number VARCHAR(100) NULL',
      'gst_ifsc_code VARCHAR(50) NULL',
      'gst_bank_branch VARCHAR(100) NULL',
      'gst_upi_id VARCHAR(100) NULL',
      'gst_payment_qr_url LONGTEXT NULL',
      'nongst_bank_name VARCHAR(150) NULL',
      'nongst_account_holder VARCHAR(150) NULL',
      'nongst_account_number VARCHAR(100) NULL',
      'nongst_ifsc_code VARCHAR(50) NULL',
      'nongst_bank_branch VARCHAR(100) NULL',
      'nongst_upi_id VARCHAR(100) NULL',
      'nongst_payment_qr_url LONGTEXT NULL',
      'terms_conditions TEXT NULL',
      'invoice_notes TEXT NULL',
      'quotation_notes TEXT NULL',
      'signature_position JSON NULL',
      'stamp_position JSON NULL',
      'logo_position JSON NULL',
      'logo_scale DECIMAL(4,2) NULL',
      'stamp_scale DECIMAL(4,2) NULL',
      'signature_scale DECIMAL(4,2) NULL',
      'custom_stamps JSON NULL',
      'zoom INT NULL',
      'preview_scale VARCHAR(50) NULL',
      'preview_invoice_type VARCHAR(50) NULL',
      'invoice_customization JSON NULL',
      'smtp_host VARCHAR(150) NULL',
      'smtp_port VARCHAR(20) NULL',
      'smtp_user VARCHAR(150) NULL',
      'smtp_pass VARCHAR(255) NULL',
      'smtp_from_name VARCHAR(150) NULL',
      'smtp_from_email VARCHAR(150) NULL',
      'smtp_secure TINYINT(1) NULL'
    ];
    for (const col of companyCols) {
      await safeAddColumn('companies', col);
    }

    // 3. Branches table additions
    const branchCols = [
      'brand_name VARCHAR(100) NULL',
      'division_name VARCHAR(100) NULL',
      'subtitle VARCHAR(255) NULL',
      'logo_url TEXT NULL',
      'signatory_name VARCHAR(100) NULL',
      'signatory_designation VARCHAR(100) NULL',
      'signature_image_url LONGTEXT NULL',
      'stamp_image_url LONGTEXT NULL',
      'gstin VARCHAR(50) NULL',
      'pan VARCHAR(50) NULL',
      'cin VARCHAR(50) NULL',
      'msme_reg VARCHAR(50) NULL',
      'website VARCHAR(150) NULL',
      'upi_id VARCHAR(100) NULL',
      'account_holder VARCHAR(150) NULL',
      'bank_name VARCHAR(150) NULL',
      'account_number VARCHAR(100) NULL',
      'ifsc_code VARCHAR(50) NULL',
      'bank_branch VARCHAR(100) NULL',
      'payment_qr_url LONGTEXT NULL',
      'gst_bank_name VARCHAR(150) NULL',
      'gst_account_holder VARCHAR(150) NULL',
      'gst_account_number VARCHAR(100) NULL',
      'gst_ifsc_code VARCHAR(50) NULL',
      'gst_bank_branch VARCHAR(100) NULL',
      'gst_upi_id VARCHAR(100) NULL',
      'gst_payment_qr_url LONGTEXT NULL',
      'nongst_bank_name VARCHAR(150) NULL',
      'nongst_account_holder VARCHAR(150) NULL',
      'nongst_account_number VARCHAR(100) NULL',
      'nongst_ifsc_code VARCHAR(50) NULL',
      'nongst_bank_branch VARCHAR(100) NULL',
      'nongst_upi_id VARCHAR(100) NULL',
      'nongst_payment_qr_url LONGTEXT NULL',
      'terms_conditions TEXT NULL',
      'invoice_notes TEXT NULL',
      'quotation_notes TEXT NULL',
      'signature_position JSON NULL',
      'stamp_position JSON NULL',
      'logo_position JSON NULL',
      'logo_scale DECIMAL(4,2) NULL',
      'stamp_scale DECIMAL(4,2) NULL',
      'signature_scale DECIMAL(4,2) NULL',
      'custom_stamps JSON NULL',
      'preview_invoice_type VARCHAR(50) NULL'
    ];
    for (const col of branchCols) {
      await safeAddColumn('branches', col);
    }

    // 4. Sub-branches table additions
    const subBranchCols = [
      'parentBranchId VARCHAR(100) NULL',
      'partnerName VARCHAR(150) NULL',
      'partnerPhone VARCHAR(50) NULL',
      'partnerEmail VARCHAR(150) NULL',
      'partnerType VARCHAR(100) NULL',
      'revenueSharePct DECIMAL(5,2) DEFAULT 30.00',
      'brand_name VARCHAR(100) NULL',
      'division_name VARCHAR(100) NULL',
      'subtitle VARCHAR(255) NULL',
      'logo_url TEXT NULL',
      'signatory_name VARCHAR(100) NULL',
      'signatory_designation VARCHAR(100) NULL',
      'signature_image_url LONGTEXT NULL',
      'stamp_image_url LONGTEXT NULL',
      'gstin VARCHAR(50) NULL',
      'pan VARCHAR(50) NULL',
      'cin VARCHAR(50) NULL',
      'msme_reg VARCHAR(50) NULL',
      'website VARCHAR(150) NULL',
      'upi_id VARCHAR(100) NULL',
      'account_holder VARCHAR(150) NULL',
      'bank_name VARCHAR(150) NULL',
      'account_number VARCHAR(100) NULL',
      'ifsc_code VARCHAR(50) NULL',
      'bank_branch VARCHAR(100) NULL',
      'payment_qr_url LONGTEXT NULL',
      'gst_bank_name VARCHAR(150) NULL',
      'gst_account_holder VARCHAR(150) NULL',
      'gst_account_number VARCHAR(100) NULL',
      'gst_ifsc_code VARCHAR(50) NULL',
      'gst_bank_branch VARCHAR(100) NULL',
      'gst_upi_id VARCHAR(100) NULL',
      'gst_payment_qr_url LONGTEXT NULL',
      'nongst_bank_name VARCHAR(150) NULL',
      'nongst_account_holder VARCHAR(150) NULL',
      'nongst_account_number VARCHAR(100) NULL',
      'nongst_ifsc_code VARCHAR(50) NULL',
      'nongst_bank_branch VARCHAR(100) NULL',
      'nongst_upi_id VARCHAR(100) NULL',
      'nongst_payment_qr_url LONGTEXT NULL',
      'terms_conditions TEXT NULL',
      'invoice_notes TEXT NULL',
      'quotation_notes TEXT NULL'
    ];
    for (const col of subBranchCols) {
      await safeAddColumn('sub_branches', col);
    }

    console.log('✅ CRM Database schema verified and synchronized.');
    connection.release();
  } catch (error) {
    console.error('⚠️ MySQL Connection warning (will retry on request):', error.message);
  }
}

checkDbConnection();

// Prevent process exit on unhandled errors
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});
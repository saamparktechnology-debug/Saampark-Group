-- =========================================================
-- SAAMPARK CRM - Database 1: SAAMPARK TECHNOLOGY
-- Database Name: saampark_technology (or crm_db)
-- =========================================================
CREATE DATABASE IF NOT EXISTS `saampark_technology` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `saampark_technology`;


CREATE TABLE IF NOT EXISTS roles (
  id INT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(255) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS companies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  brand_name VARCHAR(100) NULL,
  division_name VARCHAR(100) NULL,
  subtitle VARCHAR(255) NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  currency_symbol VARCHAR(5) DEFAULT '₹',
  logo_url TEXT NULL,
  address TEXT NULL,
  phone VARCHAR(100) NULL,
  email VARCHAR(150) NULL,
  website VARCHAR(150) NULL,
  gstin VARCHAR(50) NULL,
  pan VARCHAR(50) NULL,
  cin VARCHAR(50) NULL,
  upi_id VARCHAR(100) NULL,
  account_holder VARCHAR(150) NULL,
  bank_name VARCHAR(150) NULL,
  account_number VARCHAR(100) NULL,
  ifsc_code VARCHAR(50) NULL,
  bank_branch VARCHAR(100) NULL,
  terms_conditions TEXT NULL,
  signatory_name VARCHAR(100) NULL,
  signatory_designation VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS branches (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(100) NOT NULL,
  name VARCHAR(150) NOT NULL,
  code VARCHAR(50) NULL,
  city VARCHAR(100) NULL,
  state VARCHAR(100) NULL,
  address TEXT NULL,
  phone VARCHAR(100) NULL,
  email VARCHAR(150) NULL,
  status VARCHAR(20) DEFAULT 'Active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(191) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'Teams',
  company_id VARCHAR(100) NULL,
  company_ids TEXT NULL,
  branch_id VARCHAR(100) NULL,
  branch_ids TEXT NULL,
  department VARCHAR(100) NULL,
  phone VARCHAR(50) NULL,
  avatar_url TEXT NULL,
  status VARCHAR(20) DEFAULT 'Active',
  kyc_status VARCHAR(20) DEFAULT 'Pending',
  permissions JSON NULL,
  allowed_modules JSON NULL,
  is_verified TINYINT(1) DEFAULT 1,
  last_login DATETIME NULL,
  joined_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_data (
  module_key VARCHAR(100) PRIMARY KEY,
  data_json LONGTEXT NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS deleted_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  item_id VARCHAR(191) NOT NULL,
  module_name VARCHAR(100) NOT NULL DEFAULT 'global',
  deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_item_mod (item_id, module_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) NOT NULL DEFAULT 'tech',
  branch_id VARCHAR(100) NULL,
  name VARCHAR(200) NOT NULL,
  primary_contact VARCHAR(150) NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(50) NULL,
  value DECIMAL(12,2) DEFAULT 0.00,
  status VARCHAR(50) DEFAULT 'New',
  assigned_to VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS clients (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) NOT NULL DEFAULT 'tech',
  branch_id VARCHAR(100) NULL,
  name VARCHAR(200) NOT NULL,
  primary_contact VARCHAR(150) NULL,
  email VARCHAR(191) NULL,
  phone VARCHAR(50) NULL,
  address TEXT NULL,
  status VARCHAR(20) DEFAULT 'Active',
  total_revenue DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) NOT NULL DEFAULT 'tech',
  branch_id VARCHAR(100) NULL,
  client_id VARCHAR(100) NULL,
  name VARCHAR(200) NOT NULL,
  status VARCHAR(50) DEFAULT 'In Progress',
  budget DECIMAL(12,2) DEFAULT 0.00,
  start_date DATE NULL,
  due_date DATE NULL,
  assigned_team JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tasks (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) NOT NULL DEFAULT 'tech',
  project_id VARCHAR(100) NULL,
  title VARCHAR(255) NOT NULL,
  priority VARCHAR(20) DEFAULT 'Medium',
  status VARCHAR(50) DEFAULT 'To Do',
  assigned_to VARCHAR(100) NULL,
  due_date DATE NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS tickets (
  id VARCHAR(100) PRIMARY KEY,
  company_id VARCHAR(100) NOT NULL DEFAULT 'tech',
  client_id VARCHAR(100) NULL,
  subject VARCHAR(255) NOT NULL,
  priority VARCHAR(20) DEFAULT 'Normal',
  status VARCHAR(50) DEFAULT 'Open',
  assigned_to VARCHAR(100) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS ticket_replies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ticket_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100) NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  company_id VARCHAR(100) NULL,
  user_id VARCHAR(100) NULL,
  user_name VARCHAR(150) NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



INSERT INTO roles (id, name, description) VALUES
  (1, 'Super Admin', 'Full unrestricted master access across all companies and modules'),
  (2, 'Admin', 'Administrative access for assigned company and team management'),
  (3, 'Teams', 'Operational team member access'),
  (4, 'Clients', 'Client portal access')
ON DUPLICATE KEY UPDATE name=VALUES(name), description=VALUES(description);



INSERT INTO companies (id, name, slug, brand_name, division_name, subtitle, currency, currency_symbol, logo_url, address, phone, email, website)
VALUES (1, 'SAAMPARK TECHNOLOGY', 'tech', 'SAAMPARK', 'TECHNOLOGY', 'AND RESEARCH PRIVATE LIMITED', 'INR', '₹', '/saampark-logo.png', 'Madinipur, Kolkata, West Bengal - 721101', '+91 9901518567', 'info@saamparktechnology.com', 'www.saamparktechnology.com')
ON DUPLICATE KEY UPDATE name=VALUES(name), slug=VALUES(slug), brand_name=VALUES(brand_name);

INSERT INTO users (id, name, email, password, role, company_id, company_ids, department, status, is_verified)
VALUES ('usr_super_admin', 'Supriya (Super Admin)', 'hiisupriya@gmail.com', '$2b$10$YourHashedPassOr123456', 'Super Admin', 'tech', '["tech", "consultancy"]', 'Executive Management', 'Active', 1)
ON DUPLICATE KEY UPDATE name=VALUES(name), role=VALUES(role);
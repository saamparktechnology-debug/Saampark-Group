-- =====================================================================
-- Saampark Technology & Research Pvt. Ltd. (STR Group)
-- Comprehensive Enterprise Database Schema (MySQL 5.7+ / 8.0+)
-- Database: saampark_db
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `saampark_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `saampark_db`;

-- Drop existing tables in reverse order of foreign keys
DROP TABLE IF EXISTS `order_addons`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `addons`;
DROP TABLE IF EXISTS `service_variants`;
DROP TABLE IF EXISTS `demo_projects`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `admin_settings`;

-- ---------------------------------------------------------------------
-- 1. USERS & CLIENT ACCOUNTS
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `email` VARCHAR(180) NOT NULL UNIQUE,
  `phone` VARCHAR(25) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('admin', 'client') DEFAULT 'client',
  `company_name` VARCHAR(200) DEFAULT NULL,
  `address` TEXT DEFAULT NULL,
  `gst_number` VARCHAR(30) DEFAULT NULL,
  `status` ENUM('active', 'suspended', 'pending') DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. SERVICE VARIANTS (36+ Sub-variants + 9 Digital Marketing Packages)
-- ---------------------------------------------------------------------
CREATE TABLE `service_variants` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `category` ENUM('web_development', 'mobile_app', 'cloud_hosting', 'digital_marketing') NOT NULL,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL UNIQUE,
  `badge` VARCHAR(80) DEFAULT NULL,
  `price_inr` DECIMAL(12,2) NOT NULL,
  `billing_type` ENUM('one_time', 'monthly', 'quarterly', 'annual') DEFAULT 'one_time',
  `delivery_sla` VARCHAR(100) DEFAULT '15-25 Days',
  `short_description` TEXT NOT NULL,
  `features_json` JSON DEFAULT NULL,
  `tech_stack` VARCHAR(255) DEFAULT NULL,
  `is_featured` TINYINT(1) DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. SWIGGY-STYLE ADDONS
-- ---------------------------------------------------------------------
CREATE TABLE `addons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `code` VARCHAR(60) NOT NULL UNIQUE,
  `title` VARCHAR(200) NOT NULL,
  `description` VARCHAR(300) NOT NULL,
  `price_inr` DECIMAL(10,2) NOT NULL,
  `icon` VARCHAR(30) DEFAULT '⚡',
  `category_applicable` VARCHAR(100) DEFAULT 'all',
  `is_recommended` TINYINT(1) DEFAULT 0,
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. ORDERS & BOOKINGS
-- ---------------------------------------------------------------------
CREATE TABLE `orders` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_number` VARCHAR(50) NOT NULL UNIQUE,
  `user_id` INT DEFAULT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_email` VARCHAR(180) NOT NULL,
  `customer_phone` VARCHAR(25) NOT NULL,
  `company_name` VARCHAR(200) DEFAULT NULL,
  `category` VARCHAR(60) NOT NULL,
  `service_title` VARCHAR(200) NOT NULL,
  `variant_title` VARCHAR(200) NOT NULL,
  `plan_duration` VARCHAR(50) DEFAULT '1 Month / Standard',
  `base_price` DECIMAL(12,2) NOT NULL,
  `addons_total` DECIMAL(12,2) DEFAULT 0.00,
  `discount_amount` DECIMAL(12,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(12,2) DEFAULT 0.00,
  `grand_total` DECIMAL(12,2) NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'Direct Bank / UPI / Cash',
  `payment_status` ENUM('unpaid', 'paid', 'partially_paid', 'refunded') DEFAULT 'unpaid',
  `order_status` ENUM('pending', 'reviewing', 'in_progress', 'qa_staging', 'completed', 'cancelled') DEFAULT 'pending',
  `customer_notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. ORDER ADDONS MAPPING
-- ---------------------------------------------------------------------
CREATE TABLE `order_addons` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `order_id` INT NOT NULL,
  `addon_code` VARCHAR(60) NOT NULL,
  `addon_title` VARCHAR(200) NOT NULL,
  `addon_price` DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. DEMO PROJECTS REGISTRY
-- ---------------------------------------------------------------------
CREATE TABLE `demo_projects` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(200) NOT NULL,
  `slug` VARCHAR(220) NOT NULL UNIQUE,
  `category` VARCHAR(100) NOT NULL,
  `demo_url` VARCHAR(255) NOT NULL,
  `demo_email` VARCHAR(150) DEFAULT NULL,
  `demo_password` VARCHAR(150) DEFAULT NULL,
  `description` TEXT NOT NULL,
  `tech_stack` VARCHAR(255) NOT NULL,
  `badge` VARCHAR(80) DEFAULT 'Live Prototype',
  `metrics` VARCHAR(150) DEFAULT NULL,
  `sort_order` INT DEFAULT 0,
  `is_active` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. ADMIN SETTINGS
-- ---------------------------------------------------------------------
CREATE TABLE `admin_settings` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `setting_key` VARCHAR(100) NOT NULL UNIQUE,
  `setting_value` TEXT NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SEED DATA
-- =====================================================================

-- Default Users (Password for admin: admin123, for client: client123)
INSERT INTO `users` (`id`, `name`, `email`, `phone`, `password_hash`, `role`, `company_name`, `status`) VALUES
(1, 'Saampark Master Admin', 'admin@saampark.com', '+91 9046232424', 'admin123', 'admin', 'Saampark Technology & Research Pvt. Ltd.', 'active'),
(2, 'Verified Enterprise Client', 'client@saampark.com', '+91 9091518567', 'client123', 'client', 'Apex Global Retail', 'active');

-- ---------------------------------------------------------------------
-- SEED SWIGGY-STYLE ADDONS
-- ---------------------------------------------------------------------
INSERT INTO `addons` (`code`, `title`, `description`, `price_inr`, `icon`, `is_recommended`, `sort_order`) VALUES
('express_7day', '⚡ Express 7-Day Sprint Delivery', 'Priority 24/7 dedicated engineering pod to deliver within 7 calendar days', 4999.00, '⚡', 1, 1),
('amc_1year', '🛡️ 1-Year Extended 24/7 SLA & AMC', 'Uncapped bug fixes, server patches, continuous security monitoring & backups', 12499.00, '🛡️', 1, 2),
('cyber_waf', '🔒 Enterprise SSL & Cloudflare WAF Hardening', 'Zero-trust DDoS protection, rate limiting, and ISO 27001 web compliance', 6999.00, '🔒', 0, 3),
('ga4_pixel', '📈 GA4, Meta Pixel & Conversion API Suite', 'Advanced e-commerce data layer tracking, server-side attribution & dashboards', 3499.00, '📈', 1, 4),
('wa_ai_bot', '🤖 Custom WhatsApp AI Lead Responder', '24/7 autonomous chatbot trained on your product catalog for instant sales close', 8999.00, '🤖', 1, 5),
('turbo_cwv', '🚀 Core Web Vitals 99+ Turbo Boost', 'Sub-400ms TTFB edge caching, image WebP pipeline & critical CSS inlining', 4499.00, '🚀', 0, 6),
('store_deploy', '📱 Play Store & iOS App Store Publish Assistance', 'Complete certificate signing, metadata SEO review & store approval guarantee', 5999.00, '📱', 0, 7),
('brand_3d_kit', '🎨 3D Holographic Brand Kit & Social Pack', 'Extruded 3D vector logo, brand guidelines PDF & 20 editable social templates', 7999.00, '🎨', 0, 8),
('email_blast', '📧 10,000 High-Deliverability Business Email Blast', 'Dedicated IP warm-up, anti-spam validation, SPF/DKIM verification & analytics', 2999.00, '📧', 0, 9),
('wa_credits', '💬 5,000 Verified WhatsApp Campaign Credits', 'Green-tick eligible verified API broadcast with clickable CTAs and buttons', 3999.00, '💬', 1, 10);

-- ---------------------------------------------------------------------
-- SEED 12+ SUBVARIANTS: WEBSITE DEVELOPMENT
-- ---------------------------------------------------------------------
INSERT INTO `service_variants` (`category`, `title`, `slug`, `badge`, `price_inr`, `billing_type`, `delivery_sla`, `short_description`, `features_json`, `tech_stack`, `is_featured`) VALUES
('web_development', 'High-Performance Corporate Web Portal', 'web-corporate-portal', 'Popular', 14999.00, 'one_time', '10-15 Days', 'Ultra-fast enterprise business portal with CMS, lead capture and ISO branding.', '["Full Responsive Layout", "Custom CMS Dashboard", "SEO & OpenGraph Setup", "Lead Automation Form", "SSL & Domain Config"]', 'Next.js 14, Tailwind, Node.js', 1),
('web_development', 'Headless E-Commerce Multi-Vendor Storefront', 'web-headless-ecommerce', 'High Conversion', 24999.00, 'one_time', '15-20 Days', 'Next-gen online shop with Razorpay/Stripe, inventory sync and Swiggy-style cart.', '["Swiggy-style Cart & Addons", "Razorpay / Stripe / COD", "Inventory Tracking", "Admin Order Manager", "Abandoned Cart Engine"]', 'React 19, Node.js, MySQL', 1),
('web_development', '3D WebGL Three.js Cinematic Interactive Experience', 'web-3d-webgl-cinematic', 'Cyber 3D', 34999.00, 'one_time', '18-25 Days', 'Award-winning 3D spatial canvas with 60FPS fluid physics and shader lighting.', '["Interactive 3D Canvas", "GLSL Custom Shaders", "Scroll-Driven Parallax", "Audio Reactive Engine", "Mobile GPU Optimization"]', 'Three.js, GLSL, GSAP, WebGL', 1),
('web_development', 'SaaS Multi-Tenant Web App & Client Portal', 'web-saas-multi-tenant', 'Enterprise Tier', 44999.00, 'one_time', '20-30 Days', 'Scalable software-as-a-service architecture with workspace RBAC & subscription billing.', '["Multi-Tenant Isolation", "Role-Based Access (RBAC)", "Subscription Engine", "Client Activity Logs", "Rest API Webhooks"]', 'Next.js, PostgreSQL/MySQL, Docker', 1),
('web_development', 'Progressive Web App (PWA) Offline-First Suite', 'web-pwa-offline-suite', 'Zero Downtime', 19999.00, 'one_time', '12-18 Days', 'Installable desktop and mobile web app with offline database caching & push alerts.', '["Service Worker Cache", "Home Screen Installable", "Web Push Notifications", "Background Data Sync", "Lighthouse 100/100"]', 'PWA Core, Workbox, IndexedDB', 0),
('web_development', 'High-Converting Sales Funnel & Landing Page Engine', 'web-sales-funnel-landing', 'ROI Booster', 9999.00, 'one_time', '5-7 Days', 'Targeted marketing landing page optimized for PPC Google Ads and instant conversions.', '["A/B Testing Ready", "Instant WhatsApp Direct", "Sticky Conversion Bar", "Heatmap Integration", "Sub-1s Page Load"]', 'HTML5, Tailwind, Alpine.js', 0),
('web_development', 'Custom Enterprise CMS & Multi-Language Newsroom', 'web-enterprise-cms-news', 'Editorial Grade', 29999.00, 'one_time', '15-22 Days', 'High-volume digital publishing system with multi-author workflows and multilingual SEO.', '["Multi-Language i18n", "Rich Media Asset Vault", "Role Permissions", "Automated RSS/Sitemap", "Fast Full-Text Search"]', 'Node.js, Strapi / Directus, MySQL', 0),
('web_development', 'FinTech Real-Time Trading & Crypto Web Dashboard', 'web-fintech-trading-dashboard', 'Real-Time WS', 54999.00, 'one_time', '25-35 Days', 'Ultra-low latency dashboard with live WebSockets, candlestick charts & portfolio analytics.', '["WebSocket Live Data", "Interactive Financial Charts", "Bank-Grade Encryption", "Audit Trail Vault", "KYC Document Uploader"]', 'React, WebSocket, Python, MySQL', 0),
('web_development', 'Real Estate Listing & Appointment Booking Marketplace', 'web-real-estate-marketplace', 'Geo-Targeted', 32999.00, 'one_time', '18-24 Days', 'Dynamic property search, map polygon filters, 360 virtual tours and instant viewing scheduler.', '["Interactive Leaflet/Google Maps", "Schedule Site Visits", "Agent Lead Routing", "Mortgage EMI Calculator", "Property Comparison"]', 'Next.js, Leaflet, Node.js', 0),
('web_development', 'Educational LMS & Student Video Course Portal', 'web-edtech-lms-portal', 'EdTech Suite', 38999.00, 'one_time', '20-28 Days', 'Full course learning platform with DRM video protection, quizzes, certificates & batch billing.', '["DRM Protected Streaming", "Quiz & Exam Engine", "Automated PDF Certificates", "Live Class Zoom API", "Student Progress Tracker"]', 'React, AWS S3/CloudFront, MySQL', 0),
('web_development', 'Web3 / dApp Interface & Wallet Gateway', 'web-web3-dapp-gateway', 'Web3 Ready', 49999.00, 'one_time', '20-30 Days', 'Decentralized application frontend with MetaMask/Phantom login & smart contract hooks.', '["Wagmi / RainbowKit Wallet", "Smart Contract ABIs", "IPFS Metadata Hosting", "Multi-Chain Switcher", "Transaction Toast Alerts"]', 'React, Ethers.js, Wagmi, Solidity', 0),
('web_development', 'Micro-Frontend Enterprise Monorepo Modernization', 'web-micro-frontend-enterprise', 'Scale Ready', 64999.00, 'one_time', '30-45 Days', 'Decoupled module federation architecture for large engineering teams and high concurrency.', '["Webpack Module Federation", "Independent Deployments", "Shared Component Library", "Dockerized Pods", "Global State Bridge"]', 'Nx Monorepo, React, TypeScript', 0);

-- ---------------------------------------------------------------------
-- SEED 12+ SUBVARIANTS: IOS & ANDROID APPS
-- ---------------------------------------------------------------------
INSERT INTO `service_variants` (`category`, `title`, `slug`, `badge`, `price_inr`, `billing_type`, `delivery_sla`, `short_description`, `features_json`, `tech_stack`, `is_featured`) VALUES
('mobile_app', 'Flutter Cross-Platform Universal App (iOS + Android)', 'app-flutter-cross-platform', 'Most Popular', 34999.00, 'one_time', '20-30 Days', 'One clean unified codebase delivering 60FPS fluid UI on both Apple App Store & Google Play.', '["Single Codebase Dual Deploy", "Native Performance Engine", "Firebase Push Alerts", "Offline SQLite Storage", "App Store Guidelines Ready"]', 'Flutter, Dart, Firebase, Node.js', 1),
('mobile_app', 'Native Swift / SwiftUI iOS Flagship App', 'app-native-swiftui-ios', 'Apple Prestige', 44999.00, 'one_time', '22-30 Days', 'Precision-crafted iOS application with Dynamic Island, Apple Pay, FaceID and WidgetKit.', '["Swift 6 & SwiftUI Core", "Dynamic Island & Live Activities", "Apple Pay & Biometrics", "CoreData / SwiftData Sync", "Strict Apple Review Prep"]', 'Swift 6, SwiftUI, Xcode, Combine', 1),
('mobile_app', 'Native Kotlin / Jetpack Compose Android Enterprise App', 'app-native-kotlin-android', 'Android Core', 39999.00, 'one_time', '20-28 Days', 'High-performance Android app with Material You design, WorkManager and Google Play Billing.', '["Kotlin Coroutines & Flow", "Jetpack Compose Declarative UI", "Background Sync WorkManager", "Google Pay & UPI Deep Links", "Google Play Store Submission"]', 'Kotlin, Jetpack Compose, Retrofit', 1),
('mobile_app', 'On-Demand Hyperlocal Delivery & Rider App (Swiggy Model)', 'app-swiggy-delivery-model', 'Turnkey Solution', 59999.00, 'one_time', '28-38 Days', 'Three-tier ecosystem: Customer Ordering App, Merchant Partner Portal, and Live Rider GPS App.', '["Real-Time GPS Order Tracking", "Live Delivery Partner Dispatch", "Swiggy-Style Addons & Cart", "In-App OTP Verification", "Automated Split Billing"]', 'Flutter, Node.js, WebSockets, Redis', 1),
('mobile_app', 'FinTech Neo-Banking & UPI Mobile Wallet App', 'app-fintech-upi-wallet', 'Bank Grade', 69999.00, 'one_time', '30-45 Days', 'Secure financial wallet with dynamic QR code scanning, instant peer transfers and biometric auth.', '["NPCI / UPI Deep Linking", "Dynamic QR Code Scanner", "Biometric TouchID/FaceID", "Encrypted Key Vault", "Automated Account Statement PDF"]', 'Kotlin / Swift, Encrypted DB, Node.js', 0),
('mobile_app', 'Social Networking, Audio/Video & Live Streaming App', 'app-social-live-streaming', 'High Engagement', 74999.00, 'one_time', '35-50 Days', 'Interactive social platform with short reels, live RTC broadcasting, chats and virtual gifts.', '["Agora / WebRTC Live Streaming", "Short Video Reels Feed", "End-to-End Chat Engine", "User Follows & Mentions", "In-App Coin Gifts & Wallet"]', 'Flutter, WebRTC, Agora SDK, MongoDB', 0),
('mobile_app', 'Telemedicine & HIPAA-Compliant Doctor Consultation App', 'app-telemedicine-medcare', 'Healthcare Verified', 52999.00, 'one_time', '25-35 Days', 'Patient doctor appointment portal with video calls, digital prescription vault and medicine orders.', '["Encrypted Video Consultations", "Doctor Slot Calendar", "E-Prescription Generator", "Digital Health Record Vault", "Medicine Reminder Alerts"]', 'React Native, WebRTC, Node.js', 0),
('mobile_app', 'AR-Enabled Mobile E-Commerce & Virtual Try-On App', 'app-ar-augmented-commerce', 'Next-Gen AR', 58999.00, 'one_time', '28-40 Days', 'Augmented reality mobile shopping allowing clients to preview 3D products in physical rooms.', '["ARKit & ARCore Integration", "3D Model Lighting Match", "Instant Size Measurement", "One-Tap Apple Pay / GPay", "Social AR Share Camera"]', 'Flutter, ARCore, ARKit, Unity WebGL', 0),
('mobile_app', 'AI On-Device Mobile Assistant with OCR & LLM', 'app-ai-ondevice-assistant', 'Neural Edge', 62999.00, 'one_time', '30-40 Days', 'Smart personal business companion running on-device OCR, document parsing and voice agent.', '["On-Device Whisper Voice", "Instant Document Scanner OCR", "OpenAI / Claude API Sync", "Smart Task Planner", "Multi-Language Audio Playback"]', 'Kotlin / Swift, MediaPipe, Python', 0),
('mobile_app', 'Fitness Tracker & Wearables HealthKit/Google Fit App', 'app-fitness-wearables-sync', 'Health & Fit', 42999.00, 'one_time', '22-32 Days', 'Comprehensive health suite syncing heart rate, daily steps, workout GPS routes and meal logs.', '["Apple HealthKit Integration", "Google Health Connect Sync", "GPS Running Route Tracker", "Personalized Workout Plans", "Gamified Streak Badges"]', 'Flutter, HealthKit, Google Fit API', 0),
('mobile_app', 'Fleet Logistics & Real-Time GPS Telematics Driver App', 'app-fleet-logistics-gps', 'Enterprise Ops', 48999.00, 'one_time', '25-35 Days', 'Driver dispatch interface with route optimization, fuel telematics, e-signatures and proof of delivery.', '["Turn-by-Turn GPS Navigation", "Proof-of-Delivery E-Signature", "Offline Manifest Storage", "Vehicle Telematics Alerts", "Manager Geofence Ping"]', 'Kotlin, Google Maps SDK, Node.js', 0),
('mobile_app', 'Smart IoT Home Automation & BLE Hardware Controller App', 'app-iot-smart-home-ble', 'Hardware Sync', 54999.00, 'one_time', '28-38 Days', 'Low-energy Bluetooth and MQTT controller app for hardware relays, ambient LEDs & smart sensors.', '["BLE 5.0 Device Auto-Discovery", "MQTT Real-Time Broker Sync", "Room Scene Automations", "Voice Control Siri / Google", "Firmware OTA Upgrader"]', 'Flutter, MQTT, Bluetooth LE API', 0);

-- ---------------------------------------------------------------------
-- SEED 12+ SUBVARIANTS: CLOUD & SERVER HOSTING
-- ---------------------------------------------------------------------
INSERT INTO `service_variants` (`category`, `title`, `slug`, `badge`, `price_inr`, `billing_type`, `delivery_sla`, `short_description`, `features_json`, `tech_stack`, `is_featured`) VALUES
('cloud_hosting', 'AWS / GCP Multi-Region Cloud Infrastructure Architecture', 'cloud-aws-gcp-multiregion', '99.99% Uptime', 18999.00, 'one_time', '7-12 Days', 'Enterprise cloud design across redundant data zones with Terraform Infrastructure-as-Code.', '["VPC & Subnet Isolation", "Multi-AZ Redundancy", "Terraform IAC Blueprints", "IAM Zero-Trust Privileges", "Billing Budget Guardrails"]', 'AWS / Google Cloud, Terraform', 1),
('cloud_hosting', 'Docker & Kubernetes (k8s) Microservices Cluster Orchestration', 'cloud-kubernetes-docker-k8s', 'Cloud Native', 28999.00, 'one_time', '12-18 Days', 'Containerized microservice architecture with auto-healing, ingress controllers and Helm charts.', '["Kubernetes Cluster Setup", "Docker Multi-Stage Builds", "Helm Chart Automation", "Ingress SSL Routing", "Horizontal Pod Autoscaler"]', 'Docker, Kubernetes, Helm, Nginx', 1),
('cloud_hosting', '24/7 Managed Server SysAdmin & L3 DevOps Monitoring', 'cloud-247-managed-sysadmin', 'Continuous SLA', 9999.00, 'monthly', 'Ongoing', 'Uninterrupted server monitoring, kernel patches, MySQL performance optimization & L3 tickets.', '["24/7 Live Health Pings", "Kernel Security Patches", "Database Query Tuning", "Disk & RAM Alerts", "15-Min Critical Response SLA"]', 'Prometheus, Grafana, Linux, Zabbix', 1),
('cloud_hosting', 'High-Availability Global Auto-Scaling & Load Balancer Engine', 'cloud-autoscale-load-balancer', 'Zero Bottleneck', 22999.00, 'one_time', '8-14 Days', 'Traffic management system routing millions of requests dynamically across healthy edge nodes.', '["Application Load Balancer (ALB)", "Dynamic Target Scaling", "Health Check Auto-Recovery", "Sticky Sessions & WAF", "SSL Offloading & HTTP/3"]', 'AWS ALB, Nginx Plus, Cloudflare', 1),
('cloud_hosting', 'Enterprise Database Replication, Automated Backups & Sharding', 'cloud-mysql-replication-backups', 'Zero Data Loss', 16999.00, 'one_time', '7-10 Days', 'MySQL master-slave read replicas, point-in-time recovery and automated encrypted off-site cloud backups.', '["Master-Slave DB Replication", "Point-In-Time Backup Vault", "Daily Automated S3 Sync", "Slow Query Index Audits", "One-Click Failover Script"]', 'MySQL 8, Percona, AWS S3, Bash', 0),
('cloud_hosting', 'Cyber Security Hardening, DDoS Mitigation & Cloudflare WAF', 'cloud-cyber-security-hardening', 'Bank Grade Shield', 14999.00, 'one_time', '5-8 Days', 'Lockdown your servers against OWASP Top 10 vulnerabilities, brute-force attacks and volumetric DDoS.', '["Cloudflare Enterprise WAF", "SSH Key Lockdown & Port Knock", "Fail2Ban & UFW Firewall", "SSL A+ Grade Security", "Malware & Exploit Scanner"]', 'Cloudflare, Fail2Ban, OpenSSL, Lynis', 0),
('cloud_hosting', 'CI/CD Automated Zero-Downtime Deployment Pipelines', 'cloud-cicd-github-actions', 'DevOps Suite', 12999.00, 'one_time', '5-9 Days', 'Automate code testing, staging previews, blue-green deployment and zero-downtime releases.', '["GitHub Actions / GitLab CI", "Blue-Green Deployment", "Automated Lint & Unit Tests", "Rollback on Error Hook", "Slack / Discord Webhook Pings"]', 'GitHub Actions, Docker, SSH, Webhooks', 0),
('cloud_hosting', 'Zero-Downtime Legacy Server to Cloud Migration', 'cloud-zero-downtime-migration', 'Seamless Cutover', 24999.00, 'one_time', '10-16 Days', 'Transfer old cPanel, dedicated boxes or VPS servers to modern cloud infrastructure with zero data loss.', '["Zero-Downtime DNS Cutover", "Database Live Data Sync", "File & SSL Migration", "Email Mailbox IMAP Transfer", "Post-Migration Verification"]', 'Rsync, MySQL Dump, Cloudflare DNS', 0),
('cloud_hosting', 'Disaster Recovery (DR) Multi-Zone Failover Hot Site', 'cloud-disaster-recovery-hot-site', 'Mission Critical', 32999.00, 'one_time', '14-20 Days', 'RTO < 5 minutes and RPO < 1 minute disaster recovery setup across independent geographic datacenters.', '["Multi-Region Hot Standby", "Automated DNS Failover", "Cross-Region S3 Replication", "DR Drill Execution Guide", "Compliance Audit Log"]', 'AWS Route53, RDS Global, Terraform', 0),
('cloud_hosting', 'FinOps Cloud Cost Reduction & Architecture Optimization', 'cloud-finops-cost-reduction', 'Save 30%-50%', 15999.00, 'one_time', '6-10 Days', 'Deep forensic audit of your AWS/GCP bills to eliminate idle resources and right-size reserved nodes.', '["Full Cloud Cost Audit", "Reserved & Spot Instance Plan", "Unattached Disk Cleaner", "Bandwidth CDN Optimization", "Guaranteed Cost Reduction Plan"]', 'AWS Cost Explorer, Infracost, CloudHealth', 0),
('cloud_hosting', 'Bare-Metal Dedicated Server Provisioning & Linux Kernel Tuning', 'cloud-bare-metal-dedicated-linux', 'Raw Power', 19999.00, 'one_time', '7-12 Days', 'High-spec dedicated hardware configuration with custom Linux kernel parameters and NVMe RAID-10.', '["Ubuntu / AlmaLinux OS Build", "Hardware RAID-10 Storage", "TCP / Sysctl Network Tuning", "Proxmox / KVM Virtualization", "Remote IPMI / iDRAC Setup"]', 'Ubuntu LTS, Proxmox, ZFS, RAID', 0),
('cloud_hosting', 'Serverless Edge Compute & Global CDN Acceleration Network', 'cloud-serverless-edge-cdn', 'Sub-50ms Global', 17999.00, 'one_time', '6-10 Days', 'Deploy serverless micro-functions at edge points of presence worldwide for lightning-quick execution.', '["Cloudflare Workers / Vercel Edge", "Global Anycast Routing", "Edge KV Key-Value Cache", "WebP Dynamic Image Resizing", "Edge Security Authentication"]', 'Cloudflare Workers, Fastly, Next.js', 0);

-- ---------------------------------------------------------------------
-- SEED 9 DIGITAL MARKETING PACKAGES (EXACTLY FROM USER'S FLYER)
-- ---------------------------------------------------------------------
INSERT INTO `service_variants` (`category`, `title`, `slug`, `badge`, `price_inr`, `billing_type`, `delivery_sla`, `short_description`, `features_json`, `tech_stack`, `is_featured`) VALUES
('digital_marketing', 'Starter Ignition (Package 01 - Start)', 'mkt-starter-ignition', 'Startups & Small Business', 1999.00, 'monthly', 'Monthly Retainer', 'Essential social presence and branding jumpstart for early stage businesses.', '["8 Premium Social Media Posts", "1 AI Reel", "8 Story Designs", "Festive Post", "Page Setup", "10K Views / Month (Estimate)", "Best for: Startups & Small Businesses"]', 'Meta Ads, AI Video, Canva Pro', 0),
('digital_marketing', 'Growth Catalyst (Package 02 - Grow)', 'mkt-growth-catalyst', 'Growing Businesses', 4999.00, 'monthly', 'Monthly Retainer', 'Accelerated outreach with active community management and targeted lead generation.', '["12 Premium Social Media Posts", "2 AI Reels", "12 Story Designs", "Festive Post", "Page Setup", "Facebook & Instagram Management", "Content Writing", "20K - 30K Views / Month (Estimate)", "8 - 10 Leads / Month (Expected)"]', 'Meta Suite, Copywriting, AI Video', 1),
('digital_marketing', 'Velocity Boost (Package 03 - Boost)', 'mkt-velocity-boost', 'Established Businesses', 7999.00, 'monthly', 'Monthly Retainer', 'High-frequency branding with dedicated promotional video production and hashtag science.', '["16 Premium Social Media Posts", "4 AI Reels", "1 AI / Normal Promotional Video (1 Min)", "16 Story Designs", "Facebook Cover Page", "Content Writing", "Page Setup", "Hashtag Research", "60K - 80K Views / Month", "15 - 18 Leads / Month"]', 'Premiere Pro, Meta Ads, CapCut AI', 1),
('digital_marketing', 'Business Pro (Package 04 - Business Pro)', 'mkt-business-pro', 'Small & Growing Biz', 9999.00, 'monthly', 'Monthly Retainer', 'Comprehensive multi-format content engine with 2 promotional commercials monthly.', '["20 Premium Social Media Posts", "6 AI Reels", "2 AI / Normal Promotional Videos", "20 Story Updates", "Festive Posts", "Page Setup", "Facebook Cover Page", "Content Writing", "Hashtag Research", "110K - 120K Views / Month", "30 - 35 Leads / Month"]', 'Cinema4D, After Effects, Meta Ads', 1),
('digital_marketing', 'Business Plus (Package 05 - Business Plus)', 'mkt-business-plus', 'Rapid Growth', 11999.00, 'monthly', 'Monthly Retainer', 'High-volume production with daily stories, 3 commercials and aggressive lead acquisition.', '["24 Premium Social Media Posts", "6 AI Reels", "3 Daily Story Updates", "3 AI / Normal Promotional Videos", "Festive Posts", "Page Setup", "Facebook Cover Page", "Content Writing", "Hashtag Research", "120K - 150K Views / Month", "35 - 40 Leads / Month"]', 'Meta Ads Manager, AI Scripting', 0),
('digital_marketing', 'Business Elite (Package 06 - Business Elite)', 'mkt-business-elite', 'Established Brands', 14999.00, 'monthly', 'Monthly Retainer', 'Full brand dominance with 30 premium posts, 8 AI reels and high-converting creative copies.', '["30 Premium Social Media Posts", "8 AI Reels", "3 Daily Story Updates", "3 AI / Normal Promotional Videos", "Festive Posts", "Page Setup", "Facebook Cover Page", "Content Writing", "Hashtag Research", "140K - 160K Views / Month", "45 - 55 Leads / Month"]', 'Creative Direction, Meta Ads, Video', 0),
('digital_marketing', 'Enterprise Scale (Package 07 - Enterprise)', 'mkt-enterprise-scale', 'Large Businesses', 19999.00, 'monthly', 'Monthly Retainer', 'High-tier corporate marketing machine with 10 AI reels, 4 video ads and heavy lead volume.', '["30 Premium Social Media Posts", "10 AI Reels", "Daily Story Updates", "4 AI / Normal Promotional Videos", "Festive Posts", "Page Setup", "Facebook Cover Page", "Content Writing", "Hashtag Research", "200K - 230K Views / Month", "60 - 70 Leads / Month"]', 'Corporate Production, Ads Scaling', 0),
('digital_marketing', 'Enterprise Apex (Package 08 - Enterprise Plus)', 'mkt-enterprise-apex', 'Multi-Brand Businesses', 25999.00, 'monthly', 'Monthly Retainer', 'Multi-brand omni-channel deployment delivering up to a quarter million views monthly.', '["35 Premium Social Media Posts", "12 AI Reels", "Daily Story Updates", "4 AI / Normal Promotional Videos", "Festive Posts", "Page Setup", "Facebook Cover Page", "Content Writing", "Hashtag Research", "230K - 250K Views / Month", "120 - 150 Leads / Month"]', 'Omni-Channel Ads, Multi-Brand Desk', 0),
('digital_marketing', 'Ultimate Growth Empire (Package 09 - Ultimate Growth)', 'mkt-ultimate-growth-empire', 'Maximum Market Share', 29999.00, 'monthly', 'Monthly Retainer', 'The apex digital dominance suite: 40 posts, 12 reels, 4 videos, VIP 24/7 priority support.', '["40 Premium Social Media Posts", "12 AI Reels", "Daily Story Updates", "4 AI / Normal Promotional Videos", "Festive Posts", "Page Setup", "Facebook Cover Page", "Content Writing", "Hashtag Research", "Priority Support 24/7", "300K+ Views / Month", "120 - 300 Leads / Month"]', 'Full Agency Pod, Dedicated CMO Desk', 1);

-- ---------------------------------------------------------------------
-- SEED DEMO PROJECTS (FOR DEMO PROJECTS SECTION)
-- ---------------------------------------------------------------------
INSERT INTO `demo_projects` (`title`, `slug`, `category`, `demo_url`, `demo_email`, `demo_password`, `description`, `tech_stack`, `badge`, `metrics`, `sort_order`) VALUES
('Jewellery Shop Retail ERP & Live Gold Billing', 'jewellery-shop-erp', 'Retail & ERP', 'https://demo-software-web-app-i-os.vercel.app/', 'admin@gmail.com', '123456', 'Complete enterprise jewelry billing, live gold/silver rate ticker, customer ledger, inventory barcoding, and GST invoicing.', 'React 19, Node.js, MongoDB, GST API', 'Live Demo Available', '₹1.4Cr+ Monthly Billing Handled', 1),
('Nexus 3D Multi-Tenant SaaS Workspace', 'nexus-3d-saas-portal', 'SaaS Portals', 'https://demo-software-web-app-i-os.vercel.app/', 'client@saampark.com', 'client123', 'Next-generation cloud management workspace with real-time analytics, user role controls, stripe billing engine and interactive WebGL canvas.', 'Next.js 14, WebGL, Tailwind, MySQL', 'Interactive Prototype', '0.38s Edge TTFB', 2),
('Swiggy-Style Hyperlocal Food & Grocery Hub', 'hyperlocal-swiggy-hub', 'Delivery & Apps', 'https://demo-software-web-app-i-os.vercel.app/', 'admin@saampark.com', 'admin123', 'High-concurrency ordering portal featuring real-time interactive cart addons, geolocation rider telematics and split invoicing.', 'Flutter, WebSockets, Redis, Node.js', 'Turnkey Solution', '45K+ Concurrent Users', 3),
('FinPulse Neo-Banking & Instant UPI Settlement', 'finpulse-neobank-terminal', 'FinTech & Wallets', 'https://demo-software-web-app-i-os.vercel.app/', 'client@saampark.com', 'client123', 'Bank-grade financial ledger with dynamic QR code generation, instant settlement engine and fraud detection audit trail.', 'React, TypeScript, WebSocket, MySQL', 'Bank Grade Security', '99.999% Reliability', 4),
('MedCare Telemedicine & Hospital Queue Engine', 'medcare-telemedicine-portal', 'Healthcare', 'https://demo-software-web-app-i-os.vercel.app/', 'admin@gmail.com', '123456', 'HIPAA-compliant patient booking portal with WebRTC video consultation, e-prescriptions and dynamic bed availability tracker.', 'React Native, WebRTC, Node.js, HIPAA', 'Healthcare Verified', '120+ Doctors Online', 5),
('Zenith 3D Virtual Real Estate Showroom', 'zenith-3d-spatial-showroom', '3D & Real Estate', 'https://demo-software-web-app-i-os.vercel.app/', 'client@saampark.com', 'client123', 'Spatial architectural exploration with real-time sun angle shadows, 360 floor plan walk-throughs and mortgage calculator.', 'Three.js, GLSL, WebGL, GSAP', 'Cyber 3D Motion', '60 FPS Ultra HD', 6);

-- ---------------------------------------------------------------------
-- SEED SAMPLE ORDERS
-- ---------------------------------------------------------------------
INSERT INTO `orders` (`order_number`, `user_id`, `customer_name`, `customer_email`, `customer_phone`, `company_name`, `category`, `service_title`, `variant_title`, `plan_duration`, `base_price`, `addons_total`, `discount_amount`, `tax_amount`, `grand_total`, `payment_method`, `payment_status`, `order_status`, `customer_notes`) VALUES
('STR-ORD-2026-1001', 2, 'Verified Enterprise Client', 'client@saampark.com', '+91 9091518567', 'Apex Global Retail', 'web_development', 'Web Development', 'Headless E-Commerce Multi-Vendor Storefront', '1 Month / Standard', 24999.00, 8498.00, 0.00, 6029.46, 39526.46, 'Razorpay UPI', 'paid', 'in_progress', 'Include automated GST invoicing and WhatsApp order notification integration.'),
('STR-ORD-2026-1002', 2, 'Verified Enterprise Client', 'client@saampark.com', '+91 9091518567', 'Apex Global Retail', 'digital_marketing', 'Digital Marketing', 'Velocity Boost (Package 03 - Boost)', '3 Months Plan (5% OFF)', 23997.00, 3999.00, 1199.85, 4823.31, 31619.46, 'Direct Bank Transfer', 'paid', 'qa_staging', 'Focus reels on festive jewelry sales and store footfall.');

INSERT INTO `order_addons` (`order_id`, `addon_code`, `addon_title`, `addon_price`) VALUES
(1, 'ga4_pixel', '📈 GA4, Meta Pixel & Conversion API Suite', 3499.00),
(1, 'express_7day', '⚡ Express 7-Day Sprint Delivery', 4999.00),
(2, 'wa_credits', '💬 5,000 Verified WhatsApp Campaign Credits', 3999.00);

-- ---------------------------------------------------------------------
-- ADMIN SETTINGS
-- ---------------------------------------------------------------------
INSERT INTO `admin_settings` (`setting_key`, `setting_value`, `description`) VALUES
('company_name', 'Saampark Technology & Research Pvt. Ltd.', 'Official corporate name'),
('support_phone', '+91 9046232424', 'Primary support helpline from marketing flyer'),
('support_email', 'saamparkconsultancyservice@gmail.com', 'Official support email address'),
('currency', 'INR', 'Default billing currency'),
('gst_rate_percent', '18', 'Standard GST rate applied at checkout'),
('annual_discount_percent', '20', 'Discount percentage for 12-month packages'),
('quarterly_discount_percent', '5', 'Discount percentage for 3-month packages'),
('half_year_discount_percent', '10', 'Discount percentage for 6-month packages');

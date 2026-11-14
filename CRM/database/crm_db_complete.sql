-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: crm_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `account_categories`
--

DROP TABLE IF EXISTS `account_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `account_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` varchar(50) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `account_categories_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `account_categories`
--

LOCK TABLES `account_categories` WRITE;
/*!40000 ALTER TABLE `account_categories` DISABLE KEYS */;
INSERT INTO `account_categories` VALUES (1,1,'Sales Income','income',NULL,1,'2026-09-06 17:01:05'),(2,1,'Rent','expense',NULL,1,'2026-09-06 17:01:05'),(3,1,'Salaries','expense',NULL,1,'2026-09-06 17:01:05'),(4,1,'Other Income','income',NULL,1,'2026-09-06 17:01:50'),(5,1,'Rent','expense',NULL,1,'2026-09-06 17:01:50'),(6,1,'Salaries','expense',NULL,1,'2026-09-06 17:01:50'),(7,1,'Utilities','expense',NULL,1,'2026-09-06 17:01:50'),(8,1,'Office Supplies','expense',NULL,1,'2026-09-06 17:01:50'),(9,1,'Marketing','expense',NULL,1,'2026-09-06 17:01:50'),(10,1,'Travel','expense',NULL,1,'2026-09-06 17:01:50'),(11,1,'Professional Services','expense',NULL,1,'2026-09-06 17:01:50'),(12,1,'Other Expense','expense',NULL,1,'2026-09-06 17:01:50');
/*!40000 ALTER TABLE `account_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_logs`
--

DROP TABLE IF EXISTS `activity_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `action_type` varchar(50) NOT NULL,
  `details` text DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `activity_logs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_logs`
--

LOCK TABLES `activity_logs` WRITE;
/*!40000 ALTER TABLE `activity_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `activity_timeline`
--

DROP TABLE IF EXISTS `activity_timeline`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `activity_timeline` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `module_type` varchar(50) NOT NULL,
  `module_id` int(11) NOT NULL,
  `action` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `old_value` text DEFAULT NULL,
  `new_value` text DEFAULT NULL,
  `performed_by` int(11) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `activity_timeline_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `activity_timeline`
--

LOCK TABLES `activity_timeline` WRITE;
/*!40000 ALTER TABLE `activity_timeline` DISABLE KEYS */;
/*!40000 ALTER TABLE `activity_timeline` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_data`
--

DROP TABLE IF EXISTS `app_data`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_data` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_key` varchar(100) NOT NULL,
  `data_json` longtext NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `module_key` (`module_key`)
) ENGINE=InnoDB AUTO_INCREMENT=38084 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_data`
--

LOCK TABLES `app_data` WRITE;
/*!40000 ALTER TABLE `app_data` DISABLE KEYS */;
INSERT INTO `app_data` VALUES (1,'leads','[{\"id\":\"lead_104\",\"type\":\"Person\",\"name\":\"Emily Watson\",\"primaryContact\":\"Emily Watson\",\"phone\":\"+91 98456 78901\",\"service\":\"SEO & Digital Marketing\",\"reminderDate\":\"07 Sept 2026\",\"reminderNotes\":\"Send monthly audit report\",\"owner\":\"Supriya (Super Admin)\",\"caller\":\"Supriya (Super Admin)\",\"ownerAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\",\"labels\":[\"Follow Up\"],\"createdAt\":\"02 Aug 2026\",\"status\":\"Qualified\",\"source\":\"Referral\",\"city\":\"Pune\",\"state\":\"Maharashtra\",\"country\":\"India\",\"value\":\"Γé╣2,00,000\",\"isLocked\":true,\"companyId\":\"tech\",\"lockedReason\":\"Manually locked by Admin\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\"},{\"type\":\"Organization\",\"name\":\"donald trump\",\"primaryContact\":\"donald trump\",\"status\":\"Won\",\"service\":\"Website Devlopment\",\"reminderDate\":\"22 Aug 2026\",\"reminderTime\":\"11:30 AM\",\"reminderNotes\":\"Follow up call scheduled\",\"caller\":\"Browser Test User\",\"owner\":\"Browser Test User\",\"assignedTo\":\"Browser Test User\",\"createdBy\":\"Supriya Naskar\",\"ownerAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=donald trump\",\"managers\":\"\",\"source\":\"Social Media\",\"address\":\"\",\"city\":\"Mumbai\",\"state\":\"Maharashtra\",\"zip\":\"400001\",\"country\":\"India\",\"phone\":\"+91 98765-43210\",\"website\":\"\",\"vatNumber\":\"\",\"gstNumber\":\"\",\"currency\":\"Keep it blank to use the default (INR - Γé╣)\",\"labels\":[\"Call this week\"],\"createdAt\":\"21 Aug 2026\",\"id\":\"101\",\"isLocked\":true,\"companyId\":\"tech\",\"lockedReason\":\"Won: Lead is finalized and converted to Client.\"},{\"id\":\"lead_101\",\"type\":\"Person\",\"name\":\"Sarah Cole\",\"primaryContact\":\"Sarah Cole\",\"phone\":\"+91 98123 45678\",\"service\":\"Google My Business\",\"reminderDate\":\"22 Aug 2026\",\"reminderNotes\":\"Follow up regarding GMB verification code\",\"owner\":\"Supriya (Super Admin)\",\"caller\":\"Supriya (Super Admin)\",\"ownerAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\",\"labels\":[\"Call this week\"],\"createdAt\":\"06 Aug 2026\",\"status\":\"New\",\"source\":\"Google\",\"city\":\"Mumbai\",\"state\":\"Maharashtra\",\"country\":\"India\",\"value\":\"Γé╣1,50,000\",\"isLocked\":true,\"lockedReason\":\"Overdue: Lead status or reminder date was not updated daily by caller.\",\"companyId\":\"tech\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\"},{\"id\":\"lead_102\",\"type\":\"Person\",\"name\":\"Michael Vance\",\"primaryContact\":\"Michael Vance\",\"phone\":\"+91 98234 56789\",\"service\":\"Custom ERP System\",\"reminderDate\":\"20 Aug 2026\",\"reminderNotes\":\"Send proposal draft for review\",\"owner\":\"Supriya (Super Admin)\",\"caller\":\"Supriya (Super Admin)\",\"ownerAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\",\"labels\":[\"Potential\"],\"createdAt\":\"05 Aug 2026\",\"status\":\"New\",\"source\":\"LinkedIn\",\"city\":\"Delhi\",\"state\":\"Delhi\",\"country\":\"India\",\"value\":\"Γé╣4,20,000\",\"isLocked\":true,\"lockedReason\":\"Overdue: Lead status or reminder date was not updated daily by caller.\",\"companyId\":\"tech\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\"},{\"id\":\"lead_103\",\"type\":\"Company\",\"name\":\"Apex Tech Solutions\",\"primaryContact\":\"David Miller\",\"phone\":\"+91 98345 67890\",\"service\":\"Mobile App Development\",\"reminderDate\":\"22 Aug 2026\",\"reminderNotes\":\"Schedule technical demo with CTO\",\"owner\":\"Supriya (Super Admin)\",\"caller\":\"Supriya (Super Admin)\",\"ownerAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\",\"labels\":[\"High Priority\"],\"createdAt\":\"04 Aug 2026\",\"status\":\"Discussion\",\"source\":\"Website\",\"city\":\"Bangalore\",\"state\":\"Karnataka\",\"country\":\"India\",\"value\":\"Γé╣8,50,000\",\"isLocked\":true,\"lockedReason\":\"Overdue: Lead status or reminder date was not updated daily by caller.\",\"companyId\":\"tech\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\"},{\"type\":\"Person\",\"name\":\"Google LLC\",\"primaryContact\":\"Sundar Pichai\",\"phone\":\"9876543210\",\"status\":\"New\",\"service\":\"Digital merketing\",\"reminderDate\":\"None\",\"reminderTime\":\"None\",\"reminderNotes\":\"\",\"caller\":\"None\",\"owner\":\"None\",\"assignedTo\":\"None\",\"createdBy\":\"Supriya (Super Admin)\",\"ownerAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=Google LLC\",\"managers\":\"\",\"source\":\"Social Media\",\"address\":\"\",\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"country\":\"India\",\"website\":\"\",\"vatNumber\":\"\",\"gstNumber\":\"\",\"currency\":\"Keep it blank to use the default (INR - Γé╣)\",\"labels\":[\"Call this week\"],\"createdAt\":\"24 Aug 2026\",\"id\":\"lead_1787596024619_iwxg\",\"isLocked\":false},{\"id\":\"lead_digi_001\",\"name\":\"Digital Lead Beta\",\"company\":\"Digital Agency\",\"branchId\":3},{\"id\":\"lead_tech_001\",\"name\":\"Tech Lead Alpha\",\"company\":\"Tech Corp\",\"branchId\":1}]','2026-09-12 01:26:09'),(2,'tasks','[{\"title\":\"Design Landing Page\",\"deadline\":\"2026-09-27\",\"relatedTo\":\"app\",\"projectName\":\"app\",\"client\":\"donald trump\",\"source\":\"projects\",\"sourceId\":\"707527\",\"assignedTo\":\"Supriya (Super Admin)\",\"priority\":\"Normal\",\"status\":\"To do\",\"companyId\":\"tech\",\"id\":\"3652\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\"},{\"id\":\"lead_task_lead_104\",\"title\":\"Emily Watson\",\"startDate\":\"02 Aug 2026\",\"deadline\":\"07 Sept 2026\",\"status\":\"To do\",\"priority\":\"High\",\"milestone\":\"Qualified\",\"relatedTo\":\"Lead: Emily Watson\",\"assignedTo\":\"Supriya (Super Admin)\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\",\"collaborators\":\"-\",\"priorityIcon\":\"up\",\"labels\":[\"Follow-up\"],\"points\":\"2 Points\",\"description\":\"Primary Contact: Emily Watson. Phone: +91 98456 78901. Services: SEO & Digital Marketing. Notes: Send monthly audit report\",\"companyId\":\"tech\"},{\"title\":\"jkcgcvjkh - Initial Setup & Execution\",\"description\":\"Deliverable for client donald trump. Project: jkcgcvjkh. Billed: Γé╣4,982. Scope: jkcgcvjkh\",\"relatedTo\":\"jkcgcvjkh\",\"points\":\"3 Points\",\"assignedTo\":\"SAAMPARK Group Team\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=SAAMPARKGroupTeam\",\"collaborators\":\"-\",\"status\":\"To do\",\"priority\":\"High\",\"priorityIcon\":\"up\",\"labels\":[\"Website Development\",\"Client Project\"],\"startDate\":\"2026-08-26\",\"deadline\":\"2026-09-26\",\"milestone\":\"Beta Release\",\"isRecurring\":false,\"id\":\"3651\"}]','2026-09-12 01:26:05'),(3,'projects','[{\"title\":\"app\",\"client\":\"donald trump\",\"clientId\":\"cli_101\",\"projectType\":\"Client Project\",\"price\":\"Γé╣1,179\",\"startDate\":\"2026-08-27\",\"deadline\":\"2026-09-27\",\"progress\":15,\"status\":\"In Progress\",\"paymentStatus\":\"Advance Received\",\"paymentStructure\":\"Advance Payment\",\"advanceAmount\":502,\"dueAmount\":677,\"baseAmount\":999,\"setupCharge\":0,\"discount\":0,\"gstRate\":18,\"gstAmount\":180,\"totalAmount\":1179,\"items\":[{\"id\":\"svc_1787806687350\",\"serviceName\":\"Website Development\",\"sacCode\":\"998313\",\"qty\":1,\"unit\":\"Project\",\"rate\":999,\"charges\":[],\"gstRate\":18,\"gstAmount\":180,\"totalAmount\":1179}],\"discountsList\":[],\"billedBy\":\"Supriya Naskar\",\"createdById\":\"1\",\"createdByEmail\":\"supriyo.main@gmail.com\",\"labels\":[\"Website Development\",\"Advance Received\"],\"description\":\"Client Project for donald trump. Website Development. Billed by Supriya Naskar.\",\"members\":[{\"id\":\"4\",\"name\":\"Supriya (Super Admin)\",\"role\":\"Executive Management\",\"email\":\"hiisupriya@gmail.com\",\"avatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\",\"avatarUrl\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\"}],\"milestones\":[{\"id\":\"ms_fe_1787806707484\",\"title\":\"Phase 1: Architecture & UI Setup\",\"stage\":\"Frontend\",\"status\":\"Completed\",\"notes\":\"Project scope initiated. Advance status: Paid.\",\"updatedBy\":\"Supriya (Super Admin)\",\"updatedAt\":\"2026-08-27T04:58:27.484Z\"},{\"id\":\"ms_be_1787806707485\",\"title\":\"Phase 2: Core Development & Integration\",\"stage\":\"Backend\",\"status\":\"Pending\",\"notes\":\"Development in progress\",\"updatedBy\":\"Supriya (Super Admin)\",\"updatedAt\":\"2026-08-27T04:58:27.484Z\"}],\"id\":\"707527\",\"companyId\":\"tech\",\"starred\":false,\"totalHours\":0,\"taskBreakdown\":{\"todo\":0,\"inProgress\":0,\"review\":0,\"done\":0},\"activityLogs\":[{\"id\":\"act-1787806707527\",\"user\":\"Supriya Naskar\",\"timestamp\":\"Just now\",\"action\":\"Created\",\"title\":\"Project \\\"app\\\" created\",\"badge\":\"Project\"}]}]','2026-09-12 01:26:11'),(4506,'clients','[{\"id\":\"cli_101\",\"name\":\"donald trump\",\"primaryContact\":\"donald trump\",\"email\":\"lead_101@saampark.in\",\"phone\":\"+91 98765-43210\",\"group\":\"VIP\",\"label\":\"Website Devlopment\",\"labelColor\":\"#3b82f6\",\"projectsCount\":1,\"totalInvoiced\":\"Γé╣59,000\",\"paymentReceived\":\"Γé╣0\",\"due\":\"Γé╣59,000\",\"address\":\"Mumbai, Maharashtra, India\"}]','2026-08-22 12:22:59'),(10970,'users_tech','[{\"id\":\"usr_root_super_admin\",\"name\":\"Supriya (Super Admin)\",\"email\":\"saampark.official@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\",\"consultancy\"],\"companyName\":\"SAAMPARK Group (All Companies)\",\"status\":\"Active\",\"department\":\"Executive Management\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"37\",\"name\":\"Verified User Creation\",\"email\":\"verifieduser@saampark.in\",\"role\":\"Teams\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Marketing\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"kycStatus\":\"Pending\",\"permissions\":null},{\"id\":\"36\",\"name\":\"Localhost Test User\",\"email\":\"localtestuser1@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Engineering\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"kycStatus\":\"Pending\",\"permissions\":{\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"actionMatrix\":{\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Quotations\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Sales Orders\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Invoices\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Credit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Debit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Services & Store\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"EMI\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Teams\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Attendance\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Leave\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payroll\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Companies\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Branches\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Departments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Permissions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Activity Logs\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false}}}},{\"id\":\"35\",\"name\":\"Test New User\",\"email\":\"testnewuser999@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Engineering\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"kycStatus\":\"Pending\",\"permissions\":null},{\"id\":\"16\",\"name\":\"Aman Verma (Senior Ops Lead)\",\"email\":\"team@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"15\",\"name\":\"Vikram Malhotra (Admin)\",\"email\":\"admin@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T17:02:47.000Z\",\"joinedDate\":\"2026-08-24\"},{\"id\":\"usr_admin_main\",\"name\":\"Chiranjit Mahapatra\",\"email\":\"saamparktechnologyresearch@gmail.com\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43211\",\"password\":\"admin123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_team_rakhi\",\"name\":\"Rakhi Ghosh\",\"email\":\"rakhighosh25899@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Support\",\"phone\":\"+91 98765 43212\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"23\",\"name\":\"Assigned Tech Admin\",\"email\":\"assigned_admin_tech@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"20\",\"name\":\"Ananya Roy (Marketing Specialist)\",\"email\":\"ananya.marketing@saampark.in\",\"role\":\"Clients\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Sales\",\"Projects\",\"Messages\",\"Tickets\",\"Settings\"]},{\"id\":\"19\",\"name\":\"kututcgc\",\"email\":\"jfyfhvhfjcj@mail\",\"role\":\"Admin\",\"companyId\":\"saampark-ai-solutions\",\"companyIds\":[\"saampark-ai-solutions\",\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"18\",\"name\":\"Rohit Sharma (Dev Lead)\",\"email\":\"rohit.dev@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Cloud & Infrastructure Architecture\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":false,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"]}},{\"id\":\"17\",\"name\":\"Acme Corp (Client)\",\"email\":\"client@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"kycStatus\":\"Pending\"},{\"id\":\"6\",\"name\":\"Browser Test User\",\"email\":\"browser.test@saampark.in\",\"role\":\"Teams\",\"companyId\":\"0\",\"companyIds\":[\"0\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 96543 21098\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-21T16:33:47.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"5\",\"name\":\"Test Operator\",\"email\":\"test.operator@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-21\"},{\"id\":\"2\",\"name\":\"Team\",\"email\":\"supriyogod@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"caller\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T19:56:10.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\",\"Users\"],\"kycStatus\":\"Pending\"},{\"id\":\"usr_saampark_group_team\",\"name\":\"SAAMPARK Group Team\",\"email\":\"saamparkgroup@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Lead Operations\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_cli_cli_101\",\"name\":\"donald trump\",\"email\":\"lead_101@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyName\":\"donald trump\",\"status\":\"Active\",\"department\":\"Clients\",\"phone\":\"+91 98765-43210\",\"password\":\"Password123\",\"lastLogin\":\"Just now\",\"joinedDate\":\"2026-08-27\",\"companyIds\":[\"tech\"],\"kycStatus\":\"Pending\"},{\"id\":\"34\",\"name\":\"Mumbai User by Mumbai Branch Admin\",\"email\":\"mumbai_user_1788719320285@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"32\",\"name\":\"Authorized Tech Client\",\"email\":\"authorized_client_1788719316769@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"31\",\"name\":\"Authorized Tech Team Member\",\"email\":\"authorized_team_1788719314041@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"29\",\"name\":\"Test Field Team Member\",\"email\":\"fieldteam_test_1788719311488@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"28\",\"name\":\"Test Tech Admin\",\"email\":\"techadmin_test_1788719308980@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"27\",\"name\":\"Mumbai User by Mumbai Branch Admin\",\"email\":\"mumbai_user_1788719220346@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"26\",\"name\":\"Branch Admin Mumbai\",\"email\":\"branch_admin_mumbai@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"25\",\"name\":\"Authorized Tech Client\",\"email\":\"authorized_client_1788719216282@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"24\",\"name\":\"Authorized Tech Team Member\",\"email\":\"authorized_team_1788719213140@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"22\",\"name\":\"Test Field Team Member\",\"email\":\"fieldteam_test_1788719208810@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"21\",\"name\":\"Test Tech Admin\",\"email\":\"techadmin_test_1788719202360@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"1\",\"name\":\"Supriya Naskar\",\"email\":\"supriyo.main@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"9547110730\",\"lastLogin\":\"2026-08-24T16:07:51.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Notes\",\"Messages\",\"Tickets\",\"Knowledge base\",\"Files\"],\"kycStatus\":\"Pending\"}]','2026-09-25 18:17:22'),(11015,'user_profile_hiisupriya@gmail.com_tech','{\"id\":\"4\",\"name\":\"Supriya \",\"email\":\"hiisupriya@gmail.com\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"avatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\",\"phone\":\"+91 98765 43210\",\"jobTitle\":\"Admin\",\"department\":\"Software & IT Engineering\",\"location\":\"Mumbai, India\",\"bio\":\"Senior CRM engineer & client delivery manager at SAAMPARK Group.\",\"skills\":\"Full-Stack Development, React, Next.js, Cloud Architecture, CRM Management\"}','2026-08-24 16:07:32'),(11017,'user_profile_hiisupriya@gmail.com','{\"id\":\"4\",\"name\":\"Supriya \",\"email\":\"hiisupriya@gmail.com\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"avatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=hiisupriya@gmail.com\",\"phone\":\"+91 98765 43210\",\"jobTitle\":\"Admin\",\"department\":\"Software & IT Engineering\",\"location\":\"Mumbai, India\",\"bio\":\"Senior CRM engineer & client delivery manager at SAAMPARK Group.\",\"skills\":\"Full-Stack Development, React, Next.js, Cloud Architecture, CRM Management\"}','2026-08-24 16:07:32'),(12163,'users_digital','[{\"id\":\"usr_root_super_admin\",\"name\":\"Supriya (Super Admin)\",\"email\":\"saampark.official@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\",\"consultancy\"],\"companyName\":\"SAAMPARK Group (All Companies)\",\"status\":\"Active\",\"department\":\"Executive Management\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"37\",\"name\":\"Verified User Creation\",\"email\":\"verifieduser@saampark.in\",\"role\":\"Teams\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Marketing\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"kycStatus\":\"Pending\",\"permissions\":null},{\"id\":\"36\",\"name\":\"Localhost Test User\",\"email\":\"localtestuser1@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Engineering\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"kycStatus\":\"Pending\",\"permissions\":{\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"actionMatrix\":{\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Quotations\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Sales Orders\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Invoices\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Credit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Debit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Services & Store\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"EMI\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Teams\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Attendance\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Leave\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payroll\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Companies\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Branches\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Departments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Permissions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Activity Logs\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false}}}},{\"id\":\"35\",\"name\":\"Test New User\",\"email\":\"testnewuser999@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Engineering\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"kycStatus\":\"Pending\",\"permissions\":null},{\"id\":\"16\",\"name\":\"Aman Verma (Senior Ops Lead)\",\"email\":\"team@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"15\",\"name\":\"Vikram Malhotra (Admin)\",\"email\":\"admin@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T17:02:47.000Z\",\"joinedDate\":\"2026-08-24\"},{\"id\":\"usr_admin_main\",\"name\":\"Chiranjit Mahapatra\",\"email\":\"saamparktechnologyresearch@gmail.com\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43211\",\"password\":\"admin123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_team_rakhi\",\"name\":\"Rakhi Ghosh\",\"email\":\"rakhighosh25899@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Support\",\"phone\":\"+91 98765 43212\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"23\",\"name\":\"Assigned Tech Admin\",\"email\":\"assigned_admin_tech@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"20\",\"name\":\"Ananya Roy (Marketing Specialist)\",\"email\":\"ananya.marketing@saampark.in\",\"role\":\"Clients\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Sales\",\"Projects\",\"Messages\",\"Tickets\",\"Settings\"]},{\"id\":\"19\",\"name\":\"kututcgc\",\"email\":\"jfyfhvhfjcj@mail\",\"role\":\"Admin\",\"companyId\":\"saampark-ai-solutions\",\"companyIds\":[\"saampark-ai-solutions\",\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"18\",\"name\":\"Rohit Sharma (Dev Lead)\",\"email\":\"rohit.dev@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Cloud & Infrastructure Architecture\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":false,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"]}},{\"id\":\"17\",\"name\":\"Acme Corp (Client)\",\"email\":\"client@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"kycStatus\":\"Pending\"},{\"id\":\"6\",\"name\":\"Browser Test User\",\"email\":\"browser.test@saampark.in\",\"role\":\"Teams\",\"companyId\":\"0\",\"companyIds\":[\"0\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 96543 21098\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-21T16:33:47.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"5\",\"name\":\"Test Operator\",\"email\":\"test.operator@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-21\"},{\"id\":\"2\",\"name\":\"Team\",\"email\":\"supriyogod@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"caller\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T19:56:10.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\",\"Users\"],\"kycStatus\":\"Pending\"},{\"id\":\"usr_saampark_group_team\",\"name\":\"SAAMPARK Group Team\",\"email\":\"saamparkgroup@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Lead Operations\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_cli_cli_101\",\"name\":\"donald trump\",\"email\":\"lead_101@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyName\":\"donald trump\",\"status\":\"Active\",\"department\":\"Clients\",\"phone\":\"+91 98765-43210\",\"password\":\"Password123\",\"lastLogin\":\"Just now\",\"joinedDate\":\"2026-08-27\",\"companyIds\":[\"tech\"],\"kycStatus\":\"Pending\"},{\"id\":\"34\",\"name\":\"Mumbai User by Mumbai Branch Admin\",\"email\":\"mumbai_user_1788719320285@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"32\",\"name\":\"Authorized Tech Client\",\"email\":\"authorized_client_1788719316769@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"31\",\"name\":\"Authorized Tech Team Member\",\"email\":\"authorized_team_1788719314041@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"29\",\"name\":\"Test Field Team Member\",\"email\":\"fieldteam_test_1788719311488@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"28\",\"name\":\"Test Tech Admin\",\"email\":\"techadmin_test_1788719308980@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"27\",\"name\":\"Mumbai User by Mumbai Branch Admin\",\"email\":\"mumbai_user_1788719220346@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"26\",\"name\":\"Branch Admin Mumbai\",\"email\":\"branch_admin_mumbai@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"25\",\"name\":\"Authorized Tech Client\",\"email\":\"authorized_client_1788719216282@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"24\",\"name\":\"Authorized Tech Team Member\",\"email\":\"authorized_team_1788719213140@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"22\",\"name\":\"Test Field Team Member\",\"email\":\"fieldteam_test_1788719208810@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"21\",\"name\":\"Test Tech Admin\",\"email\":\"techadmin_test_1788719202360@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"1\",\"name\":\"Supriya Naskar\",\"email\":\"supriyo.main@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"9547110730\",\"lastLogin\":\"2026-08-24T16:07:51.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Notes\",\"Messages\",\"Tickets\",\"Knowledge base\",\"Files\"],\"kycStatus\":\"Pending\"}]','2026-09-25 18:17:22'),(16142,'users_saampark-ai-solutions','[{\"id\":\"4\",\"name\":\"Supriya (Super Admin)\",\"email\":\"hiisupriya@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43210\",\"password\":\"123456\",\"lastLogin\":\"2026-08-24T17:23:50.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Leads\"]},{\"id\":\"18\",\"name\":\"Rohit Sharma (Dev Lead)\",\"email\":\"rohit.dev@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Cloud & Infrastructure Architecture\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"]},{\"id\":\"16\",\"name\":\"Aman Verma (Senior Ops Lead)\",\"email\":\"team@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"15\",\"name\":\"Vikram Malhotra (Admin)\",\"email\":\"admin@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T17:02:47.000Z\",\"joinedDate\":\"2026-08-24\"},{\"id\":\"6\",\"name\":\"Browser Test User\",\"email\":\"browser.test@saampark.in\",\"role\":\"Teams\",\"companyId\":\"0\",\"companyIds\":[\"0\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 96543 21098\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-21T16:33:47.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"5\",\"name\":\"Test Operator\",\"email\":\"test.operator@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-21\"},{\"id\":\"2\",\"name\":\"Team\",\"email\":\"supriyogod@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"caller\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T19:56:10.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\",\"Users\"]},{\"id\":\"20\",\"name\":\"Ananya Roy (Marketing Specialist)\",\"email\":\"ananya.marketing@saampark.in\",\"role\":\"Clients\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Sales\",\"Projects\",\"Messages\",\"Tickets\",\"Settings\"]},{\"id\":\"19\",\"name\":\"kututcgc\",\"email\":\"jfyfhvhfjcj@mail\",\"role\":\"Admin\",\"companyId\":\"saampark-ai-solutions\",\"companyIds\":[\"saampark-ai-solutions\",\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"17\",\"name\":\"Acme Corp (Client)\",\"email\":\"client@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\"}]','2026-08-24 20:01:22'),(17060,'leads_digital','[{\"id\":\"lead_digi_001\",\"name\":\"Digital Lead Beta\",\"company\":\"Digital Agency\",\"branchId\":3}]','2026-09-06 18:28:28'),(22714,'chat_messages_tech','[{\"id\":\"msg_1787606170678_4mya\",\"senderEmail\":\"hiisupriya@gmail.com\",\"senderName\":\"Supriya (Super Admin)\",\"recipientEmail\":\"lead_101@saampark.in\",\"recipientName\":\"donald trump\",\"text\":\"System verification: Live messaging and CRUD testing.\",\"timestamp\":\"02:46 AM\",\"read\":false}]','2026-08-24 21:16:11'),(25902,'leads_tech','[{\"id\":\"lead_tech_001\",\"name\":\"Tech Lead Alpha\",\"company\":\"Tech Corp\",\"branchId\":1}]','2026-09-06 18:28:28'),(26252,'role_permissions','{\"rolePermissions\":{\"Super Admin\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"Admin\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"Teams\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Sales\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Files\",\"Settings\"],\"User\":[\"Dashboard\",\"Events\",\"Projects\",\"Tasks\",\"Notes\",\"Messages\",\"Tickets\",\"Knowledge base\",\"Files\"],\"Clients\":[\"Clients\",\"Projects\",\"Leads\",\"Sales\",\"Messages\",\"Tickets\",\"Settings\"]},\"roleActionPermissions\":{\"Super Admin\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"Admin\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"Teams\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false}},\"Clients\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Leads\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Messages\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false}}}}','2026-08-25 22:55:44'),(28548,'client_labels_tech','[{\"id\":\"clbl_1\",\"name\":\"50% Probability\",\"color\":\"#eab308\"},{\"id\":\"clbl_2\",\"name\":\"90% Probability\",\"color\":\"#84cc16\"},{\"id\":\"clbl_3\",\"name\":\"Call this week\",\"color\":\"#c026d3\"},{\"id\":\"clbl_4\",\"name\":\"Corporate\",\"color\":\"#d8b4fe\"},{\"id\":\"clbl_5\",\"name\":\"Inactive\",\"color\":\"#94a3b8\"},{\"id\":\"clbl_6\",\"name\":\"Potential\",\"color\":\"#3b82f6\"},{\"id\":\"clbl_7\",\"name\":\"Referral\",\"color\":\"#2dd4bf\"},{\"id\":\"clbl_8\",\"name\":\"Satisfied\",\"color\":\"#65a30d\"},{\"id\":\"clbl_9\",\"name\":\"Unsatisfied\",\"color\":\"#38bdf8\"}]','2026-08-26 20:06:48'),(28556,'projects_tech','[{\"title\":\"app\",\"client\":\"donald trump\",\"clientId\":\"cli_101\",\"projectType\":\"Client Project\",\"price\":\"Γé╣1,179\",\"startDate\":\"2026-08-27\",\"deadline\":\"2026-09-27\",\"progress\":15,\"status\":\"In Progress\",\"paymentStatus\":\"Advance Received\",\"paymentStructure\":\"Advance Payment\",\"advanceAmount\":502,\"dueAmount\":677,\"baseAmount\":999,\"setupCharge\":0,\"discount\":0,\"gstRate\":18,\"gstAmount\":180,\"totalAmount\":1179,\"items\":[{\"id\":\"svc_1787806687350\",\"serviceName\":\"Website Development\",\"sacCode\":\"998313\",\"qty\":1,\"unit\":\"Project\",\"rate\":999,\"charges\":[],\"gstRate\":18,\"gstAmount\":180,\"totalAmount\":1179}],\"discountsList\":[],\"billedBy\":\"Supriya Naskar\",\"createdById\":\"1\",\"createdByEmail\":\"supriyo.main@gmail.com\",\"labels\":[\"Website Development\",\"Advance Received\"],\"description\":\"Client Project for donald trump. Website Development. Billed by Supriya Naskar.\",\"members\":[{\"id\":\"4\",\"name\":\"Supriya (Super Admin)\",\"role\":\"Executive Management\",\"email\":\"hiisupriya@gmail.com\",\"avatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=Supriya (Super Admin)\"}],\"milestones\":[{\"id\":\"ms_fe_1787806707484\",\"title\":\"Phase 1: Architecture & UI Setup\",\"stage\":\"Frontend\",\"status\":\"Completed\",\"notes\":\"Project scope initiated. Advance status: Paid.\",\"updatedBy\":\"Supriya (Super Admin)\",\"updatedAt\":\"2026-08-27T04:58:27.484Z\"},{\"id\":\"ms_be_1787806707485\",\"title\":\"Phase 2: Core Development & Integration\",\"stage\":\"Backend\",\"status\":\"Pending\",\"notes\":\"Development in progress\",\"updatedBy\":\"Supriya (Super Admin)\",\"updatedAt\":\"2026-08-27T04:58:27.484Z\"}],\"id\":\"707527\",\"companyId\":\"tech\",\"starred\":false,\"totalHours\":0,\"taskBreakdown\":{\"todo\":0,\"inProgress\":0,\"review\":0,\"done\":0},\"activityLogs\":[{\"id\":\"act-1787806707527\",\"user\":\"Supriya Naskar\",\"timestamp\":\"Just now\",\"action\":\"Created\",\"title\":\"Project \\\"app\\\" created\",\"badge\":\"Project\"}]}]','2026-08-27 04:58:27'),(28561,'orders_tech','[{\"client\":\"donald trump\",\"clientEmail\":\"lead_101@saampark.in\",\"clientId\":\"cli_101\",\"project\":\"app\",\"orderDate\":\"2026-08-27\",\"deliveryDate\":\"2026-09-27\",\"itemsCount\":1,\"totalAmount\":\"Γé╣1,179\",\"paymentStatus\":\"Partially paid\",\"status\":\"Processing\",\"notes\":\"Order for: app. Services: Website Development.\",\"invoiceId\":\"INV2708260005\",\"id\":\"ord_1787806708466\",\"orderNumber\":\"ORD #1081\"}]','2026-08-27 04:58:28'),(28563,'payments_tech','[{\"invoiceId\":\"INV2708260005\",\"client\":\"donald trump\",\"clientEmail\":\"lead_101@saampark.in\",\"project\":\"app\",\"paymentDate\":\"2026-08-27\",\"paymentMethod\":\"Advance (Initial Deposit)\",\"transactionRef\":\"REC_708509\",\"note\":\"Initial payment for app (1 services)\",\"amount\":\"Γé╣502\",\"amountNum\":502,\"status\":\"Completed\",\"companyId\":\"tech\",\"id\":\"P-4872\"}]','2026-08-27 04:58:28'),(28565,'clients_tech','[{\"id\":\"cli_101\",\"name\":\"donald trump\",\"primaryContact\":\"donald trump\",\"email\":\"lead_101@saampark.in\",\"phone\":\"+91 98765-43210\",\"group\":\"VIP\",\"label\":\"Website Devlopment\",\"labelColor\":\"#3b82f6\",\"projectsCount\":15,\"totalInvoiced\":\"Γé╣1,48,672\",\"paymentReceived\":\"Γé╣1,49,176\",\"due\":\"Γé╣4,215\",\"address\":\"Mumbai, Maharashtra, India\",\"createdAt\":1787774833048}]','2026-08-27 04:58:29'),(28566,'tasks_tech','[{\"title\":\"Design Landing Page\",\"deadline\":\"2026-09-27\",\"relatedTo\":\"app\",\"projectName\":\"app\",\"client\":\"donald trump\",\"source\":\"projects\",\"sourceId\":\"707527\",\"assignedTo\":\"Supriya (Super Admin)\",\"priority\":\"Normal\",\"status\":\"To do\",\"companyId\":\"tech\",\"id\":\"3652\"},{\"id\":\"lead_task_lead_104\",\"title\":\"Emily Watson\",\"startDate\":\"02 Aug 2026\",\"deadline\":\"07 Sept 2026\",\"status\":\"To do\",\"priority\":\"High\",\"milestone\":\"Qualified\",\"relatedTo\":\"Lead: Emily Watson\",\"assignedTo\":\"Supriya (Super Admin)\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=Supriya (Super Admin)\",\"collaborators\":\"-\",\"priorityIcon\":\"up\",\"labels\":[\"Follow-up\"],\"points\":\"2 Points\",\"description\":\"Primary Contact: Emily Watson. Phone: +91 98456 78901. Services: SEO & Digital Marketing. Notes: Send monthly audit report\",\"companyId\":\"tech\"},{\"title\":\"jkcgcvjkh - Initial Setup & Execution\",\"description\":\"Deliverable for client donald trump. Project: jkcgcvjkh. Billed: Γé╣4,982. Scope: jkcgcvjkh\",\"relatedTo\":\"jkcgcvjkh\",\"points\":\"3 Points\",\"assignedTo\":\"SAAMPARK Group Team\",\"assignedToAvatar\":\"https://api.dicebear.com/7.x/notionists/svg?seed=SAAMPARKGroupTeam\",\"collaborators\":\"-\",\"status\":\"To do\",\"priority\":\"High\",\"priorityIcon\":\"up\",\"labels\":[\"Website Development\",\"Client Project\"],\"startDate\":\"2026-08-26\",\"deadline\":\"2026-09-26\",\"milestone\":\"Beta Release\",\"isRecurring\":false,\"id\":\"3651\"}]','2026-09-12 00:15:03'),(28567,'contacts_tech','[{\"id\":\"cnt_cli_101\",\"name\":\"donald trump\",\"clientName\":\"donald trump\",\"jobTitle\":\"Primary Contact\",\"email\":\"lead_101@saampark.in\",\"phone\":\"+91 98765-43210\",\"avatarSeed\":\"donald trump\"}]','2026-08-27 04:58:29'),(28915,'subscriptions_tech','[]','2026-08-27 04:57:40'),(28973,'client_labels_digital','[{\"id\":\"clbl_1\",\"name\":\"50% Probability\",\"color\":\"#eab308\"},{\"id\":\"clbl_2\",\"name\":\"90% Probability\",\"color\":\"#84cc16\"},{\"id\":\"clbl_3\",\"name\":\"Call this week\",\"color\":\"#c026d3\"},{\"id\":\"clbl_4\",\"name\":\"Corporate\",\"color\":\"#d8b4fe\"},{\"id\":\"clbl_5\",\"name\":\"Inactive\",\"color\":\"#94a3b8\"},{\"id\":\"clbl_6\",\"name\":\"Potential\",\"color\":\"#3b82f6\"},{\"id\":\"clbl_7\",\"name\":\"Referral\",\"color\":\"#2dd4bf\"},{\"id\":\"clbl_8\",\"name\":\"Satisfied\",\"color\":\"#65a30d\"},{\"id\":\"clbl_9\",\"name\":\"Unsatisfied\",\"color\":\"#38bdf8\"}]','2026-08-26 21:38:21'),(30151,'client_labels_saampark-ai-solutions','[{\"id\":\"clbl_1\",\"name\":\"50% Probability\",\"color\":\"#eab308\"},{\"id\":\"clbl_2\",\"name\":\"90% Probability\",\"color\":\"#84cc16\"},{\"id\":\"clbl_3\",\"name\":\"Call this week\",\"color\":\"#c026d3\"},{\"id\":\"clbl_4\",\"name\":\"Corporate\",\"color\":\"#d8b4fe\"},{\"id\":\"clbl_5\",\"name\":\"Inactive\",\"color\":\"#94a3b8\"},{\"id\":\"clbl_6\",\"name\":\"Potential\",\"color\":\"#3b82f6\"},{\"id\":\"clbl_7\",\"name\":\"Referral\",\"color\":\"#2dd4bf\"},{\"id\":\"clbl_8\",\"name\":\"Satisfied\",\"color\":\"#65a30d\"},{\"id\":\"clbl_9\",\"name\":\"Unsatisfied\",\"color\":\"#38bdf8\"}]','2026-08-27 02:08:24'),(30878,'payments','[{\"invoiceId\":\"INV2708260005\",\"client\":\"donald trump\",\"clientEmail\":\"lead_101@saampark.in\",\"project\":\"app\",\"paymentDate\":\"2026-08-27\",\"paymentMethod\":\"Advance (Initial Deposit)\",\"transactionRef\":\"REC_708509\",\"note\":\"Initial payment for app (1 services)\",\"amount\":\"Γé╣502\",\"amountNum\":502,\"status\":\"Completed\",\"companyId\":\"tech\",\"id\":\"P-4872\"}]','2026-08-27 04:58:28'),(31042,'orders','[{\"client\":\"donald trump\",\"clientEmail\":\"lead_101@saampark.in\",\"clientId\":\"cli_101\",\"project\":\"app\",\"orderDate\":\"2026-08-27\",\"deliveryDate\":\"2026-09-27\",\"itemsCount\":1,\"totalAmount\":\"Γé╣1,179\",\"paymentStatus\":\"Partially paid\",\"status\":\"Processing\",\"notes\":\"Order for: app. Services: Website Development.\",\"invoiceId\":\"INV2708260005\",\"id\":\"ord_1787806708466\",\"orderNumber\":\"ORD #1081\"}]','2026-08-27 04:58:28'),(32523,'companies','[{\"id\":\"tech\",\"name\":\"SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED\",\"slug\":\"tech\",\"brand_name\":\"SAAMPARK\",\"division_name\":\"TECHNOLOGY\",\"subtitle\":\"AND RESEARCH PRIVATE LIMITED\",\"industry\":\"Digital Marketing & Analytics\",\"currency\":\"INR\",\"gstin\":null,\"pan\":null,\"cin\":null,\"msme_reg\":null,\"iso_certification\":\"An ISO 9001:2015 Certified Company\",\"logo_url\":\"/saampark-logo.png\",\"address\":null,\"phone\":\"+91 9901518567 / +91 9901518569\",\"email\":\"info@saamparktechnology.com\",\"website\":null,\"status\":\"active\",\"member_count\":28,\"signatory_name\":null,\"signatory_designation\":null,\"numeric_id\":2,\"logo\":\"≡ƒôê\",\"currency_symbol\":\"Γé╣\",\"upi_id\":null,\"gst_upi_id\":null,\"nongst_upi_id\":null,\"account_holder\":null,\"gst_account_holder\":null,\"nongst_account_holder\":null,\"bank_name\":null,\"gst_bank_name\":null,\"nongst_bank_name\":null,\"account_number\":null,\"gst_account_number\":null,\"nongst_account_number\":null,\"ifsc_code\":null,\"gst_ifsc_code\":null,\"nongst_ifsc_code\":null,\"bank_branch\":null,\"gst_bank_branch\":null,\"nongst_bank_branch\":null,\"terms_conditions\":null,\"created_by\":null,\"created_at\":\"2026-08-24T15:57:53.000Z\",\"updated_at\":\"2026-08-24T15:57:53.000Z\",\"signature_image_url\":null,\"stamp_image_url\":null,\"invoice_notes\":null,\"payment_qr_url\":null,\"gst_payment_qr_url\":null,\"nongst_payment_qr_url\":null,\"city\":\"\",\"state\":\"\",\"zip\":\"\",\"country\":\"India\",\"quotation_notes\":\"This quotation is valid for 30 calendar days from the date of issuance.\",\"signature_position\":{\"x\":0,\"y\":0},\"stamp_position\":{\"x\":0,\"y\":0},\"logo_scale\":1.9,\"stamp_scale\":1,\"signature_scale\":1,\"custom_stamps\":[],\"zoom\":100,\"preview_invoice_type\":\"gst\"},{\"id\":\"consultancy\",\"name\":\"SAAMPARK CONSULTANCY SERVICE\",\"slug\":\"consultancy\",\"brand_name\":\"SAAMPARK\",\"division_name\":\"CONSULTANCY SERVICE\",\"subtitle\":\"MANAGEMENT & ADVISORY SERVICES\",\"industry\":\"Consulting\",\"currency\":\"INR\",\"gstin\":\"19AAECS3456F1Z6\",\"pan\":\"AAECS3456F\",\"cin\":\"\",\"msme_reg\":\"\",\"iso_certification\":\"An ISO 9001:2015 Certified Company\",\"logo_url\":\"\",\"address\":\"Salt Lake Sector V, Bidhannagar, Kolkata, West Bengal - 700091\",\"phone\":\"+91 9901518570\",\"email\":\"consultancy@saampark.in\",\"website\":\"www.saampark.in\",\"status\":\"active\",\"member_count\":1,\"signatory_name\":\"Authorized Signatory\",\"signatory_designation\":\"Consulting Director\",\"numeric_id\":2,\"logo\":\"≡ƒÆ╝\",\"currency_symbol\":\"Γé╣\",\"upi_id\":\"saamparkconsult@icici\",\"gst_upi_id\":\"saamparkconsult@icici\",\"nongst_upi_id\":\"saamparkconsult@icici\",\"account_holder\":\"SAAMPARK CONSULTANCY SERVICE\",\"gst_account_holder\":\"SAAMPARK CONSULTANCY SERVICE\",\"nongst_account_holder\":\"SAAMPARK CONSULTANCY SERVICE\",\"bank_name\":\"HDFC Bank Ltd\",\"gst_bank_name\":\"HDFC Bank Ltd\",\"nongst_bank_name\":\"HDFC Bank Ltd\",\"account_number\":\"50200084920194\",\"gst_account_number\":\"50200084920194\",\"nongst_account_number\":\"50200084920194\",\"ifsc_code\":\"HDFC0001234\",\"gst_ifsc_code\":\"HDFC0001234\",\"nongst_ifsc_code\":\"HDFC0001234\",\"bank_branch\":\"Bidhannagar Branch, Kolkata\",\"gst_bank_branch\":\"Bidhannagar Branch, Kolkata\",\"nongst_bank_branch\":\"Bidhannagar Branch, Kolkata\",\"terms_conditions\":\"1. All consulting engagements are initiated following signed scope of work.\\n2. Retainer fees are payable in advance.\\n3. All disputes are subject to Kolkata jurisdiction only.\"}]','2026-09-25 19:09:16'),(32727,'companies_tech','[]','2026-09-06 04:13:41'),(32729,'sub_branches_tech','[]','2026-09-06 04:13:41'),(33024,'users_c1','[{\"id\":\"4\",\"name\":\"Supriya (Super Admin)\",\"email\":\"hiisupriya@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43210\",\"password\":\"123456\",\"lastLogin\":\"2026-08-24T17:23:50.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Leads\"]},{\"id\":\"usr_admin_main\",\"name\":\"Chiranjit Mahapatra\",\"email\":\"saamparktechnologyresearch@gmail.com\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43211\",\"password\":\"admin123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_team_rakhi\",\"name\":\"Rakhi Ghosh\",\"email\":\"rakhighosh25899@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Support\",\"phone\":\"+91 98765 43212\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"23\",\"name\":\"Assigned Tech Admin\",\"email\":\"assigned_admin_tech@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"20\",\"name\":\"Ananya Roy (Marketing Specialist)\",\"email\":\"ananya.marketing@saampark.in\",\"role\":\"Clients\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Sales\",\"Projects\",\"Messages\",\"Tickets\",\"Settings\"]},{\"id\":\"19\",\"name\":\"kututcgc\",\"email\":\"jfyfhvhfjcj@mail\",\"role\":\"Admin\",\"companyId\":\"saampark-ai-solutions\",\"companyIds\":[\"saampark-ai-solutions\",\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"18\",\"name\":\"Rohit Sharma (Dev Lead)\",\"email\":\"rohit.dev@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Cloud & Infrastructure Architecture\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":false,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"]}},{\"id\":\"17\",\"name\":\"Acme Corp (Client)\",\"email\":\"client@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"kycStatus\":\"Pending\"},{\"id\":\"16\",\"name\":\"Aman Verma (Senior Ops Lead)\",\"email\":\"team@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"+91 98765 43212\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"15\",\"name\":\"Vikram Malhotra (Admin)\",\"email\":\"admin@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43211\",\"password\":\"admin123\",\"lastLogin\":\"2026-08-24T17:02:47.000Z\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"6\",\"name\":\"Browser Test User\",\"email\":\"browser.test@saampark.in\",\"role\":\"Teams\",\"companyId\":\"0\",\"companyIds\":[\"0\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 96543 21098\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-21T16:33:47.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"5\",\"name\":\"Test Operator\",\"email\":\"test.operator@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-21\"},{\"id\":\"2\",\"name\":\"Team\",\"email\":\"supriyogod@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"caller\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T19:56:10.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\",\"Users\"],\"kycStatus\":\"Pending\"},{\"id\":\"usr_saampark_group_team\",\"name\":\"SAAMPARK Group Team\",\"email\":\"saamparkgroup@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Lead Operations\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_cli_cli_101\",\"name\":\"donald trump\",\"email\":\"lead_101@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyName\":\"donald trump\",\"status\":\"Active\",\"department\":\"Clients\",\"phone\":\"+91 98765-43210\",\"password\":\"Password123\",\"lastLogin\":\"Just now\",\"joinedDate\":\"2026-08-27\",\"companyIds\":[\"tech\"],\"kycStatus\":\"Pending\"}]','2026-09-07 04:36:48'),(36470,'estimates_tech','[{\"client\":\"donald trump\",\"clientEmail\":\"lead_101@saampark.in\",\"title\":\"E-Commerce Web Portal\",\"date\":\"12/09/2026\",\"validUntil\":\"12/10/2026\",\"services\":[{\"id\":\"s1\",\"name\":\"UI/UX Design & Wireframing\",\"description\":\"Design systems, high fidelity mockups\",\"quantity\":1,\"unitPrice\":25000,\"total\":25000},{\"id\":\"s2\",\"name\":\"Frontend Development\",\"description\":\"Responsive Next.js React components\",\"quantity\":1,\"unitPrice\":45000,\"total\":45000}],\"subtotal\":70000,\"gstRate\":18,\"gstAmount\":12600,\"totalAmount\":82600,\"formattedTotal\":\"Γé╣82,600\",\"status\":\"Sent\",\"notes\":\"Terms: 50% advance on approval, balance on final delivery.\",\"createdAdmin\":\"Supriya (Super Admin)\",\"companyId\":\"tech\",\"id\":\"est_1789207422614\",\"estimateNumber\":\"EST #101\"}]','2026-09-12 10:03:43'),(37154,'branches','[{\"id\":\"br-1\",\"company_id\":1,\"name\":\"Head Office - Mumbai & Kolkata Technology Center\",\"code\":\"STR-HO\",\"city\":\"Mumbai / Kolkata\",\"state\":\"Maharashtra / West Bengal\",\"country\":\"India\",\"phone\":\"+91 9901518567\",\"email\":\"ho@saamparktechnology.com\",\"manager_name\":\"Supriya Kumar\",\"status\":\"Active\",\"user_count\":14,\"companyId\":1,\"managerName\":\"Supriya Kumar\"},{\"id\":\"1\",\"numeric_id\":1,\"companyId\":1,\"name\":\"Head Office - Mumbai & Kolkata Technology Center\",\"code\":\"HO-MUM-01\",\"brand_name\":\"SAAMPARK\",\"division_name\":\"ENTERPRISE DIGITAL LABS\",\"subtitle\":\"CLOUD ARCHITECTURE & ENTERPRISE ERP DIVISION\",\"address\":\"Unit 402, Technology Park, Sector V, Salt Lake, Kolkata, West Bengal - 700091\",\"city\":\"Kolkata\",\"state\":\"West Bengal\",\"country\":\"India\",\"phone\":\"+91 99015 18567\",\"email\":\"ho.technology@saampark.in\",\"website\":\"www.saamparktechnology.com\",\"gstin\":\"19AALCS1234F1Z8\",\"pan\":\"AALCS1234F\",\"cin\":\"U72200WB2020PTC238912\",\"bank_name\":\"HDFC Bank Ltd\",\"account_holder\":\"SAAMPARK Technology\",\"account_number\":\"50200084920194\",\"ifsc_code\":\"HDFC0001234\",\"bank_branch\":\"Salt Lake Sector V Branch\",\"upi_id\":\"saampark@hdfcbank\",\"signatory_name\":\"Anirban Chatterjee\",\"signatory_designation\":\"Branch Director & VP Engineering\",\"status\":\"Active\",\"company_id\":1,\"manager_id\":null,\"is_active\":1,\"created_at\":\"2026-09-06T17:01:05.000Z\",\"updated_at\":\"2026-09-12T15:39:05.000Z\",\"msme_reg\":null,\"signature_image_url\":null,\"stamp_image_url\":null,\"terms_conditions\":null,\"invoice_notes\":null,\"payment_qr_url\":null,\"gst_bank_name\":null,\"gst_account_holder\":null,\"gst_account_number\":null,\"gst_ifsc_code\":null,\"gst_bank_branch\":null,\"gst_upi_id\":null,\"gst_payment_qr_url\":null,\"nongst_bank_name\":null,\"nongst_account_holder\":null,\"nongst_account_number\":null,\"nongst_ifsc_code\":null,\"nongst_bank_branch\":null,\"nongst_upi_id\":null,\"nongst_payment_qr_url\":null,\"manager_name\":null,\"sub_branch_count\":1,\"user_count\":11},{\"id\":2,\"company_id\":1,\"name\":\"Branch - Delhi\",\"code\":\"BR-DEL\",\"address\":null,\"city\":\"Delhi\",\"state\":\"Delhi\",\"country\":\"India\",\"phone\":null,\"email\":null,\"manager_id\":null,\"is_active\":1,\"created_at\":\"2026-09-06T17:01:50.000Z\",\"updated_at\":\"2026-09-06T17:01:50.000Z\",\"manager_name\":null,\"sub_branch_count\":0,\"user_count\":0,\"companyId\":1,\"brand_name\":null,\"division_name\":null,\"subtitle\":null,\"gstin\":null,\"pan\":null,\"cin\":null,\"msme_reg\":null,\"website\":null,\"signatory_name\":null,\"signatory_designation\":null,\"signature_image_url\":null,\"stamp_image_url\":null,\"terms_conditions\":null,\"invoice_notes\":null,\"upi_id\":null,\"account_holder\":null,\"bank_name\":null,\"account_number\":null,\"ifsc_code\":null,\"bank_branch\":null,\"payment_qr_url\":null,\"gst_bank_name\":null,\"gst_account_holder\":null,\"gst_account_number\":null,\"gst_ifsc_code\":null,\"gst_bank_branch\":null,\"gst_upi_id\":null,\"gst_payment_qr_url\":null,\"nongst_bank_name\":null,\"nongst_account_holder\":null,\"nongst_account_number\":null,\"nongst_ifsc_code\":null,\"nongst_bank_branch\":null,\"nongst_upi_id\":null,\"nongst_payment_qr_url\":null}]','2026-09-25 19:09:16'),(37155,'branches_tech','[{\"id\":\"1\",\"numeric_id\":1,\"companyId\":\"tech\",\"name\":\"Head Office - Mumbai & Kolkata Technology Center\",\"code\":\"HO-MUM-01\",\"brand_name\":\"SAAMPARK\",\"division_name\":\"ENTERPRISE DIGITAL LABS\",\"subtitle\":\"CLOUD ARCHITECTURE & ENTERPRISE ERP DIVISION\",\"address\":\"Unit 402, Technology Park, Sector V, Salt Lake, Kolkata, West Bengal - 700091\",\"city\":\"Kolkata\",\"state\":\"West Bengal\",\"country\":\"India\",\"phone\":\"+91 99015 18567\",\"email\":\"ho.technology@saampark.in\",\"website\":\"www.saamparktechnology.com\",\"gstin\":\"19AALCS1234F1Z8\",\"pan\":\"AALCS1234F\",\"cin\":\"U72200WB2020PTC238912\",\"bank_name\":\"HDFC Bank Ltd\",\"account_holder\":\"SAAMPARK Technology\",\"account_number\":\"50200084920194\",\"ifsc_code\":\"HDFC0001234\",\"bank_branch\":\"Salt Lake Sector V Branch\",\"upi_id\":\"saampark@hdfcbank\",\"signatory_name\":\"Anirban Chatterjee\",\"signatory_designation\":\"Branch Director & VP Engineering\",\"status\":\"Active\"}]','2026-09-12 15:39:05'),(37156,'users','[{\"id\":\"4\",\"name\":\"Supriya (Super Admin)\",\"email\":\"hiisupriya@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43210\",\"password\":\"123456\",\"lastLogin\":\"2026-08-24T17:23:50.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Leads\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Messages\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Leads\"]}},{\"id\":\"usr_root_super_admin\",\"name\":\"Supriya (Super Admin)\",\"email\":\"saampark.official@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\",\"consultancy\"],\"companyName\":\"SAAMPARK Group (All Companies)\",\"status\":\"Active\",\"department\":\"Executive Management\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"37\",\"name\":\"Verified User Creation\",\"email\":\"verifieduser@saampark.in\",\"role\":\"Teams\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Marketing\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"kycStatus\":\"Pending\",\"permissions\":null},{\"id\":\"36\",\"name\":\"Localhost Test User\",\"email\":\"localtestuser1@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Engineering\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"kycStatus\":\"Pending\",\"permissions\":{\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"actionMatrix\":{\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Quotations\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Sales Orders\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Invoices\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Credit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Debit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Services & Store\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"EMI\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Teams\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Attendance\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Leave\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payroll\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Companies\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Branches\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Departments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Permissions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Activity Logs\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false}}}},{\"id\":\"35\",\"name\":\"Test New User\",\"email\":\"testnewuser999@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Engineering\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"kycStatus\":\"Pending\",\"permissions\":null},{\"id\":\"16\",\"name\":\"Aman Verma (Senior Ops Lead)\",\"email\":\"team@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"15\",\"name\":\"Vikram Malhotra (Admin)\",\"email\":\"admin@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T17:02:47.000Z\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"usr_admin_main\",\"name\":\"Chiranjit Mahapatra\",\"email\":\"saamparktechnologyresearch@gmail.com\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43211\",\"password\":\"admin123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_team_rakhi\",\"name\":\"Rakhi Ghosh\",\"email\":\"rakhighosh25899@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Support\",\"phone\":\"+91 98765 43212\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"23\",\"name\":\"Assigned Tech Admin\",\"email\":\"assigned_admin_tech@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"20\",\"name\":\"Ananya Roy (Marketing Specialist)\",\"email\":\"ananya.marketing@saampark.in\",\"role\":\"Clients\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Sales\",\"Projects\",\"Messages\",\"Tickets\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Leads\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Sales\",\"Projects\",\"Messages\",\"Tickets\",\"Settings\"]}},{\"id\":\"19\",\"name\":\"kututcgc\",\"email\":\"jfyfhvhfjcj@mail\",\"role\":\"Admin\",\"companyId\":\"saampark-ai-solutions\",\"companyIds\":[\"saampark-ai-solutions\",\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"18\",\"name\":\"Rohit Sharma (Dev Lead)\",\"email\":\"rohit.dev@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Cloud & Infrastructure Architecture\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":false,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"]}},{\"id\":\"17\",\"name\":\"Acme Corp (Client)\",\"email\":\"client@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"kycStatus\":\"Pending\"},{\"id\":\"6\",\"name\":\"Browser Test User\",\"email\":\"browser.test@saampark.in\",\"role\":\"Teams\",\"companyId\":\"0\",\"companyIds\":[\"0\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 96543 21098\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-21T16:33:47.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Dashboard\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"5\",\"name\":\"Test Operator\",\"email\":\"test.operator@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-21\",\"kycStatus\":\"Pending\"},{\"id\":\"2\",\"name\":\"Team\",\"email\":\"supriyogod@gmail.com\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"caller\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T19:56:10.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\",\"Users\"],\"kycStatus\":\"Pending\"},{\"id\":\"usr_saampark_group_team\",\"name\":\"SAAMPARK Group Team\",\"email\":\"saamparkgroup@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Lead Operations\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_cli_cli_101\",\"name\":\"donald trump\",\"email\":\"lead_101@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyName\":\"donald trump\",\"status\":\"Active\",\"department\":\"Clients\",\"phone\":\"+91 98765-43210\",\"password\":\"Password123\",\"lastLogin\":\"Just now\",\"joinedDate\":\"2026-08-27\",\"companyIds\":[\"tech\"],\"kycStatus\":\"Pending\"},{\"id\":\"34\",\"name\":\"Mumbai User by Mumbai Branch Admin\",\"email\":\"mumbai_user_1788719320285@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"32\",\"name\":\"Authorized Tech Client\",\"email\":\"authorized_client_1788719316769@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"31\",\"name\":\"Authorized Tech Team Member\",\"email\":\"authorized_team_1788719314041@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"29\",\"name\":\"Test Field Team Member\",\"email\":\"fieldteam_test_1788719311488@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"28\",\"name\":\"Test Tech Admin\",\"email\":\"techadmin_test_1788719308980@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"27\",\"name\":\"Mumbai User by Mumbai Branch Admin\",\"email\":\"mumbai_user_1788719220346@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"26\",\"name\":\"Branch Admin Mumbai\",\"email\":\"branch_admin_mumbai@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"25\",\"name\":\"Authorized Tech Client\",\"email\":\"authorized_client_1788719216282@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"24\",\"name\":\"Authorized Tech Team Member\",\"email\":\"authorized_team_1788719213140@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"22\",\"name\":\"Test Field Team Member\",\"email\":\"fieldteam_test_1788719208810@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"21\",\"name\":\"Test Tech Admin\",\"email\":\"techadmin_test_1788719202360@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"1\",\"name\":\"Supriya Naskar\",\"email\":\"supriyo.main@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"9547110730\",\"lastLogin\":\"2026-08-24T16:07:51.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Notes\",\"Messages\",\"Tickets\",\"Knowledge base\",\"Files\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Dashboard\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Notes\",\"Messages\",\"Tickets\",\"Knowledge base\",\"Files\"]}}]','2026-09-25 19:09:20'),(37157,'invoices','[{\"id\":\"INV-2026-HO01\",\"client\":\"Acme Corp (Client)\",\"clientEmail\":\"client@saampark.in\",\"project\":\"Cloud ERP & Enterprise AI Integration\",\"billDate\":\"12-09-2026\",\"dueDate\":\"26-09-2026\",\"baseAmount\":150000,\"gstRate\":18,\"gstAmount\":27000,\"totalInvoiced\":\"Γé╣1,77,000\",\"paymentReceived\":\"Γé╣0\",\"due\":\"Γé╣1,77,000\",\"status\":\"Not paid\",\"billedBy\":\"Anirban Chatterjee (Branch Director)\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK Technology\",\"branchId\":\"1\",\"branchName\":\"Head Office - Mumbai & Kolkata Technology Center\",\"branchCode\":\"HO-MUM-01\",\"items\":[{\"id\":\"item_1\",\"serviceName\":\"Enterprise Cloud ERP Platform & Multi-Branch Setup\",\"rate\":100000,\"qty\":1,\"unit\":\"System\",\"charges\":[],\"gstRate\":18,\"gstAmount\":18000,\"totalAmount\":118000},{\"id\":\"item_2\",\"serviceName\":\"Real-time AI Pipeline & Predictive Data Sync\",\"rate\":50000,\"qty\":1,\"unit\":\"Module\",\"charges\":[],\"gstRate\":18,\"gstAmount\":9000,\"totalAmount\":59000}]},{\"id\":\"INV2708260005\",\"client\":\"donald trump\",\"clientEmail\":\"lead_101@saampark.in\",\"clientId\":\"cli_101\",\"project\":\"app\",\"billDate\":\"2026-08-27\",\"dueDate\":\"2026-09-27\",\"baseAmount\":999,\"setupCharge\":0,\"discount\":0,\"gstRate\":18,\"gstAmount\":180,\"totalInvoiced\":\"Γé╣1,179\",\"paymentReceived\":\"Γé╣502\",\"due\":\"Γé╣677\",\"status\":\"Partially paid\",\"billedBy\":\"Supriya Naskar\",\"items\":[{\"id\":\"svc_1787806687350\",\"serviceName\":\"Website Development\",\"sacCode\":\"998313\",\"qty\":1,\"unit\":\"Project\",\"rate\":999,\"charges\":[],\"gstRate\":18,\"gstAmount\":180,\"totalAmount\":1179}],\"discountsList\":[],\"companyId\":\"tech\"}]','2026-09-12 15:39:05'),(37158,'invoices_tech','[{\"id\":\"INV-2026-HO01\",\"client\":\"Acme Corp (Client)\",\"clientEmail\":\"client@saampark.in\",\"project\":\"Cloud ERP & Enterprise AI Integration\",\"billDate\":\"12-09-2026\",\"dueDate\":\"26-09-2026\",\"baseAmount\":150000,\"gstRate\":18,\"gstAmount\":27000,\"totalInvoiced\":\"Γé╣1,77,000\",\"paymentReceived\":\"Γé╣0\",\"due\":\"Γé╣1,77,000\",\"status\":\"Not paid\",\"billedBy\":\"Anirban Chatterjee (Branch Director)\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK Technology\",\"branchId\":\"1\",\"branchName\":\"Head Office - Mumbai & Kolkata Technology Center\",\"branchCode\":\"HO-MUM-01\",\"items\":[{\"id\":\"item_1\",\"serviceName\":\"Enterprise Cloud ERP Platform & Multi-Branch Setup\",\"rate\":100000,\"qty\":1,\"unit\":\"System\",\"charges\":[],\"gstRate\":18,\"gstAmount\":18000,\"totalAmount\":118000},{\"id\":\"item_2\",\"serviceName\":\"Real-time AI Pipeline & Predictive Data Sync\",\"rate\":50000,\"qty\":1,\"unit\":\"Module\",\"charges\":[],\"gstRate\":18,\"gstAmount\":9000,\"totalAmount\":59000}]}]','2026-09-12 15:39:05'),(37745,'activity_logs','[{\"id\":\"act-1790360243437-6yf6\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED\",\"module\":\"Users\",\"action\":\"User Account Updated\",\"description\":\"User account \\\"Supriya (Super Admin)\\\" profile details updated\",\"type\":\"user\",\"timestamp\":\"2026-09-25T18:17:23.437Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: hiisupriya@gmail.com | Role: Super Admin\"},{\"id\":\"act-1789846567488-p612\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK TECHNOLOGY\",\"module\":\"Users\",\"action\":\"User Account Updated\",\"description\":\"User account \\\"Supriya (Super Admin)\\\" profile details updated\",\"type\":\"user\",\"timestamp\":\"2026-09-19T19:36:07.488Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: hiisupriya@gmail.com | Role: Super Admin\"},{\"id\":\"act-1789833620052-57xs\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK TECHNOLOGY\",\"module\":\"Users\",\"action\":\"User Account Updated\",\"description\":\"User account \\\"Supriya (Super Admin)\\\" profile details updated\",\"type\":\"user\",\"timestamp\":\"2026-09-19T16:00:20.052Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: hiisupriya@gmail.com | Role: Super Admin\"},{\"id\":\"act-1789833607338-p7g7\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK TECHNOLOGY\",\"module\":\"Users\",\"action\":\"User Account Updated\",\"description\":\"User account \\\"Supriya (Super Admin)\\\" profile details updated\",\"type\":\"user\",\"timestamp\":\"2026-09-19T16:00:07.338Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: hiisupriya@gmail.com | Role: Super Admin\"},{\"id\":\"act-1789824760911-cn0t\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK TECHNOLOGY\",\"module\":\"Users\",\"action\":\"User Account Updated\",\"description\":\"User account \\\"Supriya (Super Admin)\\\" profile details updated\",\"type\":\"user\",\"timestamp\":\"2026-09-19T13:32:40.911Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: hiisupriya@gmail.com | Role: Super Admin\"},{\"id\":\"act-1789628340099-8qc5\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK TECHNOLOGY\",\"module\":\"Users\",\"action\":\"User Account Registered\",\"description\":\"New user account \\\"Localhost Test User\\\" (Teams) registered\",\"type\":\"user\",\"timestamp\":\"2026-09-17T06:59:00.099Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: localtestuser1@saampark.in | Role: Teams | Department: Engineering\"},{\"id\":\"act-1789627819210-2nw1\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK TECHNOLOGY\",\"module\":\"Users\",\"action\":\"User Account Updated\",\"description\":\"User account \\\"Supriya (Super Admin)\\\" profile details updated\",\"type\":\"user\",\"timestamp\":\"2026-09-17T06:50:19.210Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: hiisupriya@gmail.com | Role: Super Admin\"},{\"id\":\"act-1789443566140-q3pg\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK Technology\",\"module\":\"Users\",\"action\":\"User Account Updated\",\"description\":\"User account \\\"Supriya (Super Admin)\\\" profile details updated\",\"type\":\"user\",\"timestamp\":\"2026-09-15T03:39:26.140Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: hiisupriya@gmail.com | Role: Super Admin\"},{\"id\":\"act-1789424677942-7z3h\",\"companyId\":\"tech\",\"companyName\":\"SAAMPARK TECHNOLOGY\",\"module\":\"Users\",\"action\":\"User Account Updated\",\"description\":\"User account \\\"Supriya (Super Admin)\\\" profile details updated\",\"type\":\"user\",\"timestamp\":\"2026-09-14T22:24:37.942Z\",\"userName\":\"Supriya (Super Admin)\",\"userEmail\":\"hiisupriya@gmail.com\",\"userRole\":\"Super Admin\",\"details\":\"Email: hiisupriya@gmail.com | Role: Super Admin\"}]','2026-09-25 18:17:23'),(37800,'users_consultancy','[{\"id\":\"usr_root_super_admin\",\"name\":\"Supriya (Super Admin)\",\"email\":\"saampark.official@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\",\"consultancy\"],\"companyName\":\"SAAMPARK Group (All Companies)\",\"status\":\"Active\",\"department\":\"Executive Management\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"37\",\"name\":\"Verified User Creation\",\"email\":\"verifieduser@saampark.in\",\"role\":\"Teams\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Marketing\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"kycStatus\":\"Pending\",\"permissions\":null},{\"id\":\"36\",\"name\":\"Localhost Test User\",\"email\":\"localtestuser1@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Engineering\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"kycStatus\":\"Pending\",\"permissions\":{\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"actionMatrix\":{\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Quotations\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Sales Orders\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Invoices\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Credit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Debit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Services & Store\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"EMI\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Teams\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Attendance\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Leave\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payroll\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Companies\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Branches\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Departments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Permissions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Activity Logs\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false}}}},{\"id\":\"35\",\"name\":\"Test New User\",\"email\":\"testnewuser999@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Engineering\",\"phone\":\"9876543210\",\"password\":\"Password123\",\"lastLogin\":\"Just created\",\"joinedDate\":\"2026-09-17\",\"kycStatus\":\"Pending\",\"permissions\":null},{\"id\":\"16\",\"name\":\"Aman Verma (Senior Ops Lead)\",\"email\":\"team@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"15\",\"name\":\"Vikram Malhotra (Admin)\",\"email\":\"admin@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T17:02:47.000Z\",\"joinedDate\":\"2026-08-24\"},{\"id\":\"usr_admin_main\",\"name\":\"Chiranjit Mahapatra\",\"email\":\"saamparktechnologyresearch@gmail.com\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 98765 43211\",\"password\":\"admin123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_team_rakhi\",\"name\":\"Rakhi Ghosh\",\"email\":\"rakhighosh25899@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Support\",\"phone\":\"+91 98765 43212\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"23\",\"name\":\"Assigned Tech Admin\",\"email\":\"assigned_admin_tech@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"20\",\"name\":\"Ananya Roy (Marketing Specialist)\",\"email\":\"ananya.marketing@saampark.in\",\"role\":\"Clients\",\"companyId\":\"digital\",\"companyIds\":[\"digital\"],\"companyName\":\"SAAMPARK Digital Marketing\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Sales\",\"Projects\",\"Messages\",\"Tickets\",\"Settings\"]},{\"id\":\"19\",\"name\":\"kututcgc\",\"email\":\"jfyfhvhfjcj@mail\",\"role\":\"Admin\",\"companyId\":\"saampark-ai-solutions\",\"companyIds\":[\"saampark-ai-solutions\",\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"Software Engineering\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}},{\"id\":\"18\",\"name\":\"Rohit Sharma (Dev Lead)\",\"email\":\"rohit.dev@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Cloud & Infrastructure Architecture\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"],\"kycStatus\":\"Pending\",\"permissions\":{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":false,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"]}},{\"id\":\"17\",\"name\":\"Acme Corp (Client)\",\"email\":\"client@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-24\",\"kycStatus\":\"Pending\"},{\"id\":\"6\",\"name\":\"Browser Test User\",\"email\":\"browser.test@saampark.in\",\"role\":\"Teams\",\"companyId\":\"0\",\"companyIds\":[\"0\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Operations\",\"phone\":\"+91 96543 21098\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-21T16:33:47.000Z\",\"joinedDate\":\"2026-08-21\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]},{\"id\":\"5\",\"name\":\"Test Operator\",\"email\":\"test.operator@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-08-21\"},{\"id\":\"2\",\"name\":\"Team\",\"email\":\"supriyogod@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"saampark-ai-solutions\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"caller\",\"phone\":\"\",\"password\":\"Password123\",\"lastLogin\":\"2026-08-24T19:56:10.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\",\"Users\"],\"kycStatus\":\"Pending\"},{\"id\":\"usr_saampark_group_team\",\"name\":\"SAAMPARK Group Team\",\"email\":\"saamparkgroup@gmail.com\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Technology\",\"status\":\"Active\",\"department\":\"Sales & Lead Operations\",\"phone\":\"+91 98765 43210\",\"password\":\"Password123\",\"lastLogin\":\"Active Session\",\"joinedDate\":\"2024-01-01\"},{\"id\":\"usr_cli_cli_101\",\"name\":\"donald trump\",\"email\":\"lead_101@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyName\":\"donald trump\",\"status\":\"Active\",\"department\":\"Clients\",\"phone\":\"+91 98765-43210\",\"password\":\"Password123\",\"lastLogin\":\"Just now\",\"joinedDate\":\"2026-08-27\",\"companyIds\":[\"tech\"],\"kycStatus\":\"Pending\"},{\"id\":\"34\",\"name\":\"Mumbai User by Mumbai Branch Admin\",\"email\":\"mumbai_user_1788719320285@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"32\",\"name\":\"Authorized Tech Client\",\"email\":\"authorized_client_1788719316769@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"31\",\"name\":\"Authorized Tech Team Member\",\"email\":\"authorized_team_1788719314041@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"29\",\"name\":\"Test Field Team Member\",\"email\":\"fieldteam_test_1788719311488@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"28\",\"name\":\"Test Tech Admin\",\"email\":\"techadmin_test_1788719308980@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"27\",\"name\":\"Mumbai User by Mumbai Branch Admin\",\"email\":\"mumbai_user_1788719220346@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"26\",\"name\":\"Branch Admin Mumbai\",\"email\":\"branch_admin_mumbai@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"25\",\"name\":\"Authorized Tech Client\",\"email\":\"authorized_client_1788719216282@saampark.in\",\"role\":\"Clients\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"24\",\"name\":\"Authorized Tech Team Member\",\"email\":\"authorized_team_1788719213140@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"22\",\"name\":\"Test Field Team Member\",\"email\":\"fieldteam_test_1788719208810@saampark.in\",\"role\":\"Teams\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"21\",\"name\":\"Test Tech Admin\",\"email\":\"techadmin_test_1788719202360@saampark.in\",\"role\":\"Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\"],\"companyName\":\"SAAMPARK Technology\",\"branchId\":1,\"branchName\":\"Head Office - Mumbai\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"\",\"lastLogin\":\"Active session\",\"joinedDate\":\"2026-09-06\",\"kycStatus\":\"Pending\"},{\"id\":\"1\",\"name\":\"Supriya Naskar\",\"email\":\"supriyo.main@gmail.com\",\"role\":\"Super Admin\",\"companyId\":\"tech\",\"companyIds\":[\"tech\",\"digital\"],\"companyName\":\"SAAMPARK Group (Multiple)\",\"status\":\"Active\",\"department\":\"General\",\"phone\":\"9547110730\",\"lastLogin\":\"2026-08-24T16:07:51.000Z\",\"joinedDate\":\"2026-08-19\",\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Notes\",\"Messages\",\"Tickets\",\"Knowledge base\",\"Files\"],\"kycStatus\":\"Pending\"}]','2026-09-25 18:17:22'),(37845,'sub_branches','[{\"id\":1,\"branch_id\":1,\"company_id\":1,\"name\":\"Andheri Franchise\",\"code\":\"SB-AND-01\",\"address\":null,\"city\":null,\"state\":null,\"phone\":null,\"email\":null,\"manager_id\":null,\"is_active\":1,\"created_at\":\"2026-09-06T18:26:41.000Z\",\"updated_at\":\"2026-09-06T18:26:41.000Z\",\"branch_name\":\"Head Office - Mumbai & Kolkata Technology Center\",\"manager_name\":null}]','2026-09-25 19:09:16');
/*!40000 ALTER TABLE `app_data` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `action` varchar(255) NOT NULL,
  `module` varchar(100) DEFAULT NULL,
  `record_id` int(11) DEFAULT NULL,
  `old_values` text DEFAULT NULL,
  `new_values` text DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `automation_rules`
--

DROP TABLE IF EXISTS `automation_rules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `automation_rules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `trigger_module` varchar(100) NOT NULL,
  `trigger_event` varchar(100) NOT NULL,
  `conditions` text DEFAULT NULL,
  `actions` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `last_run_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `automation_rules_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `automation_rules`
--

LOCK TABLES `automation_rules` WRITE;
/*!40000 ALTER TABLE `automation_rules` DISABLE KEYS */;
/*!40000 ALTER TABLE `automation_rules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bank_accounts`
--

DROP TABLE IF EXISTS `bank_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bank_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `bank_name` varchar(200) NOT NULL,
  `account_holder` varchar(200) DEFAULT NULL,
  `account_number` varchar(100) NOT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `branch` varchar(150) DEFAULT NULL,
  `opening_balance` decimal(12,2) DEFAULT 0.00,
  `current_balance` decimal(12,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `bank_accounts_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bank_accounts`
--

LOCK TABLES `bank_accounts` WRITE;
/*!40000 ALTER TABLE `bank_accounts` DISABLE KEYS */;
INSERT INTO `bank_accounts` VALUES (1,1,'HDFC Bank Ltd','SAAMPARK Technology Pvt Ltd','50200012345678','HDFC0001234','Connaught Place, New Delhi',250000.00,250000.00,'active','2026-09-11 06:24:28','2026-09-11 06:24:28'),(2,1,'ICICI Bank','SAAMPARK Technology Pvt Ltd','000105001234','ICIC0000001','Sector 18, Noida',180000.00,180000.00,'active','2026-09-11 06:24:28','2026-09-11 06:24:28'),(3,1,'State Bank of India','SAAMPARK Technology Pvt Ltd','30012345678','SBIN0000691','Parliament Street, New Delhi',95000.00,95000.00,'active','2026-09-11 06:24:28','2026-09-11 06:24:28');
/*!40000 ALTER TABLE `bank_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `branches`
--

DROP TABLE IF EXISTS `branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `branches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `brand_name` varchar(150) DEFAULT NULL,
  `division_name` varchar(150) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `gstin` varchar(50) DEFAULT NULL,
  `pan` varchar(50) DEFAULT NULL,
  `cin` varchar(50) DEFAULT NULL,
  `msme_reg` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `signatory_name` varchar(150) DEFAULT NULL,
  `signatory_designation` varchar(150) DEFAULT NULL,
  `signature_image_url` longtext DEFAULT NULL,
  `stamp_image_url` longtext DEFAULT NULL,
  `terms_conditions` longtext DEFAULT NULL,
  `invoice_notes` longtext DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `account_holder` varchar(150) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `bank_branch` varchar(150) DEFAULT NULL,
  `payment_qr_url` longtext DEFAULT NULL,
  `gst_bank_name` varchar(150) DEFAULT NULL,
  `gst_account_holder` varchar(150) DEFAULT NULL,
  `gst_account_number` varchar(100) DEFAULT NULL,
  `gst_ifsc_code` varchar(50) DEFAULT NULL,
  `gst_bank_branch` varchar(150) DEFAULT NULL,
  `gst_upi_id` varchar(100) DEFAULT NULL,
  `gst_payment_qr_url` longtext DEFAULT NULL,
  `nongst_bank_name` varchar(150) DEFAULT NULL,
  `nongst_account_holder` varchar(150) DEFAULT NULL,
  `nongst_account_number` varchar(100) DEFAULT NULL,
  `nongst_ifsc_code` varchar(50) DEFAULT NULL,
  `nongst_bank_branch` varchar(150) DEFAULT NULL,
  `nongst_upi_id` varchar(100) DEFAULT NULL,
  `nongst_payment_qr_url` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `branches_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `branches`
--

LOCK TABLES `branches` WRITE;
/*!40000 ALTER TABLE `branches` DISABLE KEYS */;
INSERT INTO `branches` VALUES (1,1,'Head Office - Mumbai & Kolkata Technology Center','HO-MUM-01','Unit 402, Technology Park, Sector V, Salt Lake, Kolkata, West Bengal - 700091','Kolkata','West Bengal','India','+91 99015 18567','ho.technology@saampark.in',NULL,1,'2026-09-06 17:01:05','2026-09-12 15:39:05',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,1,'Branch - Delhi','BR-DEL',NULL,'Delhi','Delhi','India',NULL,NULL,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,2,'Head Office - Kolkata','HO-KOL',NULL,'Kolkata','West Bengal','India',NULL,NULL,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(5,3,'Head Office - Bengaluru','HO-BLR','Electronic City, Bengaluru, Karnataka - 560100','Bengaluru',NULL,'India',NULL,NULL,NULL,1,'2026-09-12 02:18:46','2026-09-12 02:18:46',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `brands` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `logo_url` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `brands_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,1,'HP Enterprise','https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=100&auto=format&fit=crop','Printers and enterprise computers',1,'2026-09-11 06:24:28','2026-09-11 06:24:28'),(2,1,'Canon Professional','https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=100&auto=format&fit=crop','High-speed digital printing equipment',1,'2026-09-11 06:24:28','2026-09-11 06:24:28'),(3,1,'Dell Technologies','https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=100&auto=format&fit=crop','Laptops, workstations and monitors',1,'2026-09-11 06:24:28','2026-09-11 06:24:28'),(4,1,'Saampark Brands','https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop','In-house certified printing and packaging',1,'2026-09-11 06:24:28','2026-09-11 06:24:28');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calls`
--

DROP TABLE IF EXISTS `calls`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `calls` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `direction` varchar(20) DEFAULT 'outbound',
  `phone_number` varchar(50) DEFAULT NULL,
  `duration` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `outcome` varchar(100) DEFAULT NULL,
  `called_by` int(11) DEFAULT NULL,
  `call_date` datetime DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `calls_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calls`
--

LOCK TABLES `calls` WRITE;
/*!40000 ALTER TABLE `calls` DISABLE KEYS */;
/*!40000 ALTER TABLE `calls` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `campaigns`
--

DROP TABLE IF EXISTS `campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `created_by` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `campaign_type` enum('email','sms','whatsapp') NOT NULL,
  `status` enum('draft','scheduled','sent','failed') DEFAULT 'draft',
  `scheduled_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `campaigns_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `campaigns`
--

LOCK TABLES `campaigns` WRITE;
/*!40000 ALTER TABLE `campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chart_of_accounts`
--

DROP TABLE IF EXISTS `chart_of_accounts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `chart_of_accounts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `account_code` varchar(50) NOT NULL,
  `account_name` varchar(200) NOT NULL,
  `account_type` varchar(50) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `balance` decimal(14,2) DEFAULT 0.00,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `chart_of_accounts_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chart_of_accounts`
--

LOCK TABLES `chart_of_accounts` WRITE;
/*!40000 ALTER TABLE `chart_of_accounts` DISABLE KEYS */;
/*!40000 ALTER TABLE `chart_of_accounts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `communication_logs`
--

DROP TABLE IF EXISTS `communication_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `communication_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `user_id` int(11) NOT NULL,
  `channel` enum('email','call','whatsapp','meeting','sms') NOT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `lead_id` (`lead_id`),
  KEY `customer_id` (`customer_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `communication_logs_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `communication_logs_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `communication_logs_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `communication_logs`
--

LOCK TABLES `communication_logs` WRITE;
/*!40000 ALTER TABLE `communication_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `communication_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `companies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(150) NOT NULL,
  `slug` varchar(100) NOT NULL,
  `currency` varchar(10) DEFAULT 'INR',
  `currency_symbol` varchar(5) DEFAULT 'Rs',
  `logo_url` text DEFAULT NULL,
  `address` text DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `brand_name` varchar(150) DEFAULT NULL,
  `division_name` varchar(150) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `gstin` varchar(50) DEFAULT NULL,
  `pan` varchar(50) DEFAULT NULL,
  `cin` varchar(50) DEFAULT NULL,
  `msme_reg` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `signatory_name` varchar(150) DEFAULT NULL,
  `signatory_designation` varchar(150) DEFAULT NULL,
  `signature_image_url` longtext DEFAULT NULL,
  `stamp_image_url` longtext DEFAULT NULL,
  `terms_conditions` longtext DEFAULT NULL,
  `invoice_notes` longtext DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `account_holder` varchar(150) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `bank_branch` varchar(150) DEFAULT NULL,
  `payment_qr_url` longtext DEFAULT NULL,
  `gst_bank_name` varchar(150) DEFAULT NULL,
  `gst_account_holder` varchar(150) DEFAULT NULL,
  `gst_account_number` varchar(100) DEFAULT NULL,
  `gst_ifsc_code` varchar(50) DEFAULT NULL,
  `gst_bank_branch` varchar(150) DEFAULT NULL,
  `gst_upi_id` varchar(100) DEFAULT NULL,
  `gst_payment_qr_url` longtext DEFAULT NULL,
  `nongst_bank_name` varchar(150) DEFAULT NULL,
  `nongst_account_holder` varchar(150) DEFAULT NULL,
  `nongst_account_number` varchar(100) DEFAULT NULL,
  `nongst_ifsc_code` varchar(50) DEFAULT NULL,
  `nongst_bank_branch` varchar(150) DEFAULT NULL,
  `nongst_upi_id` varchar(100) DEFAULT NULL,
  `nongst_payment_qr_url` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'SAAMPARK TECHNOLOGY AND RESEARCH PRIVATE LIMITED','tech','INR','Γé╣','/saampark-logo.png',NULL,'Software & IT Services',NULL,'2026-08-24 15:57:53','2026-09-25 18:54:52',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(2,'SAAMPARK Digital Marketing & Research','digital','INR','Γé╣',NULL,NULL,'Digital Marketing & Analytics',NULL,'2026-08-24 15:57:53','2026-08-24 15:57:53',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL),(3,'SAAMPARK AI Solutions','saampark-ai-solutions','INR','Γé╣','data:image/jpeg;base64,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',NULL,'Technology',4,'2026-08-24 16:59:15','2026-09-11 22:39:02',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `credit_notes`
--

DROP TABLE IF EXISTS `credit_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `credit_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `credit_note_number` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'open',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `credit_notes_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `credit_notes`
--

LOCK TABLES `credit_notes` WRITE;
/*!40000 ALTER TABLE `credit_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `credit_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `custom_roles`
--

DROP TABLE IF EXISTS `custom_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `custom_roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `parent_role_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `custom_roles_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `custom_roles`
--

LOCK TABLES `custom_roles` WRITE;
/*!40000 ALTER TABLE `custom_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `custom_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_subscriptions`
--

DROP TABLE IF EXISTS `customer_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `package_id` int(11) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `billing_cycle` enum('monthly','quarterly','yearly') DEFAULT 'monthly',
  `status` enum('active','expired','cancelled','pending') DEFAULT 'active',
  `auto_renew` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `package_id` (`package_id`),
  CONSTRAINT `customer_subscriptions_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `customer_subscriptions_ibfk_2` FOREIGN KEY (`package_id`) REFERENCES `subscription_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_subscriptions`
--

LOCK TABLES `customer_subscriptions` WRITE;
/*!40000 ALTER TABLE `customer_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lead_id` int(11) DEFAULT NULL,
  `company_name` varchar(100) NOT NULL,
  `primary_contact_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `sub_branch_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `lead_id` (`lead_id`),
  CONSTRAINT `customers_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deals`
--

DROP TABLE IF EXISTS `deals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `title` varchar(150) NOT NULL,
  `deal_value` decimal(12,2) NOT NULL DEFAULT 0.00,
  `stage` enum('new_lead','contacted','qualified','proposal','negotiation','won','lost') DEFAULT 'new_lead',
  `close_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `sub_branch_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `deals_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `deals_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deals`
--

LOCK TABLES `deals` WRITE;
/*!40000 ALTER TABLE `deals` DISABLE KEYS */;
/*!40000 ALTER TABLE `deals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `debit_notes`
--

DROP TABLE IF EXISTS `debit_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `debit_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `purchase_invoice_id` int(11) DEFAULT NULL,
  `debit_note_number` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'open',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `debit_notes_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `debit_notes`
--

LOCK TABLES `debit_notes` WRITE;
/*!40000 ALTER TABLE `debit_notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `debit_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `deleted_items`
--

DROP TABLE IF EXISTS `deleted_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `deleted_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `item_id` varchar(255) NOT NULL,
  `module_name` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `item_id` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=71 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `deleted_items`
--

LOCK TABLES `deleted_items` WRITE;
/*!40000 ALTER TABLE `deleted_items` DISABLE KEYS */;
INSERT INTO `deleted_items` VALUES (1,'3683','tasks','2026-08-22 11:48:55'),(2,'3674','tasks','2026-08-22 11:49:05'),(3,'17','projects','2026-08-22 13:35:10'),(4,'19','projects','2026-08-22 13:35:12'),(5,'3752','tasks','2026-08-22 13:35:30'),(6,'3711','tasks','2026-08-22 13:35:32'),(7,'3751','tasks','2026-08-22 13:35:36'),(8,'3749','tasks','2026-08-22 13:43:42'),(9,'3673','tasks','2026-08-22 13:43:46'),(10,'3690','tasks','2026-08-22 13:43:48'),(11,'3754','tasks','2026-08-22 13:43:49'),(12,'3733','tasks','2026-08-22 13:57:35'),(13,'lead_task_lead_101','tasks','2026-08-22 13:57:40'),(14,'lead_task_101','tasks','2026-08-22 13:57:42'),(15,'lead_task_lead_102','tasks','2026-08-22 13:57:44'),(16,'lead_task_lead_103','tasks','2026-08-22 13:57:46'),(17,'inv #28','invoices','2026-08-22 14:06:22'),(18,'inv #27','invoices','2026-08-22 14:06:25'),(19,'inv #24','invoices','2026-08-22 14:06:29'),(20,'inv #23','invoices','2026-08-22 14:06:32'),(21,'inv #22','invoices','2026-08-22 14:06:36'),(22,'inv #21','invoices','2026-08-22 14:06:38'),(23,'inv #19','invoices','2026-08-22 14:06:42'),(24,'inv #222','invoices','2026-08-26 20:58:33'),(25,'ord_1787774832876','orders','2026-08-26 20:58:33'),(26,'p-850','payments','2026-08-26 20:58:33'),(27,'21','projects','2026-08-26 20:58:41'),(28,'20','projects','2026-08-26 20:58:44'),(29,'inv #729','invoices','2026-08-26 21:13:51'),(30,'p-599','payments','2026-08-27 00:01:20'),(31,'inv #240','invoices','2026-08-27 00:01:27'),(32,'ord_1787786677698','orders','2026-08-27 00:01:27'),(34,'inv270826001','invoices','2026-08-27 00:54:11'),(35,'ord_1787788981332','orders','2026-08-27 00:54:11'),(36,'p-569','payments','2026-08-27 00:54:11'),(37,'p-444','payments','2026-08-27 01:08:53'),(38,'ord_1787792096288','orders','2026-08-27 01:09:00'),(39,'inv2708260003','invoices','2026-08-27 02:30:13'),(40,'ord_1787796430984','orders','2026-08-27 02:30:13'),(41,'p-884','payments','2026-08-27 02:30:13'),(42,'inv2708260002','invoices','2026-08-27 02:30:16'),(43,'ord_1787795636520','orders','2026-08-27 02:30:16'),(44,'inv2708260001','invoices','2026-08-27 02:30:18'),(45,'ord_1787793123795','orders','2026-08-27 02:30:18'),(46,'p-327','payments','2026-08-27 02:30:18'),(47,'ord_1787797862221','orders','2026-08-27 02:32:35'),(48,'ord_1787799342223','orders','2026-08-27 03:06:24'),(49,'ord_1787797905854','orders','2026-08-27 03:06:29'),(50,'p-332','payments','2026-08-27 03:06:36'),(51,'ord_1787800027920','orders','2026-08-27 03:42:39'),(52,'p-6850','payments','2026-08-27 03:42:44'),(53,'p-7246','payments','2026-08-27 03:42:54'),(54,'ord_1787801220385','orders','2026-08-27 03:43:00'),(55,'ord_1787800894139','orders','2026-08-27 03:43:12'),(56,'p-8043','payments','2026-08-27 03:43:20'),(57,'p-4676','payments','2026-08-27 04:26:43'),(58,'ord_1787803768046','orders','2026-08-27 04:26:49'),(59,'ord_1787802232366','orders','2026-08-27 04:26:51'),(60,'848935','projects','2026-08-27 04:51:44'),(61,'ord_1787805471765','orders','2026-08-27 04:51:49'),(62,'p-1798','payments','2026-08-27 04:51:53'),(63,'ord_1787804849884','orders','2026-08-27 04:52:03'),(64,'p-6561','payments','2026-08-27 04:52:09'),(65,'inv2708260004','invoices','2026-08-27 04:57:40'),(66,'ord_1787806361429','orders','2026-08-27 04:57:40'),(67,'p-1778','payments','2026-08-27 04:57:40'),(68,'848934','projects','2026-08-27 04:58:00'),(69,'1788666116878-qs76orpqz','companies','2026-09-11 05:41:37'),(70,'saampark-open-sourch','companies','2026-09-11 05:41:37');
/*!40000 ALTER TABLE `deleted_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `departments`
--

DROP TABLE IF EXISTS `departments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `departments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `head_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `departments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `departments`
--

LOCK TABLES `departments` WRITE;
/*!40000 ALTER TABLE `departments` DISABLE KEYS */;
INSERT INTO `departments` VALUES (1,1,NULL,'Technology',NULL,NULL,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(2,1,NULL,'Sales',NULL,NULL,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(3,1,NULL,'Marketing',NULL,NULL,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(4,1,NULL,'HR',NULL,NULL,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(5,1,NULL,'Finance',NULL,NULL,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(6,1,NULL,'Support',NULL,NULL,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(7,2,NULL,'Digital Marketing',NULL,NULL,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50'),(8,2,NULL,'Research',NULL,NULL,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50'),(9,2,NULL,'Sales',NULL,NULL,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50');
/*!40000 ALTER TABLE `departments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `designations`
--

DROP TABLE IF EXISTS `designations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `designations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `level` int(11) DEFAULT 0,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `designations_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `designations`
--

LOCK TABLES `designations` WRITE;
/*!40000 ALTER TABLE `designations` DISABLE KEYS */;
INSERT INTO `designations` VALUES (1,1,'CEO',1,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(2,1,'Manager',3,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(3,1,'Team Lead',4,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(4,1,'Developer',6,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(5,1,'Sales Executive',6,NULL,1,'2026-09-06 17:01:05','2026-09-06 17:01:05'),(6,1,'Developer',6,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50'),(7,1,'Junior Developer',7,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50'),(8,1,'Sales Executive',6,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50'),(9,1,'Marketing Executive',6,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50'),(10,1,'HR Executive',6,NULL,1,'2026-09-06 17:01:50','2026-09-06 17:01:50');
/*!40000 ALTER TABLE `designations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `documents`
--

DROP TABLE IF EXISTS `documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `module_type` varchar(50) DEFAULT NULL,
  `module_id` int(11) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `name` varchar(255) NOT NULL,
  `file_url` text NOT NULL,
  `file_size` int(11) DEFAULT 0,
  `file_type` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `is_archived` tinyint(1) DEFAULT 0,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `documents_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `documents`
--

LOCK TABLES `documents` WRITE;
/*!40000 ALTER TABLE `documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_campaigns`
--

DROP TABLE IF EXISTS `email_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content` longtext DEFAULT NULL,
  `recipient_list` text DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `total_sent` int(11) DEFAULT 0,
  `total_opened` int(11) DEFAULT 0,
  `total_clicked` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `email_campaigns_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_campaigns`
--

LOCK TABLES `email_campaigns` WRITE;
/*!40000 ALTER TABLE `email_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_attendance`
--

DROP TABLE IF EXISTS `employee_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_attendance` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `clock_in` datetime DEFAULT NULL,
  `clock_out` datetime DEFAULT NULL,
  `total_hours` decimal(5,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'present',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_emp_date` (`employee_id`,`date`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `employee_attendance_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_attendance`
--

LOCK TABLES `employee_attendance` WRITE;
/*!40000 ALTER TABLE `employee_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employee_documents`
--

DROP TABLE IF EXISTS `employee_documents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employee_documents` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `document_type` varchar(100) NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `file_url` text NOT NULL,
  `expiry_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `employee_documents_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employee_documents`
--

LOCK TABLES `employee_documents` WRITE;
/*!40000 ALTER TABLE `employee_documents` DISABLE KEYS */;
/*!40000 ALTER TABLE `employee_documents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `employees`
--

DROP TABLE IF EXISTS `employees`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `employees` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `employee_code` varchar(50) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `designation_id` int(11) DEFAULT NULL,
  `date_of_joining` date DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `emergency_contact` varchar(100) DEFAULT NULL,
  `emergency_phone` varchar(50) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `basic_salary` decimal(12,2) DEFAULT 0.00,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `employees_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `employees`
--

LOCK TABLES `employees` WRITE;
/*!40000 ALTER TABLE `employees` DISABLE KEYS */;
/*!40000 ALTER TABLE `employees` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `enquiries`
--

DROP TABLE IF EXISTS `enquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `enquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `subject` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `type` varchar(100) DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'Medium',
  `status` varchar(50) DEFAULT 'New',
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `responded_at` datetime DEFAULT NULL,
  `closed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `enquiries_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `enquiries`
--

LOCK TABLES `enquiries` WRITE;
/*!40000 ALTER TABLE `enquiries` DISABLE KEYS */;
/*!40000 ALTER TABLE `enquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estimate_items`
--

DROP TABLE IF EXISTS `estimate_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estimate_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `estimate_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `estimate_id` (`estimate_id`),
  CONSTRAINT `estimate_items_ibfk_1` FOREIGN KEY (`estimate_id`) REFERENCES `estimates` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estimate_items`
--

LOCK TABLES `estimate_items` WRITE;
/*!40000 ALTER TABLE `estimate_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `estimate_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estimates`
--

DROP TABLE IF EXISTS `estimates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `estimates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `estimate_number` varchar(50) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(12,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  `validity_days` int(11) DEFAULT 30,
  `terms` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `estimates_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estimates`
--

LOCK TABLES `estimates` WRITE;
/*!40000 ALTER TABLE `estimates` DISABLE KEYS */;
/*!40000 ALTER TABLE `estimates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `expenses` (
  `id` varchar(64) NOT NULL,
  `company_id` varchar(64) NOT NULL,
  `expense_number` varchar(64) NOT NULL,
  `title` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL DEFAULT 0.00,
  `category` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `member` varchar(100) DEFAULT NULL,
  `assigned_member_id` varchar(64) DEFAULT NULL,
  `project_id` varchar(64) DEFAULT NULL,
  `project_name` varchar(255) DEFAULT NULL,
  `is_project_expense` tinyint(1) DEFAULT 0,
  `is_extra_charge` tinyint(1) DEFAULT 0,
  `extra_charge_category` varchar(100) DEFAULT NULL,
  `status` enum('Approved','Pending','Rejected') DEFAULT 'Pending',
  `receipt_url` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_by` varchar(64) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `branch_id` int(11) DEFAULT NULL,
  `sub_branch_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_company` (`company_id`),
  KEY `idx_project` (`project_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES ('exp_1788719323811_vx78d','1','EXP-2026-0001','Office Supplies Mumbai',1200.00,'Office','2026-09-06','',NULL,NULL,NULL,0,0,NULL,'Pending',NULL,NULL,'1','2026-09-06 18:28:43','2026-09-06 18:28:43',NULL,NULL);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `follow_ups`
--

DROP TABLE IF EXISTS `follow_ups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `follow_ups` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `enquiry_id` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'call',
  `subject` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `scheduled_at` datetime NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `outcome` text DEFAULT NULL,
  `next_follow_up` date DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `follow_ups_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `follow_ups`
--

LOCK TABLES `follow_ups` WRITE;
/*!40000 ALTER TABLE `follow_ups` DISABLE KEYS */;
/*!40000 ALTER TABLE `follow_ups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoice_items`
--

DROP TABLE IF EXISTS `invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `invoice_id` (`invoice_id`),
  CONSTRAINT `invoice_items_ibfk_1` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoice_items`
--

LOCK TABLES `invoice_items` WRITE;
/*!40000 ALTER TABLE `invoice_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `client_id` int(11) DEFAULT NULL,
  `quotation_id` int(11) DEFAULT NULL,
  `sales_order_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `total_amount` decimal(12,2) NOT NULL,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `tax_amount` decimal(12,2) DEFAULT 0.00,
  `shipping_cost` decimal(12,2) DEFAULT 0.00,
  `paid_amount` decimal(12,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'Draft',
  `due_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `terms` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `invoices_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ip_logs`
--

DROP TABLE IF EXISTS `ip_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ip_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `ip_address` varchar(50) NOT NULL,
  `location` varchar(255) DEFAULT NULL,
  `device` varchar(255) DEFAULT NULL,
  `browser` varchar(100) DEFAULT NULL,
  `os` varchar(100) DEFAULT NULL,
  `login_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `logout_at` datetime DEFAULT NULL,
  `is_successful` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ip_logs`
--

LOCK TABLES `ip_logs` WRITE;
/*!40000 ALTER TABLE `ip_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `ip_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `knowledge_base`
--

DROP TABLE IF EXISTS `knowledge_base`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `knowledge_base` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `category` varchar(150) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` longtext NOT NULL,
  `tags` text DEFAULT NULL,
  `views` int(11) DEFAULT 0,
  `helpful_count` int(11) DEFAULT 0,
  `is_published` tinyint(1) DEFAULT 1,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `knowledge_base_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `knowledge_base`
--

LOCK TABLES `knowledge_base` WRITE;
/*!40000 ALTER TABLE `knowledge_base` DISABLE KEYS */;
/*!40000 ALTER TABLE `knowledge_base` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lead_sources`
--

DROP TABLE IF EXISTS `lead_sources`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `lead_sources` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_name` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `source_name` (`source_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lead_sources`
--

LOCK TABLES `lead_sources` WRITE;
/*!40000 ALTER TABLE `lead_sources` DISABLE KEYS */;
INSERT INTO `lead_sources` VALUES (4,'Email Campaign'),(5,'Other'),(3,'Referral'),(2,'Social Media'),(1,'Website');
/*!40000 ALTER TABLE `lead_sources` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leads`
--

DROP TABLE IF EXISTS `leads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `source_id` int(11) DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) DEFAULT NULL,
  `email` varchar(150) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `company_name` varchar(100) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `status` enum('new','contacted','qualified','proposal','won','lost') DEFAULT 'new',
  `lead_score` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `company_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `sub_branch_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `source_id` (`source_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`source_id`) REFERENCES `lead_sources` (`id`) ON DELETE SET NULL,
  CONSTRAINT `leads_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leads`
--

LOCK TABLES `leads` WRITE;
/*!40000 ALTER TABLE `leads` DISABLE KEYS */;
/*!40000 ALTER TABLE `leads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_requests`
--

DROP TABLE IF EXISTS `leave_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `leave_type_id` int(11) NOT NULL,
  `from_date` date NOT NULL,
  `to_date` date NOT NULL,
  `days` int(11) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `approved_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `leave_requests_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_requests`
--

LOCK TABLES `leave_requests` WRITE;
/*!40000 ALTER TABLE `leave_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `leave_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leave_types`
--

DROP TABLE IF EXISTS `leave_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leave_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `days_per_year` int(11) DEFAULT 0,
  `is_paid` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `leave_types_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leave_types`
--

LOCK TABLES `leave_types` WRITE;
/*!40000 ALTER TABLE `leave_types` DISABLE KEYS */;
INSERT INTO `leave_types` VALUES (1,1,'Casual Leave',12,1,1,'2026-09-06 17:01:05'),(2,1,'Sick Leave',12,1,1,'2026-09-06 17:01:05'),(3,1,'Earned Leave',15,1,1,'2026-09-06 17:01:05'),(4,1,'Maternity Leave',180,1,1,'2026-09-06 17:01:50'),(5,1,'Paternity Leave',15,1,1,'2026-09-06 17:01:50'),(6,1,'Unpaid Leave',0,0,1,'2026-09-06 17:01:50');
/*!40000 ALTER TABLE `leave_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meetings`
--

DROP TABLE IF EXISTS `meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meetings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `meeting_date` datetime NOT NULL,
  `duration` int(11) DEFAULT 60,
  `location` varchar(255) DEFAULT NULL,
  `meeting_url` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'scheduled',
  `outcome` text DEFAULT NULL,
  `attendees` text DEFAULT NULL,
  `organized_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `meetings_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meetings`
--

LOCK TABLES `meetings` WRITE;
/*!40000 ALTER TABLE `meetings` DISABLE KEYS */;
/*!40000 ALTER TABLE `meetings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_templates`
--

DROP TABLE IF EXISTS `message_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `message_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `type` varchar(50) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body` text NOT NULL,
  `variables` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `message_templates_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_templates`
--

LOCK TABLES `message_templates` WRITE;
/*!40000 ALTER TABLE `message_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `milestones`
--

DROP TABLE IF EXISTS `milestones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `milestones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `project_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `progress` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `project_id` (`project_id`),
  CONSTRAINT `milestones_ibfk_1` FOREIGN KEY (`project_id`) REFERENCES `projects` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `milestones`
--

LOCK TABLES `milestones` WRITE;
/*!40000 ALTER TABLE `milestones` DISABLE KEYS */;
/*!40000 ALTER TABLE `milestones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notes`
--

DROP TABLE IF EXISTS `notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `module_type` varchar(50) NOT NULL,
  `module_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `is_pinned` tinyint(1) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `notes_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notes`
--

LOCK TABLES `notes` WRITE;
/*!40000 ALTER TABLE `notes` DISABLE KEYS */;
/*!40000 ALTER TABLE `notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `type` varchar(50) DEFAULT 'info',
  `module_type` varchar(50) DEFAULT NULL,
  `module_id` int(11) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `payment_number` varchar(50) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'cash',
  `reference_number` varchar(100) DEFAULT NULL,
  `bank_account_id` int(11) DEFAULT NULL,
  `cheque_number` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'completed',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payroll`
--

DROP TABLE IF EXISTS `payroll`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payroll` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `month` int(11) NOT NULL,
  `year` int(11) NOT NULL,
  `basic_salary` decimal(12,2) DEFAULT 0.00,
  `allowances` decimal(12,2) DEFAULT 0.00,
  `deductions` decimal(12,2) DEFAULT 0.00,
  `tax` decimal(12,2) DEFAULT 0.00,
  `net_salary` decimal(12,2) DEFAULT 0.00,
  `payment_status` varchar(50) DEFAULT 'unpaid',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `payroll_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payroll`
--

LOCK TABLES `payroll` WRITE;
/*!40000 ALTER TABLE `payroll` DISABLE KEYS */;
/*!40000 ALTER TABLE `payroll` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `performance_reviews`
--

DROP TABLE IF EXISTS `performance_reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `performance_reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `reviewer_id` int(11) NOT NULL,
  `review_period` varchar(50) DEFAULT NULL,
  `rating` int(11) DEFAULT 0,
  `strengths` text DEFAULT NULL,
  `improvements` text DEFAULT NULL,
  `goals` text DEFAULT NULL,
  `comments` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `review_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `performance_reviews_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `performance_reviews`
--

LOCK TABLES `performance_reviews` WRITE;
/*!40000 ALTER TABLE `performance_reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `performance_reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module` varchar(100) NOT NULL,
  `action` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_module_action` (`module`,`action`)
) ENGINE=InnoDB AUTO_INCREMENT=1441 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'dashboard','view',NULL,'2026-09-06 17:00:11'),(2,'dashboard','add',NULL,'2026-09-06 17:00:11'),(3,'dashboard','edit',NULL,'2026-09-06 17:00:11'),(4,'dashboard','delete',NULL,'2026-09-06 17:00:11'),(5,'dashboard','approve',NULL,'2026-09-06 17:00:11'),(6,'dashboard','export',NULL,'2026-09-06 17:00:11'),(7,'dashboard','import',NULL,'2026-09-06 17:00:11'),(8,'dashboard','print',NULL,'2026-09-06 17:00:11'),(9,'dashboard','download',NULL,'2026-09-06 17:00:11'),(10,'dashboard','share',NULL,'2026-09-06 17:00:11'),(11,'dashboard','assign',NULL,'2026-09-06 17:00:11'),(12,'dashboard','manage',NULL,'2026-09-06 17:00:11'),(13,'leads','view',NULL,'2026-09-06 17:00:11'),(14,'leads','add',NULL,'2026-09-06 17:00:11'),(15,'leads','edit',NULL,'2026-09-06 17:00:11'),(16,'leads','delete',NULL,'2026-09-06 17:00:11'),(17,'leads','approve',NULL,'2026-09-06 17:00:11'),(18,'leads','export',NULL,'2026-09-06 17:00:11'),(19,'leads','import',NULL,'2026-09-06 17:00:11'),(20,'leads','print',NULL,'2026-09-06 17:00:11'),(21,'leads','download',NULL,'2026-09-06 17:00:11'),(22,'leads','share',NULL,'2026-09-06 17:00:11'),(23,'leads','assign',NULL,'2026-09-06 17:00:11'),(24,'leads','manage',NULL,'2026-09-06 17:00:11'),(25,'enquiries','view',NULL,'2026-09-06 17:00:11'),(26,'enquiries','add',NULL,'2026-09-06 17:00:11'),(27,'enquiries','edit',NULL,'2026-09-06 17:00:11'),(28,'enquiries','delete',NULL,'2026-09-06 17:00:11'),(29,'enquiries','approve',NULL,'2026-09-06 17:00:11'),(30,'enquiries','export',NULL,'2026-09-06 17:00:11'),(31,'enquiries','import',NULL,'2026-09-06 17:00:11'),(32,'enquiries','print',NULL,'2026-09-06 17:00:11'),(33,'enquiries','download',NULL,'2026-09-06 17:00:11'),(34,'enquiries','share',NULL,'2026-09-06 17:00:11'),(35,'enquiries','assign',NULL,'2026-09-06 17:00:11'),(36,'enquiries','manage',NULL,'2026-09-06 17:00:11'),(37,'customers','view',NULL,'2026-09-06 17:00:11'),(38,'customers','add',NULL,'2026-09-06 17:00:11'),(39,'customers','edit',NULL,'2026-09-06 17:00:11'),(40,'customers','delete',NULL,'2026-09-06 17:00:11'),(41,'customers','approve',NULL,'2026-09-06 17:00:11'),(42,'customers','export',NULL,'2026-09-06 17:00:11'),(43,'customers','import',NULL,'2026-09-06 17:00:11'),(44,'customers','print',NULL,'2026-09-06 17:00:11'),(45,'customers','download',NULL,'2026-09-06 17:00:11'),(46,'customers','share',NULL,'2026-09-06 17:00:11'),(47,'customers','assign',NULL,'2026-09-06 17:00:11'),(48,'customers','manage',NULL,'2026-09-06 17:00:11'),(49,'contacts','view',NULL,'2026-09-06 17:00:11'),(50,'contacts','add',NULL,'2026-09-06 17:00:11'),(51,'contacts','edit',NULL,'2026-09-06 17:00:11'),(52,'contacts','delete',NULL,'2026-09-06 17:00:11'),(53,'contacts','approve',NULL,'2026-09-06 17:00:11'),(54,'contacts','export',NULL,'2026-09-06 17:00:11'),(55,'contacts','import',NULL,'2026-09-06 17:00:11'),(56,'contacts','print',NULL,'2026-09-06 17:00:11'),(57,'contacts','download',NULL,'2026-09-06 17:00:11'),(58,'contacts','share',NULL,'2026-09-06 17:00:11'),(59,'contacts','assign',NULL,'2026-09-06 17:00:11'),(60,'contacts','manage',NULL,'2026-09-06 17:00:11'),(61,'deals','view',NULL,'2026-09-06 17:00:11'),(62,'deals','add',NULL,'2026-09-06 17:00:11'),(63,'deals','edit',NULL,'2026-09-06 17:00:11'),(64,'deals','delete',NULL,'2026-09-06 17:00:11'),(65,'deals','approve',NULL,'2026-09-06 17:00:11'),(66,'deals','export',NULL,'2026-09-06 17:00:11'),(67,'deals','import',NULL,'2026-09-06 17:00:11'),(68,'deals','print',NULL,'2026-09-06 17:00:11'),(69,'deals','download',NULL,'2026-09-06 17:00:11'),(70,'deals','share',NULL,'2026-09-06 17:00:11'),(71,'deals','assign',NULL,'2026-09-06 17:00:11'),(72,'deals','manage',NULL,'2026-09-06 17:00:11'),(73,'quotations','view',NULL,'2026-09-06 17:00:11'),(74,'quotations','add',NULL,'2026-09-06 17:00:11'),(75,'quotations','edit',NULL,'2026-09-06 17:00:12'),(76,'quotations','delete',NULL,'2026-09-06 17:00:12'),(77,'quotations','approve',NULL,'2026-09-06 17:00:12'),(78,'quotations','export',NULL,'2026-09-06 17:00:12'),(79,'quotations','import',NULL,'2026-09-06 17:00:12'),(80,'quotations','print',NULL,'2026-09-06 17:00:12'),(81,'quotations','download',NULL,'2026-09-06 17:00:12'),(82,'quotations','share',NULL,'2026-09-06 17:00:12'),(83,'quotations','assign',NULL,'2026-09-06 17:00:12'),(84,'quotations','manage',NULL,'2026-09-06 17:00:12'),(85,'estimates','view',NULL,'2026-09-06 17:00:12'),(86,'estimates','add',NULL,'2026-09-06 17:00:12'),(87,'estimates','edit',NULL,'2026-09-06 17:00:12'),(88,'estimates','delete',NULL,'2026-09-06 17:00:12'),(89,'estimates','approve',NULL,'2026-09-06 17:00:12'),(90,'estimates','export',NULL,'2026-09-06 17:00:12'),(91,'estimates','import',NULL,'2026-09-06 17:00:12'),(92,'estimates','print',NULL,'2026-09-06 17:00:12'),(93,'estimates','download',NULL,'2026-09-06 17:00:12'),(94,'estimates','share',NULL,'2026-09-06 17:00:12'),(95,'estimates','assign',NULL,'2026-09-06 17:00:12'),(96,'estimates','manage',NULL,'2026-09-06 17:00:12'),(97,'sales_orders','view',NULL,'2026-09-06 17:00:12'),(98,'sales_orders','add',NULL,'2026-09-06 17:00:12'),(99,'sales_orders','edit',NULL,'2026-09-06 17:00:12'),(100,'sales_orders','delete',NULL,'2026-09-06 17:00:12'),(101,'sales_orders','approve',NULL,'2026-09-06 17:00:12'),(102,'sales_orders','export',NULL,'2026-09-06 17:00:12'),(103,'sales_orders','import',NULL,'2026-09-06 17:00:12'),(104,'sales_orders','print',NULL,'2026-09-06 17:00:12'),(105,'sales_orders','download',NULL,'2026-09-06 17:00:12'),(106,'sales_orders','share',NULL,'2026-09-06 17:00:12'),(107,'sales_orders','assign',NULL,'2026-09-06 17:00:12'),(108,'sales_orders','manage',NULL,'2026-09-06 17:00:12'),(109,'invoices','view',NULL,'2026-09-06 17:00:12'),(110,'invoices','add',NULL,'2026-09-06 17:00:12'),(111,'invoices','edit',NULL,'2026-09-06 17:00:12'),(112,'invoices','delete',NULL,'2026-09-06 17:00:12'),(113,'invoices','approve',NULL,'2026-09-06 17:00:12'),(114,'invoices','export',NULL,'2026-09-06 17:00:12'),(115,'invoices','import',NULL,'2026-09-06 17:00:12'),(116,'invoices','print',NULL,'2026-09-06 17:00:12'),(117,'invoices','download',NULL,'2026-09-06 17:00:12'),(118,'invoices','share',NULL,'2026-09-06 17:00:12'),(119,'invoices','assign',NULL,'2026-09-06 17:00:12'),(120,'invoices','manage',NULL,'2026-09-06 17:00:12'),(121,'recurring_invoices','view',NULL,'2026-09-06 17:00:12'),(122,'recurring_invoices','add',NULL,'2026-09-06 17:00:12'),(123,'recurring_invoices','edit',NULL,'2026-09-06 17:00:12'),(124,'recurring_invoices','delete',NULL,'2026-09-06 17:00:12'),(125,'recurring_invoices','approve',NULL,'2026-09-06 17:00:12'),(126,'recurring_invoices','export',NULL,'2026-09-06 17:00:12'),(127,'recurring_invoices','import',NULL,'2026-09-06 17:00:12'),(128,'recurring_invoices','print',NULL,'2026-09-06 17:00:12'),(129,'recurring_invoices','download',NULL,'2026-09-06 17:00:12'),(130,'recurring_invoices','share',NULL,'2026-09-06 17:00:12'),(131,'recurring_invoices','assign',NULL,'2026-09-06 17:00:12'),(132,'recurring_invoices','manage',NULL,'2026-09-06 17:00:12'),(133,'payments','view',NULL,'2026-09-06 17:00:12'),(134,'payments','add',NULL,'2026-09-06 17:00:12'),(135,'payments','edit',NULL,'2026-09-06 17:00:12'),(136,'payments','delete',NULL,'2026-09-06 17:00:12'),(137,'payments','approve',NULL,'2026-09-06 17:00:12'),(138,'payments','export',NULL,'2026-09-06 17:00:12'),(139,'payments','import',NULL,'2026-09-06 17:00:12'),(140,'payments','print',NULL,'2026-09-06 17:00:12'),(141,'payments','download',NULL,'2026-09-06 17:00:12'),(142,'payments','share',NULL,'2026-09-06 17:00:12'),(143,'payments','assign',NULL,'2026-09-06 17:00:12'),(144,'payments','manage',NULL,'2026-09-06 17:00:12'),(145,'credit_notes','view',NULL,'2026-09-06 17:00:12'),(146,'credit_notes','add',NULL,'2026-09-06 17:00:12'),(147,'credit_notes','edit',NULL,'2026-09-06 17:00:12'),(148,'credit_notes','delete',NULL,'2026-09-06 17:00:12'),(149,'credit_notes','approve',NULL,'2026-09-06 17:00:12'),(150,'credit_notes','export',NULL,'2026-09-06 17:00:12'),(151,'credit_notes','import',NULL,'2026-09-06 17:00:12'),(152,'credit_notes','print',NULL,'2026-09-06 17:00:12'),(153,'credit_notes','download',NULL,'2026-09-06 17:00:12'),(154,'credit_notes','share',NULL,'2026-09-06 17:00:12'),(155,'credit_notes','assign',NULL,'2026-09-06 17:00:12'),(156,'credit_notes','manage',NULL,'2026-09-06 17:00:12'),(157,'debit_notes','view',NULL,'2026-09-06 17:00:12'),(158,'debit_notes','add',NULL,'2026-09-06 17:00:12'),(159,'debit_notes','edit',NULL,'2026-09-06 17:00:12'),(160,'debit_notes','delete',NULL,'2026-09-06 17:00:12'),(161,'debit_notes','approve',NULL,'2026-09-06 17:00:12'),(162,'debit_notes','export',NULL,'2026-09-06 17:00:12'),(163,'debit_notes','import',NULL,'2026-09-06 17:00:12'),(164,'debit_notes','print',NULL,'2026-09-06 17:00:12'),(165,'debit_notes','download',NULL,'2026-09-06 17:00:12'),(166,'debit_notes','share',NULL,'2026-09-06 17:00:12'),(167,'debit_notes','assign',NULL,'2026-09-06 17:00:12'),(168,'debit_notes','manage',NULL,'2026-09-06 17:00:12'),(169,'refunds','view',NULL,'2026-09-06 17:00:12'),(170,'refunds','add',NULL,'2026-09-06 17:00:12'),(171,'refunds','edit',NULL,'2026-09-06 17:00:12'),(172,'refunds','delete',NULL,'2026-09-06 17:00:12'),(173,'refunds','approve',NULL,'2026-09-06 17:00:12'),(174,'refunds','export',NULL,'2026-09-06 17:00:12'),(175,'refunds','import',NULL,'2026-09-06 17:00:12'),(176,'refunds','print',NULL,'2026-09-06 17:00:12'),(177,'refunds','download',NULL,'2026-09-06 17:00:12'),(178,'refunds','share',NULL,'2026-09-06 17:00:12'),(179,'refunds','assign',NULL,'2026-09-06 17:00:12'),(180,'refunds','manage',NULL,'2026-09-06 17:00:12'),(181,'suppliers','view',NULL,'2026-09-06 17:00:12'),(182,'suppliers','add',NULL,'2026-09-06 17:00:12'),(183,'suppliers','edit',NULL,'2026-09-06 17:00:12'),(184,'suppliers','delete',NULL,'2026-09-06 17:00:12'),(185,'suppliers','approve',NULL,'2026-09-06 17:00:12'),(186,'suppliers','export',NULL,'2026-09-06 17:00:12'),(187,'suppliers','import',NULL,'2026-09-06 17:00:12'),(188,'suppliers','print',NULL,'2026-09-06 17:00:12'),(189,'suppliers','download',NULL,'2026-09-06 17:00:12'),(190,'suppliers','share',NULL,'2026-09-06 17:00:12'),(191,'suppliers','assign',NULL,'2026-09-06 17:00:12'),(192,'suppliers','manage',NULL,'2026-09-06 17:00:12'),(193,'purchase_orders','view',NULL,'2026-09-06 17:00:12'),(194,'purchase_orders','add',NULL,'2026-09-06 17:00:12'),(195,'purchase_orders','edit',NULL,'2026-09-06 17:00:12'),(196,'purchase_orders','delete',NULL,'2026-09-06 17:00:12'),(197,'purchase_orders','approve',NULL,'2026-09-06 17:00:12'),(198,'purchase_orders','export',NULL,'2026-09-06 17:00:12'),(199,'purchase_orders','import',NULL,'2026-09-06 17:00:12'),(200,'purchase_orders','print',NULL,'2026-09-06 17:00:12'),(201,'purchase_orders','download',NULL,'2026-09-06 17:00:12'),(202,'purchase_orders','share',NULL,'2026-09-06 17:00:12'),(203,'purchase_orders','assign',NULL,'2026-09-06 17:00:12'),(204,'purchase_orders','manage',NULL,'2026-09-06 17:00:12'),(205,'purchase_invoices','view',NULL,'2026-09-06 17:00:12'),(206,'purchase_invoices','add',NULL,'2026-09-06 17:00:12'),(207,'purchase_invoices','edit',NULL,'2026-09-06 17:00:12'),(208,'purchase_invoices','delete',NULL,'2026-09-06 17:00:12'),(209,'purchase_invoices','approve',NULL,'2026-09-06 17:00:12'),(210,'purchase_invoices','export',NULL,'2026-09-06 17:00:12'),(211,'purchase_invoices','import',NULL,'2026-09-06 17:00:12'),(212,'purchase_invoices','print',NULL,'2026-09-06 17:00:12'),(213,'purchase_invoices','download',NULL,'2026-09-06 17:00:12'),(214,'purchase_invoices','share',NULL,'2026-09-06 17:00:12'),(215,'purchase_invoices','assign',NULL,'2026-09-06 17:00:12'),(216,'purchase_invoices','manage',NULL,'2026-09-06 17:00:12'),(217,'purchase_returns','view',NULL,'2026-09-06 17:00:12'),(218,'purchase_returns','add',NULL,'2026-09-06 17:00:12'),(219,'purchase_returns','edit',NULL,'2026-09-06 17:00:12'),(220,'purchase_returns','delete',NULL,'2026-09-06 17:00:12'),(221,'purchase_returns','approve',NULL,'2026-09-06 17:00:12'),(222,'purchase_returns','export',NULL,'2026-09-06 17:00:12'),(223,'purchase_returns','import',NULL,'2026-09-06 17:00:12'),(224,'purchase_returns','print',NULL,'2026-09-06 17:00:12'),(225,'purchase_returns','download',NULL,'2026-09-06 17:00:12'),(226,'purchase_returns','share',NULL,'2026-09-06 17:00:12'),(227,'purchase_returns','assign',NULL,'2026-09-06 17:00:12'),(228,'purchase_returns','manage',NULL,'2026-09-06 17:00:12'),(229,'income','view',NULL,'2026-09-06 17:00:12'),(230,'income','add',NULL,'2026-09-06 17:00:12'),(231,'income','edit',NULL,'2026-09-06 17:00:12'),(232,'income','delete',NULL,'2026-09-06 17:00:12'),(233,'income','approve',NULL,'2026-09-06 17:00:12'),(234,'income','export',NULL,'2026-09-06 17:00:12'),(235,'income','import',NULL,'2026-09-06 17:00:12'),(236,'income','print',NULL,'2026-09-06 17:00:12'),(237,'income','download',NULL,'2026-09-06 17:00:12'),(238,'income','share',NULL,'2026-09-06 17:00:12'),(239,'income','assign',NULL,'2026-09-06 17:00:12'),(240,'income','manage',NULL,'2026-09-06 17:00:12'),(241,'expense','view',NULL,'2026-09-06 17:00:12'),(242,'expense','add',NULL,'2026-09-06 17:00:12'),(243,'expense','edit',NULL,'2026-09-06 17:00:12'),(244,'expense','delete',NULL,'2026-09-06 17:00:13'),(245,'expense','approve',NULL,'2026-09-06 17:00:13'),(246,'expense','export',NULL,'2026-09-06 17:00:13'),(247,'expense','import',NULL,'2026-09-06 17:00:13'),(248,'expense','print',NULL,'2026-09-06 17:00:13'),(249,'expense','download',NULL,'2026-09-06 17:00:13'),(250,'expense','share',NULL,'2026-09-06 17:00:13'),(251,'expense','assign',NULL,'2026-09-06 17:00:13'),(252,'expense','manage',NULL,'2026-09-06 17:00:13'),(253,'cash','view',NULL,'2026-09-06 17:00:13'),(254,'cash','add',NULL,'2026-09-06 17:00:13'),(255,'cash','edit',NULL,'2026-09-06 17:00:13'),(256,'cash','delete',NULL,'2026-09-06 17:00:13'),(257,'cash','approve',NULL,'2026-09-06 17:00:13'),(258,'cash','export',NULL,'2026-09-06 17:00:13'),(259,'cash','import',NULL,'2026-09-06 17:00:13'),(260,'cash','print',NULL,'2026-09-06 17:00:13'),(261,'cash','download',NULL,'2026-09-06 17:00:13'),(262,'cash','share',NULL,'2026-09-06 17:00:13'),(263,'cash','assign',NULL,'2026-09-06 17:00:13'),(264,'cash','manage',NULL,'2026-09-06 17:00:13'),(265,'bank','view',NULL,'2026-09-06 17:00:13'),(266,'bank','add',NULL,'2026-09-06 17:00:13'),(267,'bank','edit',NULL,'2026-09-06 17:00:13'),(268,'bank','delete',NULL,'2026-09-06 17:00:13'),(269,'bank','approve',NULL,'2026-09-06 17:00:13'),(270,'bank','export',NULL,'2026-09-06 17:00:13'),(271,'bank','import',NULL,'2026-09-06 17:00:13'),(272,'bank','print',NULL,'2026-09-06 17:00:13'),(273,'bank','download',NULL,'2026-09-06 17:00:13'),(274,'bank','share',NULL,'2026-09-06 17:00:13'),(275,'bank','assign',NULL,'2026-09-06 17:00:13'),(276,'bank','manage',NULL,'2026-09-06 17:00:13'),(277,'ledger','view',NULL,'2026-09-06 17:00:13'),(278,'ledger','add',NULL,'2026-09-06 17:00:13'),(279,'ledger','edit',NULL,'2026-09-06 17:00:13'),(280,'ledger','delete',NULL,'2026-09-06 17:00:13'),(281,'ledger','approve',NULL,'2026-09-06 17:00:13'),(282,'ledger','export',NULL,'2026-09-06 17:00:13'),(283,'ledger','import',NULL,'2026-09-06 17:00:13'),(284,'ledger','print',NULL,'2026-09-06 17:00:13'),(285,'ledger','download',NULL,'2026-09-06 17:00:13'),(286,'ledger','share',NULL,'2026-09-06 17:00:13'),(287,'ledger','assign',NULL,'2026-09-06 17:00:13'),(288,'ledger','manage',NULL,'2026-09-06 17:00:13'),(289,'receivable','view',NULL,'2026-09-06 17:00:13'),(290,'receivable','add',NULL,'2026-09-06 17:00:13'),(291,'receivable','edit',NULL,'2026-09-06 17:00:13'),(292,'receivable','delete',NULL,'2026-09-06 17:00:13'),(293,'receivable','approve',NULL,'2026-09-06 17:00:13'),(294,'receivable','export',NULL,'2026-09-06 17:00:13'),(295,'receivable','import',NULL,'2026-09-06 17:00:13'),(296,'receivable','print',NULL,'2026-09-06 17:00:13'),(297,'receivable','download',NULL,'2026-09-06 17:00:13'),(298,'receivable','share',NULL,'2026-09-06 17:00:13'),(299,'receivable','assign',NULL,'2026-09-06 17:00:13'),(300,'receivable','manage',NULL,'2026-09-06 17:00:13'),(301,'payable','view',NULL,'2026-09-06 17:00:13'),(302,'payable','add',NULL,'2026-09-06 17:00:13'),(303,'payable','edit',NULL,'2026-09-06 17:00:13'),(304,'payable','delete',NULL,'2026-09-06 17:00:13'),(305,'payable','approve',NULL,'2026-09-06 17:00:13'),(306,'payable','export',NULL,'2026-09-06 17:00:13'),(307,'payable','import',NULL,'2026-09-06 17:00:13'),(308,'payable','print',NULL,'2026-09-06 17:00:13'),(309,'payable','download',NULL,'2026-09-06 17:00:13'),(310,'payable','share',NULL,'2026-09-06 17:00:13'),(311,'payable','assign',NULL,'2026-09-06 17:00:13'),(312,'payable','manage',NULL,'2026-09-06 17:00:13'),(313,'tax','view',NULL,'2026-09-06 17:00:13'),(314,'tax','add',NULL,'2026-09-06 17:00:13'),(315,'tax','edit',NULL,'2026-09-06 17:00:13'),(316,'tax','delete',NULL,'2026-09-06 17:00:13'),(317,'tax','approve',NULL,'2026-09-06 17:00:13'),(318,'tax','export',NULL,'2026-09-06 17:00:13'),(319,'tax','import',NULL,'2026-09-06 17:00:13'),(320,'tax','print',NULL,'2026-09-06 17:00:13'),(321,'tax','download',NULL,'2026-09-06 17:00:13'),(322,'tax','share',NULL,'2026-09-06 17:00:13'),(323,'tax','assign',NULL,'2026-09-06 17:00:13'),(324,'tax','manage',NULL,'2026-09-06 17:00:13'),(325,'products','view',NULL,'2026-09-06 17:00:13'),(326,'products','add',NULL,'2026-09-06 17:00:13'),(327,'products','edit',NULL,'2026-09-06 17:00:13'),(328,'products','delete',NULL,'2026-09-06 17:00:13'),(329,'products','approve',NULL,'2026-09-06 17:00:13'),(330,'products','export',NULL,'2026-09-06 17:00:13'),(331,'products','import',NULL,'2026-09-06 17:00:13'),(332,'products','print',NULL,'2026-09-06 17:00:13'),(333,'products','download',NULL,'2026-09-06 17:00:13'),(334,'products','share',NULL,'2026-09-06 17:00:13'),(335,'products','assign',NULL,'2026-09-06 17:00:13'),(336,'products','manage',NULL,'2026-09-06 17:00:13'),(337,'categories','view',NULL,'2026-09-06 17:00:13'),(338,'categories','add',NULL,'2026-09-06 17:00:13'),(339,'categories','edit',NULL,'2026-09-06 17:00:13'),(340,'categories','delete',NULL,'2026-09-06 17:00:13'),(341,'categories','approve',NULL,'2026-09-06 17:00:13'),(342,'categories','export',NULL,'2026-09-06 17:00:13'),(343,'categories','import',NULL,'2026-09-06 17:00:13'),(344,'categories','print',NULL,'2026-09-06 17:00:13'),(345,'categories','download',NULL,'2026-09-06 17:00:13'),(346,'categories','share',NULL,'2026-09-06 17:00:13'),(347,'categories','assign',NULL,'2026-09-06 17:00:13'),(348,'categories','manage',NULL,'2026-09-06 17:00:13'),(349,'brands','view',NULL,'2026-09-06 17:00:13'),(350,'brands','add',NULL,'2026-09-06 17:00:13'),(351,'brands','edit',NULL,'2026-09-06 17:00:13'),(352,'brands','delete',NULL,'2026-09-06 17:00:13'),(353,'brands','approve',NULL,'2026-09-06 17:00:13'),(354,'brands','export',NULL,'2026-09-06 17:00:13'),(355,'brands','import',NULL,'2026-09-06 17:00:13'),(356,'brands','print',NULL,'2026-09-06 17:00:13'),(357,'brands','download',NULL,'2026-09-06 17:00:13'),(358,'brands','share',NULL,'2026-09-06 17:00:13'),(359,'brands','assign',NULL,'2026-09-06 17:00:13'),(360,'brands','manage',NULL,'2026-09-06 17:00:13'),(361,'units','view',NULL,'2026-09-06 17:00:13'),(362,'units','add',NULL,'2026-09-06 17:00:13'),(363,'units','edit',NULL,'2026-09-06 17:00:13'),(364,'units','delete',NULL,'2026-09-06 17:00:13'),(365,'units','approve',NULL,'2026-09-06 17:00:13'),(366,'units','export',NULL,'2026-09-06 17:00:13'),(367,'units','import',NULL,'2026-09-06 17:00:13'),(368,'units','print',NULL,'2026-09-06 17:00:13'),(369,'units','download',NULL,'2026-09-06 17:00:13'),(370,'units','share',NULL,'2026-09-06 17:00:13'),(371,'units','assign',NULL,'2026-09-06 17:00:13'),(372,'units','manage',NULL,'2026-09-06 17:00:13'),(373,'warehouses','view',NULL,'2026-09-06 17:00:13'),(374,'warehouses','add',NULL,'2026-09-06 17:00:13'),(375,'warehouses','edit',NULL,'2026-09-06 17:00:13'),(376,'warehouses','delete',NULL,'2026-09-06 17:00:13'),(377,'warehouses','approve',NULL,'2026-09-06 17:00:13'),(378,'warehouses','export',NULL,'2026-09-06 17:00:13'),(379,'warehouses','import',NULL,'2026-09-06 17:00:13'),(380,'warehouses','print',NULL,'2026-09-06 17:00:13'),(381,'warehouses','download',NULL,'2026-09-06 17:00:13'),(382,'warehouses','share',NULL,'2026-09-06 17:00:13'),(383,'warehouses','assign',NULL,'2026-09-06 17:00:13'),(384,'warehouses','manage',NULL,'2026-09-06 17:00:13'),(385,'stock','view',NULL,'2026-09-06 17:00:13'),(386,'stock','add',NULL,'2026-09-06 17:00:13'),(387,'stock','edit',NULL,'2026-09-06 17:00:13'),(388,'stock','delete',NULL,'2026-09-06 17:00:13'),(389,'stock','approve',NULL,'2026-09-06 17:00:13'),(390,'stock','export',NULL,'2026-09-06 17:00:13'),(391,'stock','import',NULL,'2026-09-06 17:00:13'),(392,'stock','print',NULL,'2026-09-06 17:00:13'),(393,'stock','download',NULL,'2026-09-06 17:00:13'),(394,'stock','share',NULL,'2026-09-06 17:00:13'),(395,'stock','assign',NULL,'2026-09-06 17:00:13'),(396,'stock','manage',NULL,'2026-09-06 17:00:13'),(397,'employees','view',NULL,'2026-09-06 17:00:13'),(398,'employees','add',NULL,'2026-09-06 17:00:13'),(399,'employees','edit',NULL,'2026-09-06 17:00:13'),(400,'employees','delete',NULL,'2026-09-06 17:00:13'),(401,'employees','approve',NULL,'2026-09-06 17:00:13'),(402,'employees','export',NULL,'2026-09-06 17:00:13'),(403,'employees','import',NULL,'2026-09-06 17:00:13'),(404,'employees','print',NULL,'2026-09-06 17:00:13'),(405,'employees','download',NULL,'2026-09-06 17:00:13'),(406,'employees','share',NULL,'2026-09-06 17:00:13'),(407,'employees','assign',NULL,'2026-09-06 17:00:13'),(408,'employees','manage',NULL,'2026-09-06 17:00:13'),(409,'departments','view',NULL,'2026-09-06 17:00:13'),(410,'departments','add',NULL,'2026-09-06 17:00:13'),(411,'departments','edit',NULL,'2026-09-06 17:00:13'),(412,'departments','delete',NULL,'2026-09-06 17:00:13'),(413,'departments','approve',NULL,'2026-09-06 17:00:13'),(414,'departments','export',NULL,'2026-09-06 17:00:13'),(415,'departments','import',NULL,'2026-09-06 17:00:13'),(416,'departments','print',NULL,'2026-09-06 17:00:13'),(417,'departments','download',NULL,'2026-09-06 17:00:13'),(418,'departments','share',NULL,'2026-09-06 17:00:13'),(419,'departments','assign',NULL,'2026-09-06 17:00:13'),(420,'departments','manage',NULL,'2026-09-06 17:00:13'),(421,'designations','view',NULL,'2026-09-06 17:00:13'),(422,'designations','add',NULL,'2026-09-06 17:00:13'),(423,'designations','edit',NULL,'2026-09-06 17:00:13'),(424,'designations','delete',NULL,'2026-09-06 17:00:13'),(425,'designations','approve',NULL,'2026-09-06 17:00:13'),(426,'designations','export',NULL,'2026-09-06 17:00:13'),(427,'designations','import',NULL,'2026-09-06 17:00:13'),(428,'designations','print',NULL,'2026-09-06 17:00:13'),(429,'designations','download',NULL,'2026-09-06 17:00:13'),(430,'designations','share',NULL,'2026-09-06 17:00:13'),(431,'designations','assign',NULL,'2026-09-06 17:00:13'),(432,'designations','manage',NULL,'2026-09-06 17:00:13'),(433,'attendance','view',NULL,'2026-09-06 17:00:14'),(434,'attendance','add',NULL,'2026-09-06 17:00:14'),(435,'attendance','edit',NULL,'2026-09-06 17:00:14'),(436,'attendance','delete',NULL,'2026-09-06 17:00:14'),(437,'attendance','approve',NULL,'2026-09-06 17:00:14'),(438,'attendance','export',NULL,'2026-09-06 17:00:14'),(439,'attendance','import',NULL,'2026-09-06 17:00:14'),(440,'attendance','print',NULL,'2026-09-06 17:00:14'),(441,'attendance','download',NULL,'2026-09-06 17:00:14'),(442,'attendance','share',NULL,'2026-09-06 17:00:14'),(443,'attendance','assign',NULL,'2026-09-06 17:00:14'),(444,'attendance','manage',NULL,'2026-09-06 17:00:14'),(445,'leave','view',NULL,'2026-09-06 17:00:14'),(446,'leave','add',NULL,'2026-09-06 17:00:14'),(447,'leave','edit',NULL,'2026-09-06 17:00:14'),(448,'leave','delete',NULL,'2026-09-06 17:00:14'),(449,'leave','approve',NULL,'2026-09-06 17:00:14'),(450,'leave','export',NULL,'2026-09-06 17:00:14'),(451,'leave','import',NULL,'2026-09-06 17:00:14'),(452,'leave','print',NULL,'2026-09-06 17:00:14'),(453,'leave','download',NULL,'2026-09-06 17:00:14'),(454,'leave','share',NULL,'2026-09-06 17:00:14'),(455,'leave','assign',NULL,'2026-09-06 17:00:14'),(456,'leave','manage',NULL,'2026-09-06 17:00:14'),(457,'payroll','view',NULL,'2026-09-06 17:00:14'),(458,'payroll','add',NULL,'2026-09-06 17:00:14'),(459,'payroll','edit',NULL,'2026-09-06 17:00:14'),(460,'payroll','delete',NULL,'2026-09-06 17:00:14'),(461,'payroll','approve',NULL,'2026-09-06 17:00:14'),(462,'payroll','export',NULL,'2026-09-06 17:00:14'),(463,'payroll','import',NULL,'2026-09-06 17:00:14'),(464,'payroll','print',NULL,'2026-09-06 17:00:14'),(465,'payroll','download',NULL,'2026-09-06 17:00:14'),(466,'payroll','share',NULL,'2026-09-06 17:00:14'),(467,'payroll','assign',NULL,'2026-09-06 17:00:14'),(468,'payroll','manage',NULL,'2026-09-06 17:00:14'),(469,'performance','view',NULL,'2026-09-06 17:00:14'),(470,'performance','add',NULL,'2026-09-06 17:00:14'),(471,'performance','edit',NULL,'2026-09-06 17:00:14'),(472,'performance','delete',NULL,'2026-09-06 17:00:14'),(473,'performance','approve',NULL,'2026-09-06 17:00:14'),(474,'performance','export',NULL,'2026-09-06 17:00:14'),(475,'performance','import',NULL,'2026-09-06 17:00:14'),(476,'performance','print',NULL,'2026-09-06 17:00:14'),(477,'performance','download',NULL,'2026-09-06 17:00:14'),(478,'performance','share',NULL,'2026-09-06 17:00:14'),(479,'performance','assign',NULL,'2026-09-06 17:00:14'),(480,'performance','manage',NULL,'2026-09-06 17:00:14'),(481,'projects','view',NULL,'2026-09-06 17:00:14'),(482,'projects','add',NULL,'2026-09-06 17:00:14'),(483,'projects','edit',NULL,'2026-09-06 17:00:14'),(484,'projects','delete',NULL,'2026-09-06 17:00:14'),(485,'projects','approve',NULL,'2026-09-06 17:00:14'),(486,'projects','export',NULL,'2026-09-06 17:00:14'),(487,'projects','import',NULL,'2026-09-06 17:00:14'),(488,'projects','print',NULL,'2026-09-06 17:00:14'),(489,'projects','download',NULL,'2026-09-06 17:00:14'),(490,'projects','share',NULL,'2026-09-06 17:00:14'),(491,'projects','assign',NULL,'2026-09-06 17:00:14'),(492,'projects','manage',NULL,'2026-09-06 17:00:14'),(493,'milestones','view',NULL,'2026-09-06 17:00:14'),(494,'milestones','add',NULL,'2026-09-06 17:00:14'),(495,'milestones','edit',NULL,'2026-09-06 17:00:14'),(496,'milestones','delete',NULL,'2026-09-06 17:00:14'),(497,'milestones','approve',NULL,'2026-09-06 17:00:14'),(498,'milestones','export',NULL,'2026-09-06 17:00:14'),(499,'milestones','import',NULL,'2026-09-06 17:00:14'),(500,'milestones','print',NULL,'2026-09-06 17:00:14'),(501,'milestones','download',NULL,'2026-09-06 17:00:14'),(502,'milestones','share',NULL,'2026-09-06 17:00:14'),(503,'milestones','assign',NULL,'2026-09-06 17:00:14'),(504,'milestones','manage',NULL,'2026-09-06 17:00:14'),(505,'tasks','view',NULL,'2026-09-06 17:00:14'),(506,'tasks','add',NULL,'2026-09-06 17:00:14'),(507,'tasks','edit',NULL,'2026-09-06 17:00:14'),(508,'tasks','delete',NULL,'2026-09-06 17:00:14'),(509,'tasks','approve',NULL,'2026-09-06 17:00:14'),(510,'tasks','export',NULL,'2026-09-06 17:00:14'),(511,'tasks','import',NULL,'2026-09-06 17:00:14'),(512,'tasks','print',NULL,'2026-09-06 17:00:14'),(513,'tasks','download',NULL,'2026-09-06 17:00:14'),(514,'tasks','share',NULL,'2026-09-06 17:00:14'),(515,'tasks','assign',NULL,'2026-09-06 17:00:14'),(516,'tasks','manage',NULL,'2026-09-06 17:00:14'),(517,'subtasks','view',NULL,'2026-09-06 17:00:14'),(518,'subtasks','add',NULL,'2026-09-06 17:00:14'),(519,'subtasks','edit',NULL,'2026-09-06 17:00:14'),(520,'subtasks','delete',NULL,'2026-09-06 17:00:14'),(521,'subtasks','approve',NULL,'2026-09-06 17:00:14'),(522,'subtasks','export',NULL,'2026-09-06 17:00:14'),(523,'subtasks','import',NULL,'2026-09-06 17:00:14'),(524,'subtasks','print',NULL,'2026-09-06 17:00:14'),(525,'subtasks','download',NULL,'2026-09-06 17:00:14'),(526,'subtasks','share',NULL,'2026-09-06 17:00:14'),(527,'subtasks','assign',NULL,'2026-09-06 17:00:14'),(528,'subtasks','manage',NULL,'2026-09-06 17:00:14'),(529,'timesheets','view',NULL,'2026-09-06 17:00:14'),(530,'timesheets','add',NULL,'2026-09-06 17:00:14'),(531,'timesheets','edit',NULL,'2026-09-06 17:00:14'),(532,'timesheets','delete',NULL,'2026-09-06 17:00:14'),(533,'timesheets','approve',NULL,'2026-09-06 17:00:14'),(534,'timesheets','export',NULL,'2026-09-06 17:00:14'),(535,'timesheets','import',NULL,'2026-09-06 17:00:14'),(536,'timesheets','print',NULL,'2026-09-06 17:00:14'),(537,'timesheets','download',NULL,'2026-09-06 17:00:14'),(538,'timesheets','share',NULL,'2026-09-06 17:00:14'),(539,'timesheets','assign',NULL,'2026-09-06 17:00:14'),(540,'timesheets','manage',NULL,'2026-09-06 17:00:14'),(541,'tickets','view',NULL,'2026-09-06 17:00:14'),(542,'tickets','add',NULL,'2026-09-06 17:00:14'),(543,'tickets','edit',NULL,'2026-09-06 17:00:14'),(544,'tickets','delete',NULL,'2026-09-06 17:00:14'),(545,'tickets','approve',NULL,'2026-09-06 17:00:14'),(546,'tickets','export',NULL,'2026-09-06 17:00:14'),(547,'tickets','import',NULL,'2026-09-06 17:00:14'),(548,'tickets','print',NULL,'2026-09-06 17:00:14'),(549,'tickets','download',NULL,'2026-09-06 17:00:14'),(550,'tickets','share',NULL,'2026-09-06 17:00:14'),(551,'tickets','assign',NULL,'2026-09-06 17:00:14'),(552,'tickets','manage',NULL,'2026-09-06 17:00:14'),(553,'knowledge_base','view',NULL,'2026-09-06 17:00:14'),(554,'knowledge_base','add',NULL,'2026-09-06 17:00:14'),(555,'knowledge_base','edit',NULL,'2026-09-06 17:00:14'),(556,'knowledge_base','delete',NULL,'2026-09-06 17:00:14'),(557,'knowledge_base','approve',NULL,'2026-09-06 17:00:14'),(558,'knowledge_base','export',NULL,'2026-09-06 17:00:14'),(559,'knowledge_base','import',NULL,'2026-09-06 17:00:14'),(560,'knowledge_base','print',NULL,'2026-09-06 17:00:14'),(561,'knowledge_base','download',NULL,'2026-09-06 17:00:14'),(562,'knowledge_base','share',NULL,'2026-09-06 17:00:14'),(563,'knowledge_base','assign',NULL,'2026-09-06 17:00:14'),(564,'knowledge_base','manage',NULL,'2026-09-06 17:00:14'),(565,'campaigns','view',NULL,'2026-09-06 17:00:14'),(566,'campaigns','add',NULL,'2026-09-06 17:00:14'),(567,'campaigns','edit',NULL,'2026-09-06 17:00:14'),(568,'campaigns','delete',NULL,'2026-09-06 17:00:14'),(569,'campaigns','approve',NULL,'2026-09-06 17:00:14'),(570,'campaigns','export',NULL,'2026-09-06 17:00:14'),(571,'campaigns','import',NULL,'2026-09-06 17:00:14'),(572,'campaigns','print',NULL,'2026-09-06 17:00:14'),(573,'campaigns','download',NULL,'2026-09-06 17:00:14'),(574,'campaigns','share',NULL,'2026-09-06 17:00:14'),(575,'campaigns','assign',NULL,'2026-09-06 17:00:14'),(576,'campaigns','manage',NULL,'2026-09-06 17:00:14'),(577,'email_marketing','view',NULL,'2026-09-06 17:00:14'),(578,'email_marketing','add',NULL,'2026-09-06 17:00:14'),(579,'email_marketing','edit',NULL,'2026-09-06 17:00:14'),(580,'email_marketing','delete',NULL,'2026-09-06 17:00:14'),(581,'email_marketing','approve',NULL,'2026-09-06 17:00:14'),(582,'email_marketing','export',NULL,'2026-09-06 17:00:14'),(583,'email_marketing','import',NULL,'2026-09-06 17:00:14'),(584,'email_marketing','print',NULL,'2026-09-06 17:00:14'),(585,'email_marketing','download',NULL,'2026-09-06 17:00:14'),(586,'email_marketing','share',NULL,'2026-09-06 17:00:14'),(587,'email_marketing','assign',NULL,'2026-09-06 17:00:14'),(588,'email_marketing','manage',NULL,'2026-09-06 17:00:14'),(589,'sms','view',NULL,'2026-09-06 17:00:14'),(590,'sms','add',NULL,'2026-09-06 17:00:14'),(591,'sms','edit',NULL,'2026-09-06 17:00:14'),(592,'sms','delete',NULL,'2026-09-06 17:00:14'),(593,'sms','approve',NULL,'2026-09-06 17:00:14'),(594,'sms','export',NULL,'2026-09-06 17:00:14'),(595,'sms','import',NULL,'2026-09-06 17:00:14'),(596,'sms','print',NULL,'2026-09-06 17:00:14'),(597,'sms','download',NULL,'2026-09-06 17:00:14'),(598,'sms','share',NULL,'2026-09-06 17:00:14'),(599,'sms','assign',NULL,'2026-09-06 17:00:14'),(600,'sms','manage',NULL,'2026-09-06 17:00:14'),(601,'whatsapp','view',NULL,'2026-09-06 17:00:14'),(602,'whatsapp','add',NULL,'2026-09-06 17:00:14'),(603,'whatsapp','edit',NULL,'2026-09-06 17:00:14'),(604,'whatsapp','delete',NULL,'2026-09-06 17:00:14'),(605,'whatsapp','approve',NULL,'2026-09-06 17:00:14'),(606,'whatsapp','export',NULL,'2026-09-06 17:00:14'),(607,'whatsapp','import',NULL,'2026-09-06 17:00:14'),(608,'whatsapp','print',NULL,'2026-09-06 17:00:14'),(609,'whatsapp','download',NULL,'2026-09-06 17:00:14'),(610,'whatsapp','share',NULL,'2026-09-06 17:00:14'),(611,'whatsapp','assign',NULL,'2026-09-06 17:00:14'),(612,'whatsapp','manage',NULL,'2026-09-06 17:00:14'),(613,'documents','view',NULL,'2026-09-06 17:00:14'),(614,'documents','add',NULL,'2026-09-06 17:00:14'),(615,'documents','edit',NULL,'2026-09-06 17:00:14'),(616,'documents','delete',NULL,'2026-09-06 17:00:14'),(617,'documents','approve',NULL,'2026-09-06 17:00:14'),(618,'documents','export',NULL,'2026-09-06 17:00:14'),(619,'documents','import',NULL,'2026-09-06 17:00:14'),(620,'documents','print',NULL,'2026-09-06 17:00:14'),(621,'documents','download',NULL,'2026-09-06 17:00:14'),(622,'documents','share',NULL,'2026-09-06 17:00:14'),(623,'documents','assign',NULL,'2026-09-06 17:00:14'),(624,'documents','manage',NULL,'2026-09-06 17:00:14'),(625,'reports','view',NULL,'2026-09-06 17:00:14'),(626,'reports','add',NULL,'2026-09-06 17:00:14'),(627,'reports','edit',NULL,'2026-09-06 17:00:14'),(628,'reports','delete',NULL,'2026-09-06 17:00:14'),(629,'reports','approve',NULL,'2026-09-06 17:00:14'),(630,'reports','export',NULL,'2026-09-06 17:00:14'),(631,'reports','import',NULL,'2026-09-06 17:00:14'),(632,'reports','print',NULL,'2026-09-06 17:00:14'),(633,'reports','download',NULL,'2026-09-06 17:00:14'),(634,'reports','share',NULL,'2026-09-06 17:00:14'),(635,'reports','assign',NULL,'2026-09-06 17:00:15'),(636,'reports','manage',NULL,'2026-09-06 17:00:15'),(637,'settings','view',NULL,'2026-09-06 17:00:15'),(638,'settings','add',NULL,'2026-09-06 17:00:15'),(639,'settings','edit',NULL,'2026-09-06 17:00:15'),(640,'settings','delete',NULL,'2026-09-06 17:00:15'),(641,'settings','approve',NULL,'2026-09-06 17:00:15'),(642,'settings','export',NULL,'2026-09-06 17:00:15'),(643,'settings','import',NULL,'2026-09-06 17:00:15'),(644,'settings','print',NULL,'2026-09-06 17:00:15'),(645,'settings','download',NULL,'2026-09-06 17:00:15'),(646,'settings','share',NULL,'2026-09-06 17:00:15'),(647,'settings','assign',NULL,'2026-09-06 17:00:15'),(648,'settings','manage',NULL,'2026-09-06 17:00:15'),(649,'branches','view',NULL,'2026-09-06 17:00:15'),(650,'branches','add',NULL,'2026-09-06 17:00:15'),(651,'branches','edit',NULL,'2026-09-06 17:00:15'),(652,'branches','delete',NULL,'2026-09-06 17:00:15'),(653,'branches','approve',NULL,'2026-09-06 17:00:15'),(654,'branches','export',NULL,'2026-09-06 17:00:15'),(655,'branches','import',NULL,'2026-09-06 17:00:15'),(656,'branches','print',NULL,'2026-09-06 17:00:15'),(657,'branches','download',NULL,'2026-09-06 17:00:15'),(658,'branches','share',NULL,'2026-09-06 17:00:15'),(659,'branches','assign',NULL,'2026-09-06 17:00:15'),(660,'branches','manage',NULL,'2026-09-06 17:00:15'),(661,'sub_branches','view',NULL,'2026-09-06 17:00:15'),(662,'sub_branches','add',NULL,'2026-09-06 17:00:15'),(663,'sub_branches','edit',NULL,'2026-09-06 17:00:15'),(664,'sub_branches','delete',NULL,'2026-09-06 17:00:15'),(665,'sub_branches','approve',NULL,'2026-09-06 17:00:15'),(666,'sub_branches','export',NULL,'2026-09-06 17:00:15'),(667,'sub_branches','import',NULL,'2026-09-06 17:00:15'),(668,'sub_branches','print',NULL,'2026-09-06 17:00:15'),(669,'sub_branches','download',NULL,'2026-09-06 17:00:15'),(670,'sub_branches','share',NULL,'2026-09-06 17:00:15'),(671,'sub_branches','assign',NULL,'2026-09-06 17:00:15'),(672,'sub_branches','manage',NULL,'2026-09-06 17:00:15'),(673,'teams','view',NULL,'2026-09-06 17:00:15'),(674,'teams','add',NULL,'2026-09-06 17:00:15'),(675,'teams','edit',NULL,'2026-09-06 17:00:15'),(676,'teams','delete',NULL,'2026-09-06 17:00:15'),(677,'teams','approve',NULL,'2026-09-06 17:00:15'),(678,'teams','export',NULL,'2026-09-06 17:00:15'),(679,'teams','import',NULL,'2026-09-06 17:00:15'),(680,'teams','print',NULL,'2026-09-06 17:00:15'),(681,'teams','download',NULL,'2026-09-06 17:00:15'),(682,'teams','share',NULL,'2026-09-06 17:00:15'),(683,'teams','assign',NULL,'2026-09-06 17:00:15'),(684,'teams','manage',NULL,'2026-09-06 17:00:15'),(685,'vendors','view',NULL,'2026-09-06 17:00:15'),(686,'vendors','add',NULL,'2026-09-06 17:00:15'),(687,'vendors','edit',NULL,'2026-09-06 17:00:15'),(688,'vendors','delete',NULL,'2026-09-06 17:00:15'),(689,'vendors','approve',NULL,'2026-09-06 17:00:15'),(690,'vendors','export',NULL,'2026-09-06 17:00:15'),(691,'vendors','import',NULL,'2026-09-06 17:00:15'),(692,'vendors','print',NULL,'2026-09-06 17:00:15'),(693,'vendors','download',NULL,'2026-09-06 17:00:15'),(694,'vendors','share',NULL,'2026-09-06 17:00:15'),(695,'vendors','assign',NULL,'2026-09-06 17:00:15'),(696,'vendors','manage',NULL,'2026-09-06 17:00:15'),(697,'automation','view',NULL,'2026-09-06 17:00:15'),(698,'automation','add',NULL,'2026-09-06 17:00:15'),(699,'automation','edit',NULL,'2026-09-06 17:00:15'),(700,'automation','delete',NULL,'2026-09-06 17:00:15'),(701,'automation','approve',NULL,'2026-09-06 17:00:15'),(702,'automation','export',NULL,'2026-09-06 17:00:15'),(703,'automation','import',NULL,'2026-09-06 17:00:15'),(704,'automation','print',NULL,'2026-09-06 17:00:15'),(705,'automation','download',NULL,'2026-09-06 17:00:15'),(706,'automation','share',NULL,'2026-09-06 17:00:15'),(707,'automation','assign',NULL,'2026-09-06 17:00:15'),(708,'automation','manage',NULL,'2026-09-06 17:00:15'),(709,'audit_logs','view',NULL,'2026-09-06 17:00:15'),(710,'audit_logs','add',NULL,'2026-09-06 17:00:15'),(711,'audit_logs','edit',NULL,'2026-09-06 17:00:15'),(712,'audit_logs','delete',NULL,'2026-09-06 17:00:15'),(713,'audit_logs','approve',NULL,'2026-09-06 17:00:15'),(714,'audit_logs','export',NULL,'2026-09-06 17:00:15'),(715,'audit_logs','import',NULL,'2026-09-06 17:00:15'),(716,'audit_logs','print',NULL,'2026-09-06 17:00:15'),(717,'audit_logs','download',NULL,'2026-09-06 17:00:15'),(718,'audit_logs','share',NULL,'2026-09-06 17:00:15'),(719,'audit_logs','assign',NULL,'2026-09-06 17:00:15'),(720,'audit_logs','manage',NULL,'2026-09-06 17:00:15');
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_categories`
--

DROP TABLE IF EXISTS `product_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `parent_id` int(11) DEFAULT NULL,
  `image_url` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `product_categories_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_categories`
--

LOCK TABLES `product_categories` WRITE;
/*!40000 ALTER TABLE `product_categories` DISABLE KEYS */;
INSERT INTO `product_categories` VALUES (1,1,'IT Hardware & Systems',NULL,NULL,'Laptops, Servers, Monitors and Accessories',1,'2026-09-11 06:23:59','2026-09-11 06:23:59'),(2,1,'Office Stationery & Paper',NULL,NULL,'Premium paper, printing sheets, and envelopes',1,'2026-09-11 06:23:59','2026-09-11 06:23:59'),(3,1,'Printing Machines & Spares',NULL,NULL,'Offset & digital printing components',1,'2026-09-11 06:23:59','2026-09-11 06:23:59'),(4,1,'Software Licenses & Subscriptions',NULL,NULL,'Operating systems, CRM, and cloud tools',1,'2026-09-11 06:23:59','2026-09-11 06:23:59');
/*!40000 ALTER TABLE `product_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sku` varchar(100) DEFAULT NULL,
  `barcode` varchar(100) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `brand_id` int(11) DEFAULT NULL,
  `unit_id` int(11) DEFAULT NULL,
  `type` varchar(50) DEFAULT 'goods',
  `description` text DEFAULT NULL,
  `purchase_price` decimal(12,2) DEFAULT 0.00,
  `selling_price` decimal(12,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `opening_stock` decimal(10,2) DEFAULT 0.00,
  `current_stock` decimal(10,2) DEFAULT 0.00,
  `minimum_stock` decimal(10,2) DEFAULT 0.00,
  `maximum_stock` decimal(10,2) DEFAULT 0.00,
  `warehouse_id` int(11) DEFAULT NULL,
  `has_batch` tinyint(1) DEFAULT 0,
  `has_serial` tinyint(1) DEFAULT 0,
  `image_url` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `products_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,'HP LaserJet Pro MFP 4104fdw','PRD-HP-4104',NULL,3,1,1,'goods','High speed enterprise monochrome multifunction printer',28500.00,34999.00,18.00,25.00,25.00,5.00,100.00,1,0,0,NULL,'active','2026-09-11 06:24:28','2026-09-11 06:24:28'),(2,1,'Canon imageRUNNER 2625i Drum Unit','PRD-CAN-DRUM',NULL,3,2,1,'goods','Original high capacity replacement OPC drum cartridge',7200.00,9500.00,18.00,40.00,12.00,10.00,80.00,1,0,0,NULL,'active','2026-09-11 06:24:28','2026-09-11 06:24:28'),(3,1,'A4 Premium Multipurpose Copier Paper 75 GSM (Box of 5 Reams)','PRD-PPR-A4-75',NULL,2,4,6,'goods','High brightness jam-free bond paper for commercial printing',1150.00,1450.00,12.00,150.00,45.00,20.00,500.00,2,0,0,NULL,'active','2026-09-11 06:24:28','2026-09-11 06:24:28'),(4,1,'Dell 27-inch 4K UHD USB-C Hub Monitor (U2723QE)','PRD-DEL-U2723',NULL,1,3,1,'goods','Professional color accurate IPS Black display for designers',42000.00,51900.00,18.00,15.00,3.00,5.00,50.00,1,0,0,NULL,'active','2026-09-11 06:24:28','2026-09-11 06:24:28'),(5,1,'Annual CRM Cloud Maintenance & AMC Contract','SRV-CRM-AMC',NULL,4,4,10,'services','24/7 Priority SLA technical support and server backup maintenance',18000.00,24000.00,18.00,0.00,999.00,0.00,9999.00,1,0,0,NULL,'active','2026-09-11 06:24:28','2026-09-11 06:24:28');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `projects`
--

DROP TABLE IF EXISTS `projects`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `projects` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `project_type` varchar(100) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Open',
  `progress` int(11) DEFAULT 0,
  `price` decimal(12,2) DEFAULT 0.00,
  `start_date` date DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `branch_id` int(11) DEFAULT NULL,
  `sub_branch_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `projects`
--

LOCK TABLES `projects` WRITE;
/*!40000 ALTER TABLE `projects` DISABLE KEYS */;
/*!40000 ALTER TABLE `projects` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_invoice_items`
--

DROP TABLE IF EXISTS `purchase_invoice_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_invoice_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_invoice_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `purchase_invoice_id` (`purchase_invoice_id`),
  CONSTRAINT `purchase_invoice_items_ibfk_1` FOREIGN KEY (`purchase_invoice_id`) REFERENCES `purchase_invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_invoice_items`
--

LOCK TABLES `purchase_invoice_items` WRITE;
/*!40000 ALTER TABLE `purchase_invoice_items` DISABLE KEYS */;
INSERT INTO `purchase_invoice_items` VALUES (1,1,1,'HP LaserJet Pro MFP 4104fdw',2.00,28500.00,18.00,67260.00);
/*!40000 ALTER TABLE `purchase_invoice_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_invoices`
--

DROP TABLE IF EXISTS `purchase_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) NOT NULL,
  `purchase_order_id` int(11) DEFAULT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `invoice_date` date NOT NULL,
  `due_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `tax_amount` decimal(12,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  `paid_amount` decimal(12,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'unpaid',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `purchase_invoices_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_invoices`
--

LOCK TABLES `purchase_invoices` WRITE;
/*!40000 ALTER TABLE `purchase_invoices` DISABLE KEYS */;
INSERT INTO `purchase_invoices` VALUES (1,1,NULL,1,1,'PINV-2026-001','2026-09-08','2026-09-22',57000.00,10260.00,67260.00,28500.00,'partially_paid','Standard 15 days credit terms',NULL,'2026-09-11 06:24:29','2026-09-11 06:24:29');
/*!40000 ALTER TABLE `purchase_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_order_items`
--

DROP TABLE IF EXISTS `purchase_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `purchase_order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  `received_quantity` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `purchase_order_id` (`purchase_order_id`),
  CONSTRAINT `purchase_order_items_ibfk_1` FOREIGN KEY (`purchase_order_id`) REFERENCES `purchase_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_order_items`
--

LOCK TABLES `purchase_order_items` WRITE;
/*!40000 ALTER TABLE `purchase_order_items` DISABLE KEYS */;
INSERT INTO `purchase_order_items` VALUES (1,1,1,'HP LaserJet Pro MFP 4104fdw',2.00,28500.00,18.00,67260.00,0.00);
/*!40000 ALTER TABLE `purchase_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_orders`
--

DROP TABLE IF EXISTS `purchase_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `order_date` date NOT NULL,
  `expected_date` date DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `tax_amount` decimal(12,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `purchase_orders_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_orders`
--

LOCK TABLES `purchase_orders` WRITE;
/*!40000 ALTER TABLE `purchase_orders` DISABLE KEYS */;
INSERT INTO `purchase_orders` VALUES (1,1,NULL,1,'PO-2026-001','2026-09-07','2026-09-14',57000.00,0.00,10260.00,67260.00,'approved','Urgent procurement for corporate client rollout',NULL,'2026-09-11 06:24:28','2026-09-11 06:24:28');
/*!40000 ALTER TABLE `purchase_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchase_returns`
--

DROP TABLE IF EXISTS `purchase_returns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `purchase_returns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `purchase_invoice_id` int(11) DEFAULT NULL,
  `return_number` varchar(50) NOT NULL,
  `return_date` date NOT NULL,
  `total` decimal(12,2) DEFAULT 0.00,
  `reason` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `purchase_returns_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchase_returns`
--

LOCK TABLES `purchase_returns` WRITE;
/*!40000 ALTER TABLE `purchase_returns` DISABLE KEYS */;
INSERT INTO `purchase_returns` VALUES (1,1,2,1,'PRET-2026-001','2026-09-10',2300.00,'Damaged packaging during transit for paper reams','approved',NULL,'2026-09-11 06:24:46','2026-09-11 06:24:46');
/*!40000 ALTER TABLE `purchase_returns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotation_items`
--

DROP TABLE IF EXISTS `quotation_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quotation_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quotation_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `quotation_id` (`quotation_id`),
  CONSTRAINT `quotation_items_ibfk_1` FOREIGN KEY (`quotation_id`) REFERENCES `quotations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotation_items`
--

LOCK TABLES `quotation_items` WRITE;
/*!40000 ALTER TABLE `quotation_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `quotation_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quotations`
--

DROP TABLE IF EXISTS `quotations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `quotations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `quotation_number` varchar(50) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `tax_amount` decimal(12,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  `validity_days` int(11) DEFAULT 30,
  `terms` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `accepted_at` datetime DEFAULT NULL,
  `rejected_at` datetime DEFAULT NULL,
  `converted_to_invoice` tinyint(1) DEFAULT 0,
  `invoice_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `quotations_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quotations`
--

LOCK TABLES `quotations` WRITE;
/*!40000 ALTER TABLE `quotations` DISABLE KEYS */;
INSERT INTO `quotations` VALUES (1,1,1,1,'QUO-2026-001','Tech Quote Mumbai',NULL,0.00,0.00,0.00,0.00,0.00,5000.00,30,NULL,NULL,'draft',NULL,NULL,0,NULL,1,'2026-09-06 18:28:43','2026-09-06 18:28:43');
/*!40000 ALTER TABLE `quotations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_invoices`
--

DROP TABLE IF EXISTS `recurring_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recurring_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `frequency` varchar(50) NOT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `next_generate_date` date DEFAULT NULL,
  `total` decimal(12,2) DEFAULT 0.00,
  `status` varchar(50) DEFAULT 'active',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `recurring_invoices_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_invoices`
--

LOCK TABLES `recurring_invoices` WRITE;
/*!40000 ALTER TABLE `recurring_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurring_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refunds`
--

DROP TABLE IF EXISTS `refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refunds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `invoice_id` int(11) DEFAULT NULL,
  `payment_id` int(11) DEFAULT NULL,
  `refund_number` varchar(50) NOT NULL,
  `date` date NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `refunds_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refunds`
--

LOCK TABLES `refunds` WRITE;
/*!40000 ALTER TABLE `refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reminders`
--

DROP TABLE IF EXISTS `reminders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reminders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `module_type` varchar(50) NOT NULL,
  `module_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text DEFAULT NULL,
  `remind_at` datetime NOT NULL,
  `is_sent` tinyint(1) DEFAULT 0,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `reminders_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reminders`
--

LOCK TABLES `reminders` WRITE;
/*!40000 ALTER TABLE `reminders` DISABLE KEYS */;
/*!40000 ALTER TABLE `reminders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_permissions`
--

DROP TABLE IF EXISTS `role_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `granted` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_role_perm` (`role_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `role_permissions_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_permissions`
--

LOCK TABLES `role_permissions` WRITE;
/*!40000 ALTER TABLE `role_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `role_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Super Admin','Full unrestricted master access across all companies and modules','2026-08-12 01:35:33'),(2,'Admin','Administrative access for assigned companies and team delegation','2026-08-12 01:35:33'),(3,'Teams','Operational team member access','2026-08-12 01:35:33'),(4,'Clients','Client portal access','2026-08-12 01:35:33');
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_order_items`
--

DROP TABLE IF EXISTS `sales_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sales_order_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `unit_price` decimal(12,2) DEFAULT 0.00,
  `discount_percent` decimal(5,2) DEFAULT 0.00,
  `tax_percent` decimal(5,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `sales_order_id` (`sales_order_id`),
  CONSTRAINT `sales_order_items_ibfk_1` FOREIGN KEY (`sales_order_id`) REFERENCES `sales_orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_order_items`
--

LOCK TABLES `sales_order_items` WRITE;
/*!40000 ALTER TABLE `sales_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales_orders`
--

DROP TABLE IF EXISTS `sales_orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sales_orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `order_number` varchar(50) NOT NULL,
  `quotation_id` int(11) DEFAULT NULL,
  `order_date` date NOT NULL,
  `delivery_date` date DEFAULT NULL,
  `shipping_address` text DEFAULT NULL,
  `subtotal` decimal(12,2) DEFAULT 0.00,
  `discount_amount` decimal(12,2) DEFAULT 0.00,
  `tax_amount` decimal(12,2) DEFAULT 0.00,
  `shipping_cost` decimal(12,2) DEFAULT 0.00,
  `total` decimal(12,2) DEFAULT 0.00,
  `payment_status` varchar(50) DEFAULT 'unpaid',
  `status` varchar(50) DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `sales_orders_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales_orders`
--

LOCK TABLES `sales_orders` WRITE;
/*!40000 ALTER TABLE `sales_orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `sales_orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sla_policies`
--

DROP TABLE IF EXISTS `sla_policies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sla_policies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `priority` varchar(50) NOT NULL,
  `first_response_hours` int(11) DEFAULT 4,
  `resolution_hours` int(11) DEFAULT 24,
  `business_hours_only` tinyint(1) DEFAULT 1,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `sla_policies_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sla_policies`
--

LOCK TABLES `sla_policies` WRITE;
/*!40000 ALTER TABLE `sla_policies` DISABLE KEYS */;
/*!40000 ALTER TABLE `sla_policies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_campaigns`
--

DROP TABLE IF EXISTS `sms_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sms_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `recipient_list` text DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `total_sent` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `sms_campaigns_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_campaigns`
--

LOCK TABLES `sms_campaigns` WRITE;
/*!40000 ALTER TABLE `sms_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock`
--

DROP TABLE IF EXISTS `stock`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 0.00,
  `reserved_quantity` decimal(10,2) DEFAULT 0.00,
  `batch_number` varchar(100) DEFAULT NULL,
  `serial_number` varchar(100) DEFAULT NULL,
  `expiry_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `product_id` (`product_id`),
  KEY `warehouse_id` (`warehouse_id`),
  CONSTRAINT `stock_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  CONSTRAINT `stock_ibfk_2` FOREIGN KEY (`warehouse_id`) REFERENCES `warehouses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock`
--

LOCK TABLES `stock` WRITE;
/*!40000 ALTER TABLE `stock` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_adjustments`
--

DROP TABLE IF EXISTS `stock_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `warehouse_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `adjustment_type` varchar(50) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `reason` text DEFAULT NULL,
  `adjustment_date` date NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `stock_adjustments_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_adjustments`
--

LOCK TABLES `stock_adjustments` WRITE;
/*!40000 ALTER TABLE `stock_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stock_transfers`
--

DROP TABLE IF EXISTS `stock_transfers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stock_transfers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `from_warehouse_id` int(11) NOT NULL,
  `to_warehouse_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` decimal(10,2) NOT NULL,
  `transfer_date` date NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `notes` text DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `stock_transfers_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stock_transfers`
--

LOCK TABLES `stock_transfers` WRITE;
/*!40000 ALTER TABLE `stock_transfers` DISABLE KEYS */;
/*!40000 ALTER TABLE `stock_transfers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sub_branches`
--

DROP TABLE IF EXISTS `sub_branches`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sub_branches` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `branch_id` int(11) NOT NULL,
  `company_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `brand_name` varchar(150) DEFAULT NULL,
  `division_name` varchar(150) DEFAULT NULL,
  `subtitle` varchar(255) DEFAULT NULL,
  `gstin` varchar(50) DEFAULT NULL,
  `pan` varchar(50) DEFAULT NULL,
  `cin` varchar(50) DEFAULT NULL,
  `msme_reg` varchar(100) DEFAULT NULL,
  `website` varchar(255) DEFAULT NULL,
  `signatory_name` varchar(150) DEFAULT NULL,
  `signatory_designation` varchar(150) DEFAULT NULL,
  `signature_image_url` longtext DEFAULT NULL,
  `stamp_image_url` longtext DEFAULT NULL,
  `terms_conditions` longtext DEFAULT NULL,
  `invoice_notes` longtext DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `account_holder` varchar(150) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `account_number` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `bank_branch` varchar(150) DEFAULT NULL,
  `payment_qr_url` longtext DEFAULT NULL,
  `gst_bank_name` varchar(150) DEFAULT NULL,
  `gst_account_holder` varchar(150) DEFAULT NULL,
  `gst_account_number` varchar(100) DEFAULT NULL,
  `gst_ifsc_code` varchar(50) DEFAULT NULL,
  `gst_bank_branch` varchar(150) DEFAULT NULL,
  `gst_upi_id` varchar(100) DEFAULT NULL,
  `gst_payment_qr_url` longtext DEFAULT NULL,
  `nongst_bank_name` varchar(150) DEFAULT NULL,
  `nongst_account_holder` varchar(150) DEFAULT NULL,
  `nongst_account_number` varchar(100) DEFAULT NULL,
  `nongst_ifsc_code` varchar(50) DEFAULT NULL,
  `nongst_bank_branch` varchar(150) DEFAULT NULL,
  `nongst_upi_id` varchar(100) DEFAULT NULL,
  `nongst_payment_qr_url` longtext DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `branch_id` (`branch_id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `sub_branches_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE,
  CONSTRAINT `sub_branches_ibfk_2` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sub_branches`
--

LOCK TABLES `sub_branches` WRITE;
/*!40000 ALTER TABLE `sub_branches` DISABLE KEYS */;
INSERT INTO `sub_branches` VALUES (1,1,1,'Andheri Franchise','SB-AND-01',NULL,NULL,NULL,NULL,NULL,NULL,1,'2026-09-06 18:26:41','2026-09-06 18:26:41',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `sub_branches` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_invoices`
--

DROP TABLE IF EXISTS `subscription_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `subscription_id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_status` enum('paid','unpaid','failed') DEFAULT 'paid',
  `payment_method` enum('upi','credit_card','debit_card','net_banking','wallet') DEFAULT 'upi',
  `paid_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `subscription_id` (`subscription_id`),
  CONSTRAINT `subscription_invoices_ibfk_1` FOREIGN KEY (`subscription_id`) REFERENCES `customer_subscriptions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_invoices`
--

LOCK TABLES `subscription_invoices` WRITE;
/*!40000 ALTER TABLE `subscription_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_packages`
--

DROP TABLE IF EXISTS `subscription_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_packages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `package_code` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `category` enum('Small Business','Medium Business','Enterprise Business') NOT NULL,
  `price_per_month` decimal(10,2) NOT NULL,
  `features` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`features`)),
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `package_code` (`package_code`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_packages`
--

LOCK TABLES `subscription_packages` WRITE;
/*!40000 ALTER TABLE `subscription_packages` DISABLE KEYS */;
INSERT INTO `subscription_packages` VALUES (1,'PKG-01','START','Small Business',1999.00,'[\"8 Premium Posts\", \"1 AI Reel\", \"8 Story Designs\", \"Festive Post\", \"Page Setup\", \"Facebook & IG Management\", \"10K Reach Estimate\", \"Meta Ads Setup Included\", \"Monthly Report\", \"WhatsApp Support\"]','active','2026-08-13 14:03:54'),(2,'PKG-02','GROW','Small Business',4999.00,'[\"12 Premium Posts\", \"2 AI Reels\", \"12 Story Designs\", \"Festive Post\", \"Page Setup\", \"Facebook & IG Management\", \"2 Ad Creatives\", \"25K-30K Reach\", \"8-10 Leads/mo\", \"Meta Ads Setup Included\", \"CRM Software Free (3-Mo)\"]','active','2026-08-13 14:03:54'),(3,'PKG-03','BOOST','Small Business',7999.00,'[\"16 Premium Posts\", \"4 AI Reels\", \"1 Promotional Video\", \"16 Story Designs\", \"Festive Post\", \"Hashtag Research\", \"60K-80K Reach\", \"15-18 Leads/mo\", \"Monthly Strategy Call\", \"CRM Software Free\"]','active','2026-08-13 14:03:54'),(4,'PKG-04','BUSINESS PRO','Medium Business',9999.00,'[\"20 Premium Posts\", \"6 AI Reels\", \"2 Promotional Videos\", \"20 Story Updates\", \"Festive Post\", \"Cover Page & Content Writing\", \"110K-120K Reach\", \"30-35 Leads/mo\", \"CRM Software Free\"]','active','2026-08-13 14:03:54'),(5,'PKG-05','BUSINESS PLUS','Medium Business',11999.00,'[\"24 Premium Posts\", \"6 AI Reels\", \"Daily Stories\", \"3 Videos\", \"Google Business Profile\", \"120K-150K Reach\", \"35-40 Leads/mo\", \"Weekly/Monthly Strategy Call\"]','active','2026-08-13 14:03:54'),(6,'PKG-06','BUSINESS ELITE','Medium Business',14999.00,'[\"30 Premium Posts\", \"8 AI Reels\", \"Daily Stories\", \"3 Videos\", \"Google Business Profile\", \"140K-160K Reach\", \"45-55 Leads/mo\", \"WhatsApp Marketing (100 Customers)\"]','active','2026-08-13 14:03:54'),(7,'PKG-07','ENTERPRISE','Enterprise Business',19999.00,'[\"30 Premium Posts\", \"10 AI Reels\", \"Daily Stories\", \"4 Videos\", \"Google Ad Management\", \"200K-230K Reach\", \"60-70 Leads/mo\", \"WhatsApp Marketing (200 Customers)\"]','active','2026-08-13 14:03:54'),(8,'PKG-08','ENTERPRISE PLUS','Enterprise Business',25999.00,'[\"35 Premium Posts\", \"12 AI Reels\", \"4 Videos\", \"Google SEO Marketing\", \"Email Marketing (300 Customers)\", \"230K-250K Reach\", \"120-150 Leads/mo\", \"WhatsApp Marketing (300 Customers)\"]','active','2026-08-13 14:03:54'),(9,'PKG-09','ULTIMATE GROWTH','Enterprise Business',29999.00,'[\"40 Premium Posts\", \"12 AI Reels\", \"4 Videos\", \"Google SEO Marketing\", \"Email Marketing (500 Customers)\", \"300K Reach\", \"120-300 Leads/mo\", \"WhatsApp Marketing (500 Customers)\"]','active','2026-08-13 14:03:54');
/*!40000 ALTER TABLE `subscription_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subtasks`
--

DROP TABLE IF EXISTS `subtasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subtasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `task_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `assigned_to` int(11) DEFAULT NULL,
  `due_date` date DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `task_id` (`task_id`),
  CONSTRAINT `subtasks_ibfk_1` FOREIGN KEY (`task_id`) REFERENCES `tasks` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subtasks`
--

LOCK TABLES `subtasks` WRITE;
/*!40000 ALTER TABLE `subtasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `subtasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tasks`
--

DROP TABLE IF EXISTS `tasks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tasks` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `assigned_to` int(11) DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `deal_id` int(11) DEFAULT NULL,
  `title` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `due_date` datetime DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'medium',
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `project_id` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `sub_branch_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `assigned_to` (`assigned_to`),
  KEY `lead_id` (`lead_id`),
  KEY `customer_id` (`customer_id`),
  KEY `deal_id` (`deal_id`),
  CONSTRAINT `tasks_ibfk_1` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_ibfk_2` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_ibfk_3` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_ibfk_4` FOREIGN KEY (`deal_id`) REFERENCES `deals` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tasks`
--

LOCK TABLES `tasks` WRITE;
/*!40000 ALTER TABLE `tasks` DISABLE KEYS */;
/*!40000 ALTER TABLE `tasks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_rates`
--

DROP TABLE IF EXISTS `tax_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tax_rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `rate` decimal(5,2) NOT NULL,
  `type` varchar(50) DEFAULT 'GST',
  `is_inclusive` tinyint(1) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `tax_rates_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_rates`
--

LOCK TABLES `tax_rates` WRITE;
/*!40000 ALTER TABLE `tax_rates` DISABLE KEYS */;
INSERT INTO `tax_rates` VALUES (1,1,'GST 5%',5.00,'GST',0,1,'2026-09-06 17:01:05'),(2,1,'GST 12%',12.00,'GST',0,1,'2026-09-06 17:01:05'),(3,1,'GST 18%',18.00,'GST',0,1,'2026-09-06 17:01:05'),(4,1,'GST 28%',28.00,'GST',0,1,'2026-09-06 17:01:05'),(5,1,'SGST 9%',9.00,'SGST',0,1,'2026-09-06 17:01:50'),(6,1,'CGST 9%',9.00,'CGST',0,1,'2026-09-06 17:01:50'),(7,1,'IGST 18%',18.00,'IGST',0,1,'2026-09-06 17:01:50');
/*!40000 ALTER TABLE `tax_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_members`
--

DROP TABLE IF EXISTS `team_members`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_members` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `role_in_team` varchar(50) DEFAULT 'member',
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_team_user` (`team_id`,`user_id`),
  CONSTRAINT `team_members_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `teams` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_members`
--

LOCK TABLES `team_members` WRITE;
/*!40000 ALTER TABLE `team_members` DISABLE KEYS */;
/*!40000 ALTER TABLE `team_members` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teams`
--

DROP TABLE IF EXISTS `teams`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teams` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `name` varchar(150) NOT NULL,
  `description` text DEFAULT NULL,
  `lead_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `teams_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teams`
--

LOCK TABLES `teams` WRITE;
/*!40000 ALTER TABLE `teams` DISABLE KEYS */;
/*!40000 ALTER TABLE `teams` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_comments`
--

DROP TABLE IF EXISTS `ticket_comments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_comments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `comment` text NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ticket_id` (`ticket_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `ticket_comments_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `tickets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ticket_comments_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_comments`
--

LOCK TABLES `ticket_comments` WRITE;
/*!40000 ALTER TABLE `ticket_comments` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_comments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ticket_replies`
--

DROP TABLE IF EXISTS `ticket_replies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ticket_replies` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ticket_replies`
--

LOCK TABLES `ticket_replies` WRITE;
/*!40000 ALTER TABLE `ticket_replies` DISABLE KEYS */;
/*!40000 ALTER TABLE `ticket_replies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tickets`
--

DROP TABLE IF EXISTS `tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `subject` varchar(200) NOT NULL,
  `description` text NOT NULL,
  `priority` enum('low','medium','high','urgent') DEFAULT 'medium',
  `status` enum('open','in_progress','waiting','resolved','closed') DEFAULT 'open',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `created_by` int(11) DEFAULT NULL,
  `sla_id` int(11) DEFAULT NULL,
  `first_response_at` datetime DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `company_id` int(11) DEFAULT NULL,
  `sub_branch_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `customer_id` (`customer_id`),
  KEY `assigned_to` (`assigned_to`),
  CONSTRAINT `tickets_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tickets_ibfk_2` FOREIGN KEY (`assigned_to`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tickets`
--

LOCK TABLES `tickets` WRITE;
/*!40000 ALTER TABLE `tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `timesheets`
--

DROP TABLE IF EXISTS `timesheets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `timesheets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `project_id` int(11) DEFAULT NULL,
  `task_id` int(11) DEFAULT NULL,
  `date` date NOT NULL,
  `hours` decimal(5,2) NOT NULL,
  `description` text DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `approved_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `timesheets_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `timesheets`
--

LOCK TABLES `timesheets` WRITE;
/*!40000 ALTER TABLE `timesheets` DISABLE KEYS */;
/*!40000 ALTER TABLE `timesheets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `transaction_number` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  `category` varchar(100) DEFAULT NULL,
  `account_id` int(11) DEFAULT NULL,
  `bank_account_id` int(11) DEFAULT NULL,
  `amount` decimal(12,2) NOT NULL,
  `date` date NOT NULL,
  `reference` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `payment_method` varchar(50) DEFAULT NULL,
  `cheque_number` varchar(100) DEFAULT NULL,
  `module_type` varchar(50) DEFAULT NULL,
  `module_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES (1,1,NULL,'TXN-2026-001','income','Sales Revenue',NULL,1,85000.00,'2026-09-08','NEFT-88991122','Client enterprise software advance payment','bank_transfer',NULL,NULL,NULL,NULL,'2026-09-11 06:24:28','2026-09-11 06:24:28'),(2,1,NULL,'TXN-2026-002','expense','Office Rent',NULL,1,45000.00,'2026-09-05','CHQ-001245','Corporate head office monthly rent','cheque',NULL,NULL,NULL,NULL,'2026-09-11 06:24:28','2026-09-11 06:24:28'),(3,1,NULL,'TXN-2026-003','income','Consulting & Design',NULL,2,32000.00,'2026-09-09','UPI/260909/774','Branding and print collateral consultation','upi',NULL,NULL,NULL,NULL,'2026-09-11 06:24:28','2026-09-11 06:24:28'),(4,1,NULL,'TXN-2026-004','expense','Hardware Purchase',NULL,1,28500.00,'2026-09-06','IMPS-44332211','HP LaserJet Pro replacement purchase','bank_transfer',NULL,NULL,NULL,NULL,'2026-09-11 06:24:28','2026-09-11 06:24:28');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `units`
--

DROP TABLE IF EXISTS `units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `short_name` varchar(20) NOT NULL,
  `base_unit_id` int(11) DEFAULT NULL,
  `conversion_factor` decimal(10,4) DEFAULT 1.0000,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `units_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `units`
--

LOCK TABLES `units` WRITE;
/*!40000 ALTER TABLE `units` DISABLE KEYS */;
INSERT INTO `units` VALUES (1,1,'Piece','Pc',NULL,1.0000,1,'2026-09-06 17:01:05'),(2,1,'Kilogram','Kg',NULL,1.0000,1,'2026-09-06 17:01:05'),(3,1,'Litre','L',NULL,1.0000,1,'2026-09-06 17:01:05'),(4,1,'Hour','Hr',NULL,1.0000,1,'2026-09-06 17:01:05'),(5,1,'Meter','M',NULL,1.0000,1,'2026-09-06 17:01:50'),(6,1,'Box','Box',NULL,1.0000,1,'2026-09-06 17:01:50'),(7,1,'Set','Set',NULL,1.0000,1,'2026-09-06 17:01:50'),(8,1,'Hour','Hr',NULL,1.0000,1,'2026-09-06 17:01:50'),(9,1,'Day','Day',NULL,1.0000,1,'2026-09-06 17:01:50'),(10,1,'Month','Mo',NULL,1.0000,1,'2026-09-06 17:01:50');
/*!40000 ALTER TABLE `units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_permissions`
--

DROP TABLE IF EXISTS `user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `permission_id` int(11) NOT NULL,
  `granted` tinyint(1) DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_perm` (`user_id`,`permission_id`),
  KEY `permission_id` (`permission_id`),
  CONSTRAINT `user_permissions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_permissions_ibfk_2` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_permissions`
--

LOCK TABLES `user_permissions` WRITE;
/*!40000 ALTER TABLE `user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_sessions`
--

DROP TABLE IF EXISTS `user_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `token_hash` varchar(255) NOT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `last_active` timestamp NOT NULL DEFAULT current_timestamp(),
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `user_sessions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_sessions`
--

LOCK TABLES `user_sessions` WRITE;
/*!40000 ALTER TABLE `user_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `permissions` text DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0,
  `last_login` datetime DEFAULT NULL,
  `deleted_at` datetime DEFAULT NULL,
  `department` varchar(100) DEFAULT NULL,
  `company_id` varchar(100) DEFAULT NULL,
  `company_ids` text DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `sub_branch_id` int(11) DEFAULT NULL,
  `department_id` int(11) DEFAULT NULL,
  `designation_id` int(11) DEFAULT NULL,
  `team_id` int(11) DEFAULT NULL,
  `two_factor_enabled` tinyint(1) DEFAULT 0,
  `two_factor_secret` varchar(255) DEFAULT NULL,
  `last_password_change` datetime DEFAULT NULL,
  `login_attempts` int(11) DEFAULT 0,
  `locked_until` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `role_id` (`role_id`),
  CONSTRAINT `users_ibfk_1` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,1,'Supriya Naskar','supriyo.main@gmail.com',NULL,'9547110730','$2a$10$DbHL3vSaYGZhuxnx37xphO/iuPwThzdmydY4tmKnKkna8aw0W/gKS','active','2026-08-19 09:37:55','2026-09-25 18:02:47','{\"actionMatrix\":{\"Dashboard\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Notes\",\"Messages\",\"Tickets\",\"Knowledge base\",\"Files\"]}',1,'2026-08-24 21:37:51',NULL,NULL,NULL,'[\"tech\",\"digital\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(2,2,'Antigravity Verified User','supriyogod@gmail.com',NULL,NULL,'$2a$10$po8rgz.YX.ObbsRy124aPOrcyB3TqQie10OmxwcND/1CgBDHfQ4jy','active','2026-08-19 12:51:55','2026-08-31 06:15:50',NULL,1,'2026-08-25 01:26:10',NULL,NULL,'tech','[\"tech\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(4,1,'Supriya (Super Admin)','hiisupriya@gmail.com',NULL,NULL,'$2a$10$DbHL3vSaYGZhuxnx37xphO/iuPwThzdmydY4tmKnKkna8aw0W/gKS','active','2026-08-21 10:22:24','2026-09-25 18:17:17','{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Messages\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Leads\"]}',1,'2026-09-25 23:47:17',NULL,'Operations','tech','[\"tech\",\"digital\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(5,3,'Test Operator','test.operator@saampark.in',NULL,NULL,'$2a$10$622Ka.wc7BhXWh/1u23mA.7777g/vQEKW2hl8Y7Vz49rem4xgH9nK','active','2026-08-21 10:40:53','2026-08-21 10:40:53',NULL,1,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(6,3,'Browser Test User','browser.test@saampark.in',NULL,'+91 96543 21098','$2a$10$CuprJkNi3Tu5XD5JlKkXe.trk.tGM7PUiV0VYkGGVK7px.GRL/aU.','active','2026-08-21 11:22:45','2026-08-21 16:33:47','{\"actionMatrix\":{\"Dashboard\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}',1,'2026-08-21 22:03:47',NULL,'Operations','0',NULL,NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(15,2,'Vikram Malhotra (Admin)','admin@saampark.in',NULL,'+91 98765 43211','$2a$10$eQW4r7B.GEbzBqb3ht3gFuZA6s3059.fYH2yI/zXCXwNT8T9/etta','active','2026-08-24 16:12:44','2026-09-25 18:02:48','{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}',1,'2026-09-12 21:23:16',NULL,'Operations','tech','[\"tech\",\"digital\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(16,3,'Aman Verma (Senior Ops Lead)','team@saampark.in',NULL,NULL,'$2a$10$OAPjGRkddLd7iVuwjyTVCuuHsDnvI6q/b5pSms/7aQPR6NmY9xKhO','active','2026-08-24 16:12:44','2026-09-25 18:02:49','{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Notes\",\"Messages\",\"Team\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}',1,'2026-09-12 21:26:20',NULL,'General','tech','[\"tech\",\"digital\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(17,4,'Acme Corp (Client)','client@saampark.in',NULL,NULL,'$2a$10$OAPjGRkddLd7iVuwjyTVCuuHsDnvI6q/b5pSms/7aQPR6NmY9xKhO','active','2026-08-24 16:12:44','2026-09-25 18:02:49',NULL,1,NULL,NULL,NULL,'tech','[\"tech\",\"digital\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(18,3,'Rohit Sharma (Dev Lead)','rohit.dev@saampark.in',NULL,'+91 98765 43210','$2a$10$HDX2ryLouqqPw3gMFQenQOfkeMonnM4jqo/ql9lMW3uH5j3HFXUmq','active','2026-08-24 17:37:09','2026-08-24 17:55:44','{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":false,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false}},\"allowedModules\":[\"Tasks\",\"Leads\",\"Notes\",\"Messages\"]}',1,NULL,NULL,'Cloud & Infrastructure Architecture','tech','[\"tech\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(19,2,'kututcgc','jfyfhvhfjcj@mail',NULL,'+91 98765 43210','$2a$10$paIkmN4aGSzCpZGsARJzNuYszJvY3CRdwIohB2OSHf6C6fvBzj5pq','active','2026-08-24 17:42:04','2026-08-24 17:42:04','{\"actionMatrix\":{\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Events\",\"Clients\",\"Projects\",\"Tasks\",\"Leads\",\"Subscriptions\",\"Sales\",\"Estimates\",\"Proposals\",\"Notes\",\"Messages\",\"Team\",\"Users\",\"Tickets\",\"Knowledge base\",\"Files\",\"Expenses\",\"Reports\",\"Settings\"]}',1,NULL,NULL,'Software Engineering','saampark-ai-solutions','[\"saampark-ai-solutions\",\"tech\",\"digital\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(20,4,'Ananya Roy (Marketing Specialist)','ananya.marketing@saampark.in',NULL,'+91 98765 43210','$2a$10$wRv5DKapUSZCnKMBaZyjweZdH4rvvYVeODoEN1TdpgoHHb2J1s9I.','active','2026-08-24 18:57:51','2026-08-24 19:58:07','{\"actionMatrix\":{\"Events\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Clients\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Tasks\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Leads\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Subscriptions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Sales\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Estimates\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Proposals\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Notes\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Team\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Users\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true},\"Knowledge base\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Files\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Reports\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Settings\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":true}},\"allowedModules\":[\"Dashboard\",\"Sales\",\"Projects\",\"Messages\",\"Tickets\",\"Settings\"]}',1,NULL,NULL,'Software Engineering','digital','[\"digital\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(21,2,'Test Tech Admin','techadmin_test_1788719202360@saampark.in',NULL,NULL,'$2a$10$yJsgGpxJFYm4vtLBzWUKN.AIHhyzsXP/diCkCgoV0qhXjVDpBYUNm','active','2026-09-06 18:26:43','2026-09-06 18:26:43',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,1,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(22,3,'Test Field Team Member','fieldteam_test_1788719208810@saampark.in',NULL,NULL,'$2a$10$PTmeTOtipmcncnsL1Rp6mOojyTKmEeIrF36Xf0zvct/89SP1gxeAC','active','2026-09-06 18:26:49','2026-09-06 18:26:49',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,1,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(23,2,'Assigned Tech Admin','assigned_admin_tech@saampark.in',NULL,NULL,'hash123','active','2026-09-06 18:26:51','2026-09-06 18:26:51',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(24,3,'Authorized Tech Team Member','authorized_team_1788719213140@saampark.in',NULL,NULL,'$2a$10$iRzUS6MbY79azqfKG/kU1O0FAe7IdMcVY7yYHLZixtZ/XO/OPzseC','active','2026-09-06 18:26:53','2026-09-06 18:26:53',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(25,4,'Authorized Tech Client','authorized_client_1788719216282@saampark.in',NULL,NULL,'$2a$10$kfxXUs.NVuMPnPIL44pMUOo/rBc64wqH29gmZTDspDQ68Uqpph1Hy','active','2026-09-06 18:26:56','2026-09-06 18:26:56',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(26,2,'Branch Admin Mumbai','branch_admin_mumbai@saampark.in',NULL,NULL,'hash123','active','2026-09-06 18:27:00','2026-09-06 18:27:00',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(27,3,'Mumbai User by Mumbai Branch Admin','mumbai_user_1788719220346@saampark.in',NULL,NULL,'$2a$10$BN1uxM2MSgvOHPeIUR0.leKu3sl/vFMHrZ1qJbil60Yqxd9HaUuOq','active','2026-09-06 18:27:00','2026-09-06 18:27:00',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(28,2,'Test Tech Admin','techadmin_test_1788719308980@saampark.in',NULL,NULL,'$2a$10$5nYXFZxghJxc2KhwXtVlL.k4U4KuKq0XKjPC9R6tWQj6p/2t1gi6m','active','2026-09-06 18:28:29','2026-09-06 18:28:29',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,1,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(29,3,'Test Field Team Member','fieldteam_test_1788719311488@saampark.in',NULL,NULL,'$2a$10$bkACM4ar0GNbVcjHdwfaPeSlGuIrqvYAnfojKbyDx1Bm.pRkoxPRO','active','2026-09-06 18:28:31','2026-09-06 18:28:31',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,1,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(31,3,'Authorized Tech Team Member','authorized_team_1788719314041@saampark.in',NULL,NULL,'$2a$10$OgK/11AvbnVjHKCFjbHAfuBVpZe1iLsMV/qcxm84pbdswGkM08lrW','active','2026-09-06 18:28:34','2026-09-06 18:28:34',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(32,4,'Authorized Tech Client','authorized_client_1788719316769@saampark.in',NULL,NULL,'$2a$10$tsopUI27SdbR4UGYHU.qP.2zdHBSxtqsyYvSnPtBrH23SwqWL3nKi','active','2026-09-06 18:28:37','2026-09-06 18:28:37',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(34,3,'Mumbai User by Mumbai Branch Admin','mumbai_user_1788719320285@saampark.in',NULL,NULL,'$2a$10$rXo5M3N8wgNkSuLqcmsX9.nAoxOijREfog/PyYG8E6Kge8LKyJWFS','active','2026-09-06 18:28:40','2026-09-06 18:28:40',NULL,1,NULL,NULL,NULL,'tech','[\"tech\"]',NULL,1,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(35,3,'Test New User','testnewuser999@saampark.in',NULL,'9876543210','$2a$10$0lm/apLIOrJZHnLnsWJ3iu9siV/P3/1U5j0lqzzXm4lbeJCTLM9SO','active','2026-09-17 06:41:51','2026-09-17 06:41:51',NULL,1,NULL,NULL,'Engineering','tech','[\"tech\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(36,3,'Localhost Test User','localtestuser1@saampark.in',NULL,'9876543210','$2a$10$YzZ3pSj7G4Qa.xBWscw/YekeF.CYHCb96RywLZFJSOC218X/0.GKC','active','2026-09-17 06:58:44','2026-09-17 06:58:44','{\"allowedModules\":[\"Leads\",\"Clients\",\"Proposals\",\"Quotations\",\"Estimates\",\"Sales Orders\",\"Invoices\",\"Payments\",\"Credit Notes\",\"Debit Notes\",\"Services & Store\",\"Projects\",\"Tasks\",\"Subscriptions\",\"EMI\",\"Teams\",\"Attendance\",\"Leave\",\"Tickets\",\"Knowledge base\",\"Messages\",\"Events\",\"Notes\",\"Files\",\"Departments\",\"Users\",\"Expenses\",\"Reports\",\"Activity Logs\"],\"actionMatrix\":{\"Leads\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Clients\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Proposals\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Quotations\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Estimates\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Sales Orders\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Invoices\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Credit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Debit Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Services & Store\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Projects\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Tasks\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Subscriptions\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"EMI\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Teams\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Attendance\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Leave\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Payroll\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Tickets\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Knowledge base\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Messages\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Events\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Notes\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Files\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Companies\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Branches\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Departments\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Users\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Permissions\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Expenses\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Reports\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false},\"Settings\":{\"view\":false,\"add\":false,\"edit\":false,\"delete\":false},\"Activity Logs\":{\"view\":true,\"add\":true,\"edit\":true,\"delete\":false}}}',1,NULL,NULL,'Engineering','tech','[\"tech\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL),(37,3,'Verified User Creation','verifieduser@saampark.in',NULL,'9876543210','$2a$10$K2E2ubh.POAnniasou4Q4ubVrGOpfNRI1xqg8E7Ml1rpHa0GoEhzm','active','2026-09-17 07:22:09','2026-09-17 07:22:09',NULL,1,NULL,NULL,'Marketing','digital','[\"digital\"]',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL,NULL,0,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `contact_person` varchar(150) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `state` varchar(100) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `gst_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(50) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `bank_account` varchar(100) DEFAULT NULL,
  `ifsc_code` varchar(50) DEFAULT NULL,
  `category` varchar(100) DEFAULT NULL,
  `payment_terms` varchar(100) DEFAULT NULL,
  `rating` int(11) DEFAULT 0,
  `notes` text DEFAULT NULL,
  `status` varchar(20) DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `vendors_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (1,1,NULL,'TechSys Hardware Pvt Ltd','Rajesh Sharma','rajesh@techsys.com','+91 98765 43210','Plot 42, Okhla Phase 3','New Delhi','Delhi','India','07AABCT1234F1Z5','AABCT1234F',NULL,NULL,NULL,'Hardware',NULL,0,NULL,'active','2026-09-11 06:23:59','2026-09-11 06:23:59'),(2,1,NULL,'Paper & Print Solutions','Anil Verma','anil@printsol.in','+91 98111 22334','12 Sector 18','Noida','Uttar Pradesh','India','09AAACP5678G1Z2','AAACP5678G',NULL,NULL,NULL,'Printing & Paper',NULL,0,NULL,'active','2026-09-11 06:23:59','2026-09-11 06:23:59'),(3,1,NULL,'Digital Cloud Services','Sonia Kapoor','sonia@digicloud.com','+91 97234 56789','DLF Cyber City, Tower B','Gurugram','Haryana','India','06AABCD9012H1Z8','AABCD9012H',NULL,NULL,NULL,'IT & Cloud',NULL,0,NULL,'active','2026-09-11 06:23:59','2026-09-11 06:23:59');
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `warehouses`
--

DROP TABLE IF EXISTS `warehouses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `warehouses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(200) NOT NULL,
  `code` varchar(50) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `city` varchar(100) DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `warehouses_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `warehouses`
--

LOCK TABLES `warehouses` WRITE;
/*!40000 ALTER TABLE `warehouses` DISABLE KEYS */;
INSERT INTO `warehouses` VALUES (1,1,'Central Fulfillment Hub','WH-DEL-01','B-144 Mayapuri Industrial Area','New Delhi',NULL,1,'2026-09-11 06:24:28','2026-09-11 06:24:28'),(2,1,'Noida Distribution Center','WH-NOI-02','Sector 63, Block C','Noida',NULL,1,'2026-09-11 06:24:28','2026-09-11 06:24:28'),(3,1,'Gurugram Retail Depot','WH-GGN-03','Udyog Vihar Phase 4','Gurugram',NULL,1,'2026-09-11 06:24:28','2026-09-11 06:24:28');
/*!40000 ALTER TABLE `warehouses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `whatsapp_campaigns`
--

DROP TABLE IF EXISTS `whatsapp_campaigns`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `whatsapp_campaigns` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `company_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `template_name` varchar(255) DEFAULT NULL,
  `recipient_list` text DEFAULT NULL,
  `scheduled_at` datetime DEFAULT NULL,
  `sent_at` datetime DEFAULT NULL,
  `status` varchar(50) DEFAULT 'draft',
  `total_sent` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `company_id` (`company_id`),
  CONSTRAINT `whatsapp_campaigns_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `whatsapp_campaigns`
--

LOCK TABLES `whatsapp_campaigns` WRITE;
/*!40000 ALTER TABLE `whatsapp_campaigns` DISABLE KEYS */;
/*!40000 ALTER TABLE `whatsapp_campaigns` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'crm_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-26 18:07:14

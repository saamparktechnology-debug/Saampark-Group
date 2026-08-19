-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: crm_db
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `subscription_packages`
--

DROP TABLE IF EXISTS `subscription_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_packages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `package_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `category` enum('Small Business','Medium Business','Enterprise Business') COLLATE utf8mb4_unicode_ci NOT NULL,
  `price_per_month` decimal(10,2) NOT NULL,
  `features` json DEFAULT NULL,
  `status` enum('active','inactive') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
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
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-14 17:02:46

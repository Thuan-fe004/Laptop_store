-- MySQL dump 10.13  Distrib 8.0.29, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: laptop_store
-- ------------------------------------------------------
-- Server version	8.0.29

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
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên thương hiệu',
  `logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Đường dẫn logo',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Hiển thị, 0=Ẩn',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thương hiệu laptop';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (1,'Asus',NULL,1,'2026-03-28 23:52:19'),(2,'Dell',NULL,1,'2026-03-28 23:52:19'),(3,'HP',NULL,1,'2026-03-28 23:52:19'),(4,'Lenovo',NULL,1,'2026-03-28 23:52:19'),(5,'Apple',NULL,1,'2026-03-28 23:52:19'),(6,'Acer',NULL,1,'2026-03-28 23:52:19'),(7,'MSI',NULL,1,'2026-03-28 23:52:19'),(8,'Samsung',NULL,1,'2026-03-28 23:52:19');
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cart_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cart_id` int NOT NULL COMMENT 'FK → carts',
  `product_id` int NOT NULL COMMENT 'FK → products',
  `quantity` int NOT NULL DEFAULT '1' COMMENT 'Số lượng',
  `added_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_cart_product` (`cart_id`,`product_id`),
  KEY `fk_cartitem_product` (`product_id`),
  CONSTRAINT `fk_cartitem_cart` FOREIGN KEY (`cart_id`) REFERENCES `carts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_cartitem_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết giỏ hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (1,1,1,1,'2026-03-28 23:52:19'),(2,1,8,2,'2026-03-28 23:52:19'),(3,2,6,1,'2026-03-28 23:52:19'),(4,3,4,1,'2026-03-28 23:52:19'),(18,6,7,1,'2026-04-19 10:50:52'),(20,6,13,3,'2026-04-22 22:14:31');
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `carts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT 'FK → users (1-1)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng giỏ hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,2,'2026-03-28 23:52:19',NULL),(2,3,'2026-03-28 23:52:19',NULL),(3,4,'2026-03-28 23:52:19',NULL),(4,5,'2026-03-28 23:52:19',NULL),(5,6,'2026-03-30 03:36:00',NULL),(6,7,'2026-04-08 14:34:51',NULL),(7,8,'2026-04-17 12:12:30',NULL);
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên danh mục - không trùng',
  `description` text COLLATE utf8mb4_unicode_ci COMMENT 'Mô tả danh mục',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Hiển thị, 0=Ẩn',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng danh mục sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Laptop Gaming','laptop khỏe',1,'2026-03-28 23:52:19'),(2,'Laptop Văn phòng','Laptop mỏng nhẹ, pin bền, phù hợp làm việc hàng ngày',1,'2026-03-28 23:52:19'),(3,'Laptop Đồ họa','Laptop màn hình màu chuẩn, card đồ họa mạnh cho thiết kế',1,'2026-03-28 23:52:19'),(4,'Laptop Sinh viên','Laptop giá tốt, cấu hình ổn định cho sinh viên',1,'2026-03-28 23:52:19'),(5,'MacBook','Dòng laptop cao cấp của Apple chạy macOS',1,'2026-03-28 23:52:19'),(6,'laptop văn phòng 2','dùng làm vp',0,'2026-04-01 09:13:16');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã giảm giá',
  `description` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mô tả chương trình',
  `discount_type` enum('percent','fixed') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'percent' COMMENT 'Loại giảm',
  `discount_value` decimal(10,2) NOT NULL COMMENT 'Giá trị giảm',
  `max_discount` decimal(15,0) DEFAULT NULL COMMENT 'Giảm tối đa (áp dụng cho %)',
  `min_order` decimal(15,0) NOT NULL DEFAULT '0' COMMENT 'Giá trị đơn tối thiểu',
  `max_uses` int NOT NULL DEFAULT '0' COMMENT '0 = không giới hạn',
  `used_count` int NOT NULL DEFAULT '0' COMMENT 'Số lần đã dùng',
  `starts_at` datetime DEFAULT NULL COMMENT 'Ngày bắt đầu',
  `expires_at` datetime DEFAULT NULL COMMENT 'Ngày hết hạn',
  `is_active` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Kích hoạt, 0=Vô hiệu',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng mã giảm giá';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (1,'SALE10','Giảm 10% tất cả đơn hàng','percent',10.00,500000,0,100,0,NULL,'2026-12-31 00:00:00',1,'2026-03-28 23:52:19'),(2,'SALE50K','Giảm 50.000đ đơn từ 500K','fixed',50000.00,NULL,500000,200,0,NULL,'2025-06-30 23:59:59',1,'2026-03-28 23:52:19'),(3,'NEWUSER','Giảm 15% cho khách hàng mới','percent',15.00,1000000,0,50,0,NULL,'2025-12-31 23:59:59',1,'2026-03-28 23:52:19'),(4,'LAPTOP20','Giảm 20% đơn từ 20 triệu','percent',20.00,5000000,20000000,30,0,NULL,'2025-09-30 23:59:59',1,'2026-03-28 23:52:19'),(5,'FREESHIP','Miễn phí vận chuyển','fixed',30000.00,NULL,200000,500,0,NULL,'2025-12-31 23:59:59',1,'2026-03-28 23:52:19');
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL COMMENT 'FK → orders',
  `product_id` int NOT NULL COMMENT 'FK → products',
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên SP tại thời điểm mua',
  `product_image` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ảnh SP tại thời điểm mua',
  `quantity` int NOT NULL COMMENT 'Số lượng mua',
  `unit_price` decimal(15,0) NOT NULL COMMENT 'Đơn giá tại thời điểm mua',
  `subtotal` decimal(15,0) NOT NULL COMMENT 'Thành tiền',
  PRIMARY KEY (`id`),
  KEY `fk_orderitem_product` (`product_id`),
  KEY `idx_orderitem_order` (`order_id`),
  CONSTRAINT `fk_orderitem_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orderitem_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng chi tiết đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,1,1,'Asus ROG Strix G16 2024','/static/uploads/rog-strix-g16-1.jpg',1,30990000,30990000),(2,2,6,'Asus ZenBook 14 OLED 2024','/static/uploads/zenbook-14-1.jpg',1,21990000,21990000),(3,3,4,'Lenovo ThinkPad X1 Carbon Gen 11','/static/uploads/thinkpad-x1-1.jpg',1,35990000,35990000),(4,4,8,'Acer Aspire 5 A515-58','/static/uploads/aspire-5-1.jpg',1,13490000,13490000),(5,5,9,'Lenovo IdeaPad Slim 5i Gen 8','/static/uploads/ideapad-slim-1.jpg',1,16490000,16490000),(6,6,7,'Dell XPS 15 9530 OLED','/static/uploads/xps-15-1.jpg',1,42990000,42990000),(7,7,3,'Dell Alienware m18 R1','products/product_3_5852d166.jpg',1,54990000,54990000),(8,7,24,'ASUS Zenbook 14 OLED UX3405MA','products/product_24_2cde8350.webp',1,25990000,25990000),(9,8,24,'ASUS Zenbook 14 OLED UX3405MA','products/product_24_2cde8350.webp',2,25990000,51980000),(10,8,25,'HP Spectre x360 14 ef2013TU 2024','products/product_25_23e76a1d.webp',1,33490000,33490000),(11,9,22,'Lenovo IdeaPad Gaming 3 15ARH7','products/product_22_37be8b1f.webp',1,17990000,17990000),(12,10,18,'ASUS ExpertBook B1 B1502CVA 2024','products/product_18_053811a8.webp',1,12490000,12490000),(13,11,11,'ASUS TUF Gaming A15 FA507NV-LP042W','products/product_11_1292d8d7.webp',2,20990000,41980000),(14,12,20,'Acer Swift Go 14 SFG14-71-51QT','products/product_20_bb16f5e2.webp',1,14990000,14990000),(15,13,21,'HP 15s fq5233TU 2024','products/product_21_218f425a.webp',1,8490000,8490000),(16,14,25,'HP Spectre x360 14 ef2013TU 2024','products/product_25_23e76a1d.webp',3,33490000,100470000),(17,15,14,'Dell G15 5530 RTX 4060 2024','products/product_14_3b8ef2a8.webp',1,25490000,25490000),(18,16,10,'Apple MacBook Air M3 15 inch','products/product_10_1b370de9.webp',1,34990000,34990000),(19,17,14,'Dell G15 5530 RTX 4060 2024','products/product_14_3b8ef2a8.webp',2,25490000,50980000);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mã đơn hiển thị cho KH',
  `user_id` int NOT NULL COMMENT 'FK → users',
  `coupon_id` int DEFAULT NULL COMMENT 'FK → coupons (nullable)',
  `total_price` decimal(15,0) NOT NULL COMMENT 'Tổng tiền trước giảm',
  `discount` decimal(15,0) NOT NULL DEFAULT '0' COMMENT 'Tiền được giảm',
  `shipping_fee` decimal(15,0) NOT NULL DEFAULT '0' COMMENT 'Phí vận chuyển',
  `final_price` decimal(15,0) NOT NULL COMMENT 'Tổng thanh toán thực tế',
  `status` enum('pending','processing','shipping','delivered','cancelled') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending' COMMENT 'Trạng thái đơn hàng',
  `payment_method` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'cod' COMMENT 'Phương thức thanh toán',
  `payment_status` enum('unpaid','paid','refunded') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'unpaid' COMMENT 'Trạng thái TT',
  `note` text COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú của khách',
  `cancelled_reason` text COLLATE utf8mb4_unicode_ci COMMENT 'Lý do hủy đơn',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_code` (`order_code`),
  KEY `fk_order_coupon` (`coupon_id`),
  KEY `idx_order_user` (`user_id`),
  KEY `idx_order_status` (`status`),
  KEY `idx_order_created` (`created_at`),
  CONSTRAINT `fk_order_coupon` FOREIGN KEY (`coupon_id`) REFERENCES `coupons` (`id`),
  CONSTRAINT `fk_order_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng đơn hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'ORD20241201001',2,1,30990000,2000000,0,28990000,'delivered','cod','paid',NULL,NULL,'2026-03-28 23:52:19',NULL),(2,'ORD20241205002',3,NULL,21990000,0,0,21990000,'delivered','cod','paid','Giao giờ hành chính',NULL,'2026-03-28 23:52:19',NULL),(3,'ORD20241210003',4,2,35990000,50000,0,35940000,'delivered','cod','paid',NULL,NULL,'2026-03-28 23:52:19','2026-04-18 00:29:01'),(4,'ORD20241215004',2,NULL,13490000,0,0,13490000,'processing','banking','paid','Đóng gói cẩn thận',NULL,'2026-03-28 23:52:19',NULL),(5,'ORD20241220005',5,3,16490000,1000000,0,15490000,'shipping','cod','unpaid',NULL,NULL,'2026-03-28 23:52:19','2026-04-18 00:29:11'),(6,'ORD20241222006',3,NULL,42990000,0,0,42990000,'cancelled','cod','unpaid',NULL,NULL,'2026-03-28 23:52:19',NULL),(7,'ORD20260409172511',7,NULL,80980000,0,0,80980000,'cancelled','transfer','unpaid','','Khách hủy','2026-04-09 20:50:08','2026-04-10 01:25:21'),(8,'ORD20260410254417',7,NULL,85470000,0,0,85470000,'cancelled','cod','unpaid','','Khách hủy','2026-04-10 01:26:15','2026-04-10 01:33:50'),(9,'ORD20260410260724',7,NULL,17990000,0,0,17990000,'delivered','vnpay','paid','',NULL,'2026-04-10 01:34:19','2026-04-18 00:29:30'),(10,'ORD20260416362647',7,NULL,12490000,0,0,12490000,'delivered','cod','paid','',NULL,'2026-04-16 23:24:37','2026-04-18 00:30:05'),(11,'ORD20260419635236',7,NULL,41980000,0,0,41980000,'cancelled','transfer','unpaid','','Khách hủy','2026-04-19 00:04:19','2026-04-19 00:04:57'),(12,'ORD20260419163301',7,NULL,14990000,0,0,14990000,'cancelled','transfer','unpaid','','Khách hủy','2026-04-19 00:05:27','2026-04-19 01:23:40'),(13,'ORD20260419241647',7,NULL,8490000,0,50000,8540000,'pending','transfer','unpaid','',NULL,'2026-04-19 00:19:07',NULL),(14,'ORD20260419324604',7,NULL,100470000,0,0,100470000,'pending','transfer','unpaid','',NULL,'2026-04-19 00:45:28',NULL),(15,'ORD20260419129358',7,NULL,25490000,0,0,25490000,'cancelled','transfer','unpaid','1','Khách hủy','2026-04-19 01:14:20','2026-04-19 01:24:00'),(16,'ORD20260419233829',7,NULL,34990000,0,0,34990000,'pending','transfer','unpaid','',NULL,'2026-04-19 10:51:18',NULL),(17,'ORD20260422268663',7,NULL,50980000,0,0,50980000,'pending','cod','unpaid','1',NULL,'2026-04-22 22:23:54',NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_images` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL COMMENT 'FK → products',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Đường dẫn ảnh',
  `image_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tên file gốc',
  `is_primary` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1=Ảnh đại diện chính',
  `sort_order` int NOT NULL DEFAULT '0' COMMENT 'Thứ tự hiển thị',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_img_product` (`product_id`),
  CONSTRAINT `fk_img_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=103 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng hình ảnh sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,25,'products/product_25_23e76a1d.webp','product_25_23e76a1d.webp',1,1,'2026-04-06 17:28:17'),(2,25,'products/product_25_7d9abf4b.jpg','product_25_7d9abf4b.jpg',0,2,'2026-04-06 17:29:27'),(3,25,'products/product_25_9d80797c.jpg','product_25_9d80797c.jpg',0,3,'2026-04-06 17:30:25'),(4,24,'products/product_24_2cde8350.webp','product_24_2cde8350.webp',1,1,'2026-04-06 21:22:39'),(5,24,'products/product_24_820846f2.webp','product_24_820846f2.webp',0,2,'2026-04-06 21:22:46'),(6,24,'products/product_24_3281e93f.webp','product_24_3281e93f.webp',0,3,'2026-04-06 21:22:51'),(7,23,'products/product_23_bb8157c2.webp','product_23_bb8157c2.webp',1,1,'2026-04-06 21:25:02'),(8,23,'products/product_23_99f8f2ba.webp','product_23_99f8f2ba.webp',0,2,'2026-04-06 21:25:10'),(9,23,'products/product_23_92577c54.webp','product_23_92577c54.webp',0,3,'2026-04-06 21:25:20'),(10,23,'products/product_23_55c0a7c6.webp','product_23_55c0a7c6.webp',0,4,'2026-04-06 21:25:24'),(11,23,'products/product_23_5d752650.webp','product_23_5d752650.webp',0,5,'2026-04-06 21:25:29'),(12,22,'products/product_22_37be8b1f.webp','product_22_37be8b1f.webp',1,1,'2026-04-06 21:27:37'),(13,22,'products/product_22_d82879a7.webp','product_22_d82879a7.webp',0,2,'2026-04-06 21:27:40'),(14,22,'products/product_22_00231c63.webp','product_22_00231c63.webp',0,3,'2026-04-06 21:27:43'),(15,22,'products/product_22_d8621d91.webp','product_22_d8621d91.webp',0,4,'2026-04-06 21:27:45'),(16,21,'products/product_21_218f425a.webp','product_21_218f425a.webp',1,1,'2026-04-06 21:29:51'),(18,21,'products/product_21_5182328e.webp','product_21_5182328e.webp',0,2,'2026-04-06 21:30:04'),(19,21,'products/product_21_ea426d9e.webp','product_21_ea426d9e.webp',0,3,'2026-04-06 21:30:07'),(20,21,'products/product_21_4a021a5d.webp','product_21_4a021a5d.webp',0,4,'2026-04-06 21:30:10'),(21,20,'products/product_20_bb16f5e2.webp','product_20_bb16f5e2.webp',1,1,'2026-04-06 21:31:54'),(22,20,'products/product_20_c15654af.webp','product_20_c15654af.webp',0,2,'2026-04-06 21:31:57'),(23,20,'products/product_20_279d1d2e.webp','product_20_279d1d2e.webp',0,3,'2026-04-06 21:32:00'),(24,20,'products/product_20_64a1ca49.webp','product_20_64a1ca49.webp',0,4,'2026-04-06 21:32:02'),(25,19,'products/product_19_77087bc8.webp','product_19_77087bc8.webp',1,1,'2026-04-06 21:35:37'),(26,19,'products/product_19_1e45d683.webp','product_19_1e45d683.webp',0,2,'2026-04-06 21:35:39'),(27,19,'products/product_19_64eeae28.png','product_19_64eeae28.png',0,3,'2026-04-06 21:35:42'),(28,19,'products/product_19_31752fe7.webp','product_19_31752fe7.webp',0,4,'2026-04-06 21:35:44'),(29,18,'products/product_18_053811a8.webp','product_18_053811a8.webp',1,1,'2026-04-06 21:39:12'),(30,18,'products/product_18_68e53f67.webp','product_18_68e53f67.webp',0,2,'2026-04-06 21:39:14'),(31,18,'products/product_18_1d8b7b2c.webp','product_18_1d8b7b2c.webp',0,3,'2026-04-06 21:39:17'),(32,18,'products/product_18_e511c424.webp','product_18_e511c424.webp',0,4,'2026-04-06 21:39:19'),(33,17,'products/product_17_07dd51ca.webp','product_17_07dd51ca.webp',1,1,'2026-04-06 21:40:24'),(34,17,'products/product_17_d5dbc513.webp','product_17_d5dbc513.webp',0,2,'2026-04-06 21:40:26'),(35,17,'products/product_17_6a3ed9fd.webp','product_17_6a3ed9fd.webp',0,3,'2026-04-06 21:40:29'),(36,17,'products/product_17_0685b141.webp','product_17_0685b141.webp',0,4,'2026-04-06 21:40:31'),(37,16,'products/product_16_0424adb8.webp','product_16_0424adb8.webp',1,1,'2026-04-06 21:44:55'),(38,16,'products/product_16_2897eeef.png','product_16_2897eeef.png',0,2,'2026-04-06 21:44:58'),(39,16,'products/product_16_171f4291.webp','product_16_171f4291.webp',0,3,'2026-04-06 21:45:02'),(40,16,'products/product_16_1618939f.webp','product_16_1618939f.webp',0,4,'2026-04-06 21:45:04'),(41,1,'products/product_1_c6fbafa8.webp','product_1_c6fbafa8.webp',1,1,'2026-04-06 21:54:27'),(42,1,'products/product_1_ee1f852d.webp','product_1_ee1f852d.webp',0,2,'2026-04-06 21:54:30'),(43,1,'products/product_1_71580c56.png','product_1_71580c56.png',0,3,'2026-04-06 21:54:33'),(44,1,'products/product_1_a079af29.png','product_1_a079af29.png',0,4,'2026-04-06 21:54:35'),(45,2,'products/product_2_3f37c3b1.png','product_2_3f37c3b1.png',1,1,'2026-04-06 21:55:49'),(46,2,'products/product_2_1a5f9fb0.png','product_2_1a5f9fb0.png',0,2,'2026-04-06 21:55:55'),(47,2,'products/product_2_82b92205.png','product_2_82b92205.png',0,3,'2026-04-06 21:55:57'),(48,3,'products/product_3_5852d166.jpg','product_3_5852d166.jpg',1,1,'2026-04-06 21:57:22'),(49,3,'products/product_3_dcc93532.png','product_3_dcc93532.png',0,2,'2026-04-06 21:57:25'),(50,3,'products/product_3_2792ec5d.png','product_3_2792ec5d.png',0,3,'2026-04-06 21:57:27'),(51,3,'products/product_3_71194cb5.png','product_3_71194cb5.png',0,4,'2026-04-06 21:57:30'),(52,3,'products/product_3_95a7b9e6.png','product_3_95a7b9e6.png',0,5,'2026-04-06 21:57:32'),(53,4,'products/product_4_6e35b52c.png','product_4_6e35b52c.png',1,1,'2026-04-06 21:58:22'),(54,4,'products/product_4_c8cc55e1.webp','product_4_c8cc55e1.webp',0,2,'2026-04-06 21:58:24'),(55,4,'products/product_4_9d147c1c.webp','product_4_9d147c1c.webp',0,3,'2026-04-06 21:58:28'),(56,4,'products/product_4_0bbcd839.webp','product_4_0bbcd839.webp',0,4,'2026-04-06 21:58:31'),(57,5,'products/product_5_6c1fc641.jpg','product_5_6c1fc641.jpg',1,1,'2026-04-06 22:00:00'),(58,5,'products/product_5_bdc07a06.jpg','product_5_bdc07a06.jpg',0,2,'2026-04-06 22:00:05'),(59,5,'products/product_5_fd362209.jpg','product_5_fd362209.jpg',0,3,'2026-04-06 22:00:09'),(60,6,'products/product_6_9378efb3.webp','product_6_9378efb3.webp',1,1,'2026-04-06 22:01:09'),(61,6,'products/product_6_576ef038.webp','product_6_576ef038.webp',0,2,'2026-04-06 22:01:12'),(62,6,'products/product_6_d8020029.webp','product_6_d8020029.webp',0,3,'2026-04-06 22:01:15'),(63,7,'products/product_7_318a7113.webp','product_7_318a7113.webp',1,1,'2026-04-06 22:02:24'),(64,7,'products/product_7_23777500.webp','product_7_23777500.webp',0,2,'2026-04-06 22:02:26'),(65,7,'products/product_7_f2229023.webp','product_7_f2229023.webp',0,3,'2026-04-06 22:02:29'),(66,7,'products/product_7_dd483d6a.webp','product_7_dd483d6a.webp',0,4,'2026-04-06 22:02:31'),(67,8,'products/product_8_ee6d72f3.webp','product_8_ee6d72f3.webp',1,1,'2026-04-06 22:03:39'),(68,8,'products/product_8_e4dc3cea.webp','product_8_e4dc3cea.webp',0,2,'2026-04-06 22:03:42'),(69,8,'products/product_8_dadf711b.webp','product_8_dadf711b.webp',0,3,'2026-04-06 22:03:45'),(70,8,'products/product_8_8e35e0e8.webp','product_8_8e35e0e8.webp',0,4,'2026-04-06 22:03:48'),(71,8,'products/product_8_7dd45a26.webp','product_8_7dd45a26.webp',0,5,'2026-04-06 22:03:51'),(72,9,'products/product_9_cf8ceb11.webp','product_9_cf8ceb11.webp',1,1,'2026-04-06 22:05:26'),(73,9,'products/product_9_8cdce951.webp','product_9_8cdce951.webp',0,2,'2026-04-06 22:05:30'),(74,9,'products/product_9_bdee80fb.webp','product_9_bdee80fb.webp',0,3,'2026-04-06 22:05:34'),(75,9,'products/product_9_47ba5d5c.webp','product_9_47ba5d5c.webp',0,4,'2026-04-06 22:05:37'),(76,10,'products/product_10_1b370de9.webp','product_10_1b370de9.webp',1,1,'2026-04-06 22:07:16'),(77,10,'products/product_10_817f0ea0.webp','product_10_817f0ea0.webp',0,2,'2026-04-06 22:07:18'),(78,10,'products/product_10_e3601acd.webp','product_10_e3601acd.webp',0,3,'2026-04-06 22:07:21'),(79,10,'products/product_10_3811cbc0.webp','product_10_3811cbc0.webp',0,4,'2026-04-06 22:07:23'),(80,15,'products/product_15_fa5149b4.webp','product_15_fa5149b4.webp',1,1,'2026-04-06 22:22:36'),(81,15,'products/product_15_81d9dead.webp','product_15_81d9dead.webp',0,2,'2026-04-06 22:22:40'),(82,15,'products/product_15_99227eac.webp','product_15_99227eac.webp',0,3,'2026-04-06 22:22:43'),(83,14,'products/product_14_3b8ef2a8.webp','product_14_3b8ef2a8.webp',1,1,'2026-04-06 22:23:52'),(84,14,'products/product_14_a1f7977a.webp','product_14_a1f7977a.webp',0,2,'2026-04-06 22:23:56'),(85,14,'products/product_14_d74b33c9.webp','product_14_d74b33c9.webp',0,3,'2026-04-06 22:24:05'),(86,14,'products/product_14_9628bc97.webp','product_14_9628bc97.webp',0,4,'2026-04-06 22:24:08'),(87,13,'products/product_13_1caa4d4a.webp','product_13_1caa4d4a.webp',1,1,'2026-04-06 22:25:22'),(88,13,'products/product_13_d5437bea.webp','product_13_d5437bea.webp',0,2,'2026-04-06 22:25:25'),(89,13,'products/product_13_a9f1e991.webp','product_13_a9f1e991.webp',0,3,'2026-04-06 22:25:29'),(90,13,'products/product_13_8711ee8e.webp','product_13_8711ee8e.webp',0,4,'2026-04-06 22:25:31'),(91,13,'products/product_13_fe05c273.webp','product_13_fe05c273.webp',0,5,'2026-04-06 22:25:33'),(92,12,'products/product_12_03bd13f3.webp','product_12_03bd13f3.webp',1,1,'2026-04-06 22:26:56'),(93,12,'products/product_12_9553a94b.webp','product_12_9553a94b.webp',0,2,'2026-04-06 22:26:59'),(94,12,'products/product_12_5d8faab7.webp','product_12_5d8faab7.webp',0,3,'2026-04-06 22:27:06'),(95,12,'products/product_12_0bf7b16e.webp','product_12_0bf7b16e.webp',0,4,'2026-04-06 22:27:10'),(96,12,'products/product_12_a1084069.webp','product_12_a1084069.webp',0,5,'2026-04-06 22:27:16'),(97,12,'products/product_12_8bff50dc.webp','product_12_8bff50dc.webp',0,6,'2026-04-06 22:27:19'),(98,11,'products/product_11_1292d8d7.webp','product_11_1292d8d7.webp',1,1,'2026-04-06 22:28:31'),(99,11,'products/product_11_2b876aaa.webp','product_11_2b876aaa.webp',0,2,'2026-04-06 22:28:33'),(100,11,'products/product_11_4dc2f2ab.png','product_11_4dc2f2ab.png',0,3,'2026-04-06 22:28:39'),(101,11,'products/product_11_c17b0265.webp','product_11_c17b0265.webp',0,4,'2026-04-06 22:28:43'),(102,11,'products/product_11_4a1bd774.webp','product_11_4a1bd774.webp',0,5,'2026-04-06 22:28:47');
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_specs`
--

DROP TABLE IF EXISTS `product_specs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `product_specs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL COMMENT 'FK → products (1-1)',
  `cpu` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bộ vi xử lý',
  `cpu_speed` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Tốc độ xử lý',
  `ram` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Bộ nhớ RAM',
  `ram_slots` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Số khe RAM',
  `storage` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ổ cứng',
  `storage_slots` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Số khe M.2',
  `display` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Màn hình',
  `resolution` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Độ phân giải',
  `gpu` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Card đồ họa',
  `battery` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Thông tin pin',
  `os` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Hệ điều hành',
  `ports` text COLLATE utf8mb4_unicode_ci COMMENT 'Các cổng kết nối',
  `wifi` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Chuẩn WiFi',
  `bluetooth` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Phiên bản Bluetooth',
  `weight` decimal(4,2) DEFAULT NULL COMMENT 'Trọng lượng (kg)',
  `dimensions` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Kích thước (mm)',
  `color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Màu sắc',
  `warranty` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Thời gian bảo hành',
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_id` (`product_id`),
  CONSTRAINT `fk_spec_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng thông số kỹ thuật laptop';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_specs`
--

LOCK TABLES `product_specs` WRITE;
/*!40000 ALTER TABLE `product_specs` DISABLE KEYS */;
INSERT INTO `product_specs` VALUES (1,1,'Intel Core i7-13650HX','2.6GHz, Turbo 4.9GHz','16GB DDR5','2 khe, tối đa 32GB','1TB SSD NVMe PCIe 4.0','1 khe M.2 trống','16 inch IPS 165Hz QHD','2560x1600','NVIDIA GeForce RTX 4070 8GB','90Wh, sạc 240W','Windows 11 Home','USB-A 3.2 x2, USB-C 3.2, HDMI 2.1, RJ45','WiFi 6E (802.11ax)','5.3',2.30,'355x252x29.9mm','Eclipse Gray','24 tháng'),(2,2,'Intel Core i9-13980HX','2.2GHz, Turbo 5.6GHz','32GB DDR5','2 khe, tối đa 64GB','2TB SSD NVMe PCIe 5.0','1 khe M.2 trống','17.3 inch UHD IPS 144Hz','3840x2160','NVIDIA GeForce RTX 4090 16GB','99.9Wh, sạc 330W','Windows 11 Pro','USB-A 3.2 x3, USB-C Thunderbolt 4 x2, HDMI 2.1, SD Card, RJ45','WiFi 6E (802.11ax)','5.3',3.10,'397x300x23.9mm','Titan Gray','24 tháng'),(3,3,'Intel Core i9-13980HX','2.2GHz, Turbo 5.6GHz','32GB DDR5','2 khe, tối đa 64GB','2TB SSD NVMe PCIe 4.0','Không còn khe trống','18 inch QHD+ IPS 165Hz','2560x1600','NVIDIA GeForce RTX 4080 12GB','86Wh, sạc 330W','Windows 11 Home','USB-A 3.2 x3, USB-C Thunderbolt 4, HDMI 2.1, SD Card, RJ45','WiFi 6E (802.11ax)','5.3',4.15,'424x323x25.7mm','Dark Side of the Moon','12 tháng'),(4,4,'Intel Core i7-1365U','1.8GHz, Turbo 5.2GHz','16GB LPDDR5','Hàn trực tiếp (không nâng cấp)','512GB SSD NVMe PCIe 4.0','Không có khe trống','14 inch IPS 2.8K 90Hz','2880x1800','Intel Iris Xe Graphics','57Wh, sạc 65W','Windows 11 Pro','USB-A 3.2 x2, USB-C Thunderbolt 4 x2, HDMI 2.0, SD Card','WiFi 6E (802.11ax)','5.3',1.12,'315x222x14.9mm','Deep Black','36 tháng'),(5,5,'Intel Core i7-1365U','1.8GHz, Turbo 5.2GHz','16GB DDR5','1 khe, tối đa 32GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','14 inch IPS FHD','1920x1080','Intel Iris Xe Graphics','51Wh, sạc 65W','Windows 11 Pro','USB-A 3.2 x2, USB-C Thunderbolt 4, HDMI 2.0, SD Card','WiFi 6E (802.11ax)','5.3',1.34,'318x216x17.2mm','Silver','36 tháng'),(6,6,'Intel Core Ultra 7 155H','1.4GHz, Turbo 4.8GHz','16GB LPDDR5X','Hàn trực tiếp (không nâng cấp)','1TB SSD NVMe PCIe 4.0','Không có khe trống','14 inch OLED 2.8K 120Hz','2880x1800','Intel Arc Graphics','75Wh, sạc 65W','Windows 11 Home','USB-A 3.2 x2, USB-C Thunderbolt 4 x2, HDMI 2.1, SD Card','WiFi 6E (802.11ax)','5.3',1.20,'311x220x14.9mm','Jasper Gray','24 tháng'),(7,7,'Intel Core i9-13900H','2.6GHz, Turbo 5.4GHz','32GB DDR5','2 khe, tối đa 64GB','1TB SSD NVMe PCIe 4.0','1 khe M.2 trống','15.6 inch OLED 3.5K 60Hz','3456x2160','NVIDIA GeForce RTX 4070 8GB','86Wh, sạc 130W','Windows 11 Home','USB-A 3.0, USB-C Thunderbolt 4 x2, SD Card, HDMI 2.0','WiFi 6 (802.11ax)','5.3',1.86,'344x230x18mm','Platinum Silver','12 tháng'),(8,8,'Intel Core i5-1335U','1.3GHz, Turbo 4.6GHz','16GB DDR5','1 khe, tối đa 32GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','15.6 inch IPS FHD','1920x1080','Intel Iris Xe Graphics','56.5Wh, sạc 45W','Windows 11 Home','USB-A 3.2 x2, USB-A 2.0, USB-C, HDMI 2.1, SD Card, RJ45','WiFi 6 (802.11ax)','5.0',1.70,'362x238x17.9mm','Pure Silver','12 tháng'),(9,9,'Intel Core i5-1340P','1.9GHz, Turbo 4.6GHz','16GB LPDDR5','1 khe, tối đa 40GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','14 inch IPS 2.8K 90Hz','2880x1800','Intel Iris Xe Graphics','60Wh, sạc 65W','Windows 11 Home','USB-A 3.2 x2, USB-C Thunderbolt 4, HDMI 2.0','WiFi 6E (802.11ax)','5.3',1.46,'314x221x16.9mm','Arctic Grey','24 tháng'),(10,10,'Apple M3','8 lõi CPU, 10 lõi GPU','16GB Unified Memory','Hàn trực tiếp (không nâng cấp)','512GB SSD','Không có khe trống','15.3 inch Liquid Retina','2880x1864','Apple M3 10-core GPU','66.5Wh, sạc 70W MagSafe','macOS Sonoma','Thunderbolt 3 (USB-C) x2, MagSafe 3, 3.5mm Jack','WiFi 6E (802.11ax)','5.3',1.51,'340x237x11.5mm','Midnight','12 tháng'),(26,13,'AMD Ryzen 7 7735HS','3.2 GHz, Turbo 4.75 GHz','16GB DDR5 4800MHz','2 khe, tối đa 32GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','15.6 inch IPS 144Hz Anti-glare','1920 x 1080 (FHD)','NVIDIA GeForce RTX 4060 8GB GDDR6','90Wh, sạc 240W','Windows 11 Home','1x USB-A 3.2 Gen2, 2x USB-A 3.2 Gen1, 1x USB-C 3.2, 1x HDMI 2.1, 1x RJ45, 1x Jack 3.5mm','WiFi 6 (802.11ax)','Bluetooth 5.0',2.20,'354 x 259 x 22.4 mm','Mecha Gray','24 tháng'),(27,14,'Intel Core i5-13450HX','2.4 GHz, Turbo 4.6 GHz','16GB DDR5 4800MHz','2 khe, tối đa 32GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','15.6 inch IPS 144Hz','1920 x 1080 (FHD)','NVIDIA GeForce RTX 4060 8GB GDDR6','80Wh, sạc 230W','Windows 11 Home','2x USB-A 3.2 Gen1, 1x USB-C 3.2, 1x HDMI 2.1, 1x RJ45, 1x Jack 3.5mm','WiFi 6 (802.11ax)','Bluetooth 5.1',2.40,'360 x 266 x 21.9 mm','Luna Grey','12 tháng'),(28,15,'Intel Core i5-13420H','2.1 GHz, Turbo 4.6 GHz','8GB DDR5 4800MHz','1 khe trống, tối đa 32GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','15.6 inch IPS 144Hz Anti-glare','1920 x 1080 (FHD)','NVIDIA GeForce RTX 4050 6GB GDDR6','57.5Wh, sạc 135W','Windows 11 Home','1x USB-A 3.2 Gen2, 2x USB-A 3.2 Gen1, 1x USB-C 3.2, 1x HDMI 2.1, 1x RJ45, 1x Jack 3.5mm','WiFi 6 (802.11ax)','Bluetooth 5.1',2.10,'363.4 x 254.5 x 23.9 mm','Black','12 tháng'),(29,16,'Intel Core i7-13650HX','2.6 GHz, Turbo 4.9 GHz','16GB DDR5 4800MHz','2 khe, tối đa 32GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','15.6 inch FHD IPS 165Hz Anti-glare','1920 x 1080 (FHD)','NVIDIA GeForce RTX 4060 8GB GDDR6','86Wh, sạc 240W','Windows 11 Home','3x USB-A 3.2 Gen1, 1x USB-C 3.2, 1x HDMI 2.1, 1x RJ45, 1x Jack 3.5mm','WiFi 6 (802.11ax)','Bluetooth 5.3',2.54,'357.6 x 272.2 x 19.8 mm','Dark Shadow Grey','12 tháng'),(30,17,'Apple M3 Pro','11 nhân CPU (5 hiệu năng + 6 tiết kiệm)','18GB Unified Memory','Gắn liền SoC, không nâng cấp','512GB SSD','Không','14.2 inch Liquid Retina XDR 120Hz ProMotion','3024 x 1964','Apple M3 Pro GPU 14 nhân','72.4Wh, sạc MagSafe 3 96W','macOS Sonoma','3x Thunderbolt 4, 1x MagSafe 3, 1x HDMI 2.1, 1x SD card, 1x Jack 3.5mm','WiFi 6E (802.11ax)','Bluetooth 5.3',1.61,'312.6 x 221.2 x 15.5 mm','Space Black','12 tháng'),(31,18,'Intel Core i5-1335U','1.3 GHz, Turbo 4.6 GHz','8GB DDR4 3200MHz','1 khe trống, tối đa 16GB','512GB SSD NVMe PCIe 3.0','1 khe M.2 trống','15.6 inch FHD IPS 60Hz Anti-glare','1920 x 1080 (FHD)','NVIDIA GeForce MX570A 2GB GDDR6','41Wh, sạc 65W','Windows 11 Home','1x USB-A 3.2 Gen1, 2x USB-A 3.0, 1x USB-C 3.2, 1x HDMI 1.4, 1x Jack 3.5mm','WiFi 6 (802.11ax)','Bluetooth 5.0',1.75,'359.5 x 241.7 x 17.5 mm','Natural Silver','12 tháng'),(32,19,'AMD Ryzen 5 7530U','2.0 GHz, Turbo 4.5 GHz','16GB DDR4 3200MHz','1 khe trống, tối đa 40GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','14 inch OLED 2.8K 90Hz','2880 x 1800','AMD Radeon 660M Graphics','60Wh, sạc 65W USB-C','Windows 11 Pro','2x USB-A 3.2 Gen1, 1x USB-C 3.2 Gen2, 1x HDMI 2.0, 1x Jack 3.5mm','WiFi 6E (802.11ax)','Bluetooth 5.1',1.46,'323.7 x 227.5 x 16.9 mm','Arctic Grey','24 tháng'),(33,20,'Intel Core i5-1335U','1.3 GHz, Turbo 4.6 GHz','8GB DDR4 3200MHz','1 khe trống, tối đa 16GB','512GB SSD NVMe PCIe 3.0','1 khe M.2 trống','15.6 inch FHD IPS 60Hz Anti-glare','1920 x 1080 (FHD)','Intel Iris Xe Graphics','42Wh, sạc 65W','Windows 11 Pro','1x USB-C 3.2, 2x USB-A 3.2 Gen1, 1x USB-A 2.0, 1x HDMI 1.4, 1x RJ45, 1x Jack 3.5mm','WiFi 6 (802.11ax)','Bluetooth 5.0',1.78,'361.3 x 233.6 x 19.9 mm','Star Black','24 tháng'),(34,21,'Intel Core i5-1235U','1.3 GHz, Turbo 4.4 GHz','8GB DDR4 3200MHz','1 khe trống, tối đa 16GB','512GB SSD NVMe PCIe 3.0','1 khe M.2 trống','14 inch FHD IPS 60Hz','1920 x 1080 (FHD)','Intel Iris Xe Graphics','52.4Wh, sạc 65W USB-C','Windows 11 Home','1x USB-C 3.2, 2x USB-A 3.2 Gen1, 1x HDMI 2.0, 1x Jack 3.5mm','WiFi 6E (802.11ax)','Bluetooth 5.2',1.40,'321.4 x 214.9 x 19.9 mm','Urban Silver','24 tháng'),(35,22,'Intel Core i5-1335U','1.3 GHz, Turbo 4.6 GHz','16GB LPDDR5 4800MHz','Gắn liền, không nâng cấp','512GB SSD NVMe PCIe 4.0','Không','14 inch OLED 2.8K 90Hz','2880 x 1800','Intel Iris Xe Graphics','65Wh, sạc 65W USB-C','Windows 11 Home','2x Thunderbolt 4, 1x USB-A 3.2 Gen1, 1x HDMI 2.0, 1x Jack 3.5mm','WiFi 6E (802.11ax)','Bluetooth 5.2',1.35,'313.9 x 216.7 x 14.95 mm','Misty Gray','12 tháng'),(36,23,'Intel Core i3-1215U','1.2 GHz, Turbo 4.4 GHz','8GB DDR4 3200MHz','1 khe trống, tối đa 16GB','256GB SSD NVMe PCIe 3.0','1 khe M.2 trống','15.6 inch FHD IPS 60Hz Anti-glare','1920 x 1080 (FHD)','Intel UHD Graphics','41Wh, sạc 45W','Windows 11 Home','1x USB-A 3.2 Gen1, 2x USB-A 2.0, 1x USB-C 3.2, 1x HDMI 1.4, 1x Jack 3.5mm','WiFi 5 (802.11ac)','Bluetooth 4.2',1.69,'358.9 x 241.9 x 17.9 mm','Natural Silver','12 tháng'),(37,24,'AMD Ryzen 5 7535HS','3.3 GHz, Turbo 4.55 GHz','16GB DDR5 4800MHz','2 khe, tối đa 32GB','512GB SSD NVMe PCIe 4.0','1 khe M.2 trống','15.6 inch IPS 144Hz','1920 x 1080 (FHD)','NVIDIA GeForce RTX 4050 6GB GDDR6','60Wh, sạc 170W','Windows 11 Home','2x USB-A 3.2 Gen1, 1x USB-C 3.2, 1x HDMI 2.1, 1x RJ45, 1x Jack 3.5mm','WiFi 6 (802.11ax)','Bluetooth 5.1',2.20,'359.8 x 255.2 x 21.9 mm','Onyx Grey','12 tháng'),(38,25,'Intel Core i5-1235U','1.3 GHz, Turbo 4.4 GHz','8GB DDR4 3200MHz','1 khe trống, tối đa 32GB','256GB SSD NVMe PCIe 3.0','1 khe M.2 trống','15.6 inch FHD WVA 120Hz Anti-glare','1920 x 1080 (FHD)','Intel Iris Xe Graphics','41Wh, sạc 65W','Windows 11 Home','1x USB-A 3.2 Gen1, 2x USB-A 2.0, 1x USB-C 3.2, 1x HDMI 1.4, 1x RJ45, 1x SD card, 1x Jack 3.5mm','WiFi 6 (802.11ax)','Bluetooth 5.0',1.80,'358.5 x 234.8 x 19.9 mm','Carbon Black','12 tháng'),(39,26,'Intel Core Ultra 7 155H','1.4 GHz, Turbo 4.8 GHz','32GB LPDDR5X 7467MHz','Gắn liền, không nâng cấp','1TB SSD NVMe PCIe 4.0','Không','14 inch OLED 3K 120Hz','2880 x 1800','Intel Arc Graphics','75Wh, sạc 65W USB-C','Windows 11 Home','2x Thunderbolt 4, 1x USB-A 3.2 Gen2, 1x HDMI 2.1, 1x Jack 3.5mm','WiFi 6E (802.11ax)','Bluetooth 5.3',1.20,'312.4 x 216.0 x 14.9 mm','Ponder Blue','24 tháng'),(40,27,'Intel Core Ultra 7 155U','1.7 GHz, Turbo 4.8 GHz','16GB LPDDR5 6400MHz','Gắn liền, không nâng cấp','1TB SSD NVMe PCIe 4.0','Không','14 inch OLED Cảm ứng 2.8K 120Hz','2880 x 1800','Intel Graphics','66Wh, sạc 96W USB-C','Windows 11 Pro','2x Thunderbolt 4, 1x USB-A 3.2 Gen2, 1x HDMI 2.0, 1x Jack 3.5mm','WiFi 6E (802.11ax)','Bluetooth 5.3',1.44,'307 x 218.8 x 17.0 mm','Slate Blue','12 tháng'),(41,12,'','','','','','','','','','','','','','',NULL,'','',''),(42,11,'','','','','','','','','','','','','','',NULL,'','','');
/*!40000 ALTER TABLE `product_specs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `category_id` int NOT NULL COMMENT 'FK → categories',
  `brand_id` int NOT NULL COMMENT 'FK → brands',
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên sản phẩm',
  `slug` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Đường dẫn URL thân thiện',
  `short_desc` text COLLATE utf8mb4_unicode_ci COMMENT 'Mô tả ngắn',
  `description` longtext COLLATE utf8mb4_unicode_ci COMMENT 'Mô tả chi tiết',
  `price` decimal(15,0) NOT NULL COMMENT 'Giá gốc (VNĐ)',
  `sale_price` decimal(15,0) DEFAULT NULL COMMENT 'Giá khuyến mãi',
  `quantity` int NOT NULL DEFAULT '0' COMMENT 'Số lượng tồn kho',
  `sold_count` int NOT NULL DEFAULT '0' COMMENT 'Tổng số đã bán',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Hiển thị, 0=Ẩn',
  `is_featured` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1=Sản phẩm nổi bật',
  `is_bestseller` tinyint(1) NOT NULL DEFAULT '0' COMMENT '1=Bán chạy',
  `avg_rating` decimal(3,2) NOT NULL DEFAULT '0.00' COMMENT 'Điểm đánh giá TB',
  `review_count` int NOT NULL DEFAULT '0' COMMENT 'Số lượt đánh giá',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  KEY `idx_prod_category` (`category_id`),
  KEY `idx_prod_brand` (`brand_id`),
  KEY `idx_prod_status` (`status`,`is_featured`),
  KEY `idx_prod_price` (`price`),
  KEY `idx_prod_created` (`created_at`),
  CONSTRAINT `fk_product_brand` FOREIGN KEY (`brand_id`) REFERENCES `brands` (`id`),
  CONSTRAINT `fk_product_category` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=26 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng sản phẩm laptop';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,1,1,'Asus ROG Strix G16 2024','asus-rog-strix-g16-2024','Laptop gaming mạnh mẽ với RTX 4070, màn hình 165Hz QHD','Asus ROG Strix G16 2024 là lựa chọn hoàn hảo cho game thủ với hiệu năng vượt trội, tản nhiệt xuất sắc và thiết kế cá tính.',32990000,30990000,15,0,1,1,1,0.00,0,'2026-03-28 23:52:19','2026-04-06 21:54:37'),(2,1,7,'MSI Titan GT77 HX','msi-titan-gt77-hx','Laptop gaming đỉnh cao với Intel Core i9 và RTX 4090','MSI Titan GT77 HX là siêu laptop gaming với chip Intel thế hệ 13, RTX 4090 mạnh nhất và màn hình 4K 144Hz.',79990000,NULL,5,0,1,0,0,0.00,0,'2026-03-28 23:52:19','2026-04-06 21:55:59'),(3,1,2,'Dell Alienware m18 R1','dell-alienware-m18-r1','Laptop gaming màn hình lớn 18 inch, hiệu năng không giới hạn','Dell Alienware m18 R1 mang đến trải nghiệm gaming đỉnh cao với màn hình 18 inch QHD+, RTX 4080 và hệ thống làm mát Cherry MX.',59990000,54990000,8,0,1,1,0,0.00,0,'2026-03-28 23:52:19','2026-04-10 01:25:21'),(4,2,4,'Lenovo ThinkPad X1 Carbon Gen 11','lenovo-thinkpad-x1-carbon-gen-11','Laptop doanh nhân siêu mỏng nhẹ, pin 15 giờ, bảo mật vân tay','ThinkPad X1 Carbon Gen 11 là laptop doanh nhân hàng đầu với trọng lượng chỉ 1.12kg, pin lên đến 15 giờ sử dụng.',38990000,35990000,20,0,1,1,1,0.00,0,'2026-03-28 23:52:19','2026-04-06 21:58:32'),(5,2,3,'HP EliteBook 840 G10','hp-elitebook-840-g10','Laptop văn phòng cao cấp chuẩn doanh nghiệp, bảo mật HP Wolf','HP EliteBook 840 G10 được thiết kế cho môi trường doanh nghiệp với bảo mật nhiều lớp và hiệu năng ổn định.',28990000,26990000,25,0,1,0,0,0.00,0,'2026-03-28 23:52:19','2026-04-06 22:00:11'),(6,2,1,'Asus ZenBook 14 OLED 2024','asus-zenbook-14-oled-2024','Laptop siêu mỏng màn hình OLED 14 inch, trọng lượng 1.2kg','Asus ZenBook 14 OLED 2024 sở hữu màn hình OLED rực rỡ, thiết kế sang trọng mỏng chỉ 14.9mm và hiệu năng ấn tượng.',23990000,21990000,30,0,1,1,1,0.00,0,'2026-03-28 23:52:19','2026-04-06 22:01:16'),(7,3,2,'Dell XPS 15 9530 OLED','dell-xps-15-9530-oled','Laptop thiết kế đồ họa màn hình OLED 3.5K, màu chuẩn 100% DCI-P3','Dell XPS 15 9530 là lựa chọn số 1 cho nhà thiết kế với màn hình OLED 3.5K siêu sắc nét, độ phủ màu 100% DCI-P3.',45990000,42990000,10,0,1,1,0,0.00,0,'2026-03-28 23:52:19','2026-04-06 22:02:32'),(8,4,6,'Acer Aspire 5 A515-58','acer-aspire-5-a515-58','Laptop sinh viên giá tốt, Core i5 Gen 13, RAM 16GB, SSD 512GB','Acer Aspire 5 A515-58 là laptop sinh viên toàn diện với hiệu năng tốt, pin bền và mức giá phù hợp túi tiền.',14990000,13490000,50,0,1,0,1,0.00,0,'2026-03-28 23:52:19','2026-04-06 22:03:52'),(9,4,4,'Lenovo IdeaPad Slim 5i Gen 8','lenovo-ideapad-slim-5i-gen-8','Laptop mỏng nhẹ, pin 12 giờ, màn hình 14 inch 2.8K','Lenovo IdeaPad Slim 5i Gen 8 là lựa chọn lý tưởng cho sinh viên với màn hình 2.8K sắc nét và pin khủng 12 giờ.',17990000,16490000,35,0,1,0,1,0.00,0,'2026-03-28 23:52:19','2026-04-06 22:05:39'),(10,5,5,'Apple MacBook Air M3 15 inch','apple-macbook-air-m3-15-inch','MacBook Air mỏng nhẹ nhất, chip M3, màn hình Liquid Retina 15 inch','MacBook Air M3 15 inch là laptop mỏng nhẹ nhất từ Apple với chip M3 siêu mạnh mà không cần quạt tản nhiệt.',34990000,NULL,19,1,1,1,1,0.00,0,'2026-03-28 23:52:19','2026-04-19 10:51:18'),(11,1,1,'ASUS TUF Gaming A15 FA507NV-LP042W','asus-tuf-gaming-a15-fa507nv-lp042w','Laptop gaming tầm trung bền bỉ, AMD Ryzen 7 7735HS, RTX 4060, màn hình 144Hz.','ASUS TUF Gaming A15 là dòng gaming nổi tiếng với độ bền cao, đạt chuẩn quân sự MIL-SPEC 810H. Trang bị AMD Ryzen 7 7735HS 8 nhân mạnh mẽ kết hợp NVIDIA GeForce RTX 4060 8GB, màn hình 15.6 inch FHD 144Hz cho trải nghiệm gaming ổn định và mượt mà.',22990000,20990000,20,31,1,1,1,4.50,17,'2026-04-01 21:12:40','2026-04-19 00:04:57'),(12,1,4,'Lenovo LOQ 15IRX9 83DV00CLVN','lenovo-loq-15irx9-83dv00clvn','Laptop gaming giá tốt, Intel Core i5 Gen 13, RTX 4060, tản nhiệt hiệu quả.','Lenovo LOQ 15IRX9 là sự lựa chọn hoàn hảo cho game thủ tìm kiếm hiệu năng cao trong tầm giá hợp lý. Trang bị Intel Core i5-13450HX, NVIDIA RTX 4060 8GB, màn hình 15.6 inch FHD 144Hz. Hệ thống tản nhiệt Lenovo Cold Front 5.0 duy trì nhiệt độ ổn định khi gaming.',21990000,19490000,18,26,1,0,1,4.40,14,'2026-04-01 21:12:40','2026-04-06 22:27:20'),(13,1,6,'Acer Nitro V 15 ANV15-51-57Q2','acer-nitro-v-15-anv15-51-57q2','Laptop gaming entry-level, Intel Core i5 Gen 13, RTX 4050, 144Hz, giá tốt nhất phân khúc.','Acer Nitro V 15 là lựa chọn gaming entry-level đáng giá với Intel Core i5-13420H và NVIDIA GeForce RTX 4050 6GB. Màn hình IPS 15.6 inch Full HD 144Hz cho hình ảnh sắc nét mượt mà. Thiết kế tản nhiệt với 2 quạt và 4 ống dẫn nhiệt đảm bảo hiệu năng bền vững.',18990000,17490000,30,48,1,0,1,4.20,25,'2026-04-01 21:12:40','2026-04-06 22:25:35'),(14,1,2,'Dell G15 5530 RTX 4060 2024','dell-g15-5530-rtx-4060-2024','Laptop gaming Dell G-Series, Intel Core i7 Gen 13, RTX 4060, màn hình 165Hz FHD.','Dell G15 5530 mang lại hiệu năng gaming mạnh mẽ với Intel Core i7-13650HX và NVIDIA GeForce RTX 4060 8GB. Màn hình 15.6 inch FHD 165Hz với thời gian phản hồi 3ms lý tưởng cho FPS. Hệ thống tản nhiệt Alienware-derived với 4 ống đồng.',27990000,25490000,10,20,1,1,0,4.50,9,'2026-04-01 21:12:40','2026-04-22 22:23:54'),(15,3,5,'Apple MacBook Pro 14 M3 2024','apple-macbook-pro-14-m3-2024','Laptop đồ họa chuyên nghiệp, chip M3 Pro, màn hình Liquid Retina XDR, pin 18 giờ.','MacBook Pro 14 M3 2024 dành cho các nhà sáng tạo chuyên nghiệp. Chip Apple M3 Pro 11 nhân CPU, 14 nhân GPU mang lại hiệu năng xử lý đồ họa, video vượt trội. Màn hình Liquid Retina XDR 14.2 inch, độ sáng 1000 nit, hỗ trợ ProMotion 120Hz.',52990000,NULL,8,6,1,1,0,4.90,4,'2026-04-01 21:12:40','2026-04-06 22:22:44'),(16,2,3,'HP Pavilion 15 eg3096TX 2024','hp-pavilion-15-eg3096tx-2024','Laptop văn phòng phổ thông, Intel Core i5 Gen 13, card MX570A, màn hình FHD IPS.','HP Pavilion 15 eg3096TX là laptop văn phòng toàn diện với Intel Core i5-1335U và card đồ họa NVIDIA MX570A 2GB giúp xử lý tác vụ đồ họa nhẹ. Màn hình 15.6 inch FHD IPS micro-edge viền mỏng, bàn phím có đèn nền, pin 41Wh.',14990000,13490000,25,19,1,0,0,4.10,11,'2026-04-01 21:12:40','2026-04-06 21:45:06'),(17,2,4,'Lenovo ThinkBook 14 G6 ABP','lenovo-thinkbook-14-g6-abp','Laptop văn phòng AMD Ryzen 5 7530U, màn hình 2.8K OLED 90Hz, siêu mỏng nhẹ.','ThinkBook 14 G6 ABP kết hợp thiết kế mỏng nhẹ chuyên nghiệp với hiệu năng AMD Ryzen 5 7530U ổn định. Điểm nổi bật là màn hình 14 inch 2.8K OLED 90Hz sắc nét tuyệt vời, lý tưởng cho tác vụ văn phòng và giải trí. Vỏ nhôm chắc chắn, pin 60Wh.',17990000,16490000,15,12,1,0,0,4.30,7,'2026-04-01 21:12:40','2026-04-06 21:40:33'),(18,2,1,'ASUS ExpertBook B1 B1502CVA 2024','asus-expertbook-b1-b1502cva-2024','Laptop doanh nghiệp bền bỉ, Intel Core i5 Gen 13, pin 42Wh, chuẩn MIL-SPEC.','ASUS ExpertBook B1 B1502CVA là laptop doanh nghiệp đáng tin cậy với Intel Core i5-1335U. Đạt chuẩn quân sự MIL-SPEC 810H, bàn phím chống tràn, pin 42Wh có thể dùng đến 8 giờ. Cổng kết nối đa dạng bao gồm USB-C, HDMI, RJ45 phù hợp môi trường văn phòng.',13990000,12490000,21,16,1,0,0,4.00,8,'2026-04-01 21:12:40','2026-04-16 23:24:37'),(19,2,7,'MSI Modern 14 C12MO-660VN','msi-modern-14-c12mo-660vn','Laptop văn phòng mỏng nhẹ MSI, Intel Core i5 Gen 12, thiết kế tinh tế, giá hợp lý.','MSI Modern 14 là laptop văn phòng với thiết kế tối giản tinh tế, vỏ nhôm nguyên khối. Intel Core i5-1235U hiệu quả, 8GB RAM DDR4, 512GB SSD NVMe. Màn hình 14 inch FHD IPS 60Hz tái tạo màu sắc tốt. Trọng lượng 1.4kg, mỏng 19.9mm dễ mang theo.',11990000,10990000,28,22,1,0,1,4.10,13,'2026-04-01 21:12:40','2026-04-06 21:35:46'),(20,4,6,'Acer Swift Go 14 SFG14-71-51QT','acer-swift-go-14-sfg14-71-51qt','Laptop sinh viên mỏng nhẹ, Intel Core i5 Gen 13, màn hình 2.8K OLED 90Hz.','Acer Swift Go 14 nổi bật với màn hình 2.8K OLED 90Hz trong tầm giá sinh viên. Intel Core i5-1335U, 16GB LPDDR5, 512GB SSD NVMe PCIe 4.0. Thiết kế nhôm thời trang, trọng lượng chỉ 1.35kg, pin 65Wh dùng cả ngày. Kết nối Thunderbolt 4 và WiFi 6E.',16490000,14990000,20,18,1,0,1,4.40,10,'2026-04-01 21:12:40','2026-04-19 01:23:40'),(21,4,3,'HP 15s fq5233TU 2024','hp-15s-fq5233tu-2024','Laptop sinh viên giá rẻ nhất HP, Intel Core i3 Gen 12, pin 41Wh, đủ dùng cho học tập.','HP 15s fq5233TU là lựa chọn tiết kiệm nhất cho sinh viên với Intel Core i3-1215U, 8GB RAM, 256GB SSD. Màn hình 15.6 inch FHD IPS anti-glare dễ nhìn. Pin 41Wh dùng được 7-8 tiếng học online. Thiết kế gọn nhẹ, cổng USB đa dạng phù hợp nhu cầu học tập cơ bản.',8990000,8490000,49,74,1,0,1,3.90,38,'2026-04-01 21:12:40','2026-04-19 00:19:07'),(22,1,4,'Lenovo IdeaPad Gaming 3 15ARH7','lenovo-ideapad-gaming-3-15arh7','Laptop gaming AMD Ryzen 5 7535HS, RTX 4050, màn hình 144Hz, giá cực tốt.','IdeaPad Gaming 3 15ARH7 mang đến gaming hiệu quả với AMD Ryzen 5 7535HS 6 nhân và NVIDIA GeForce RTX 4050 6GB. Màn hình 15.6 inch FHD IPS 144Hz. RAM 16GB DDR5, SSD 512GB NVMe. Hệ thống tản nhiệt kép với 2 quạt và 3 ống đồng. Bàn phím có đèn nền trắng.',19490000,17990000,21,36,1,0,1,5.00,1,'2026-04-01 21:12:40','2026-04-11 17:15:22'),(23,4,2,'Dell Vostro 3520 i5 1235U 2024','dell-vostro-3520-i5-1235u-2024','Laptop phổ thông Dell cho học tập và văn phòng, Intel Core i5 Gen 12, giá ổn định.','Dell Vostro 3520 là laptop phổ thông dành cho doanh nghiệp vừa và nhỏ, sinh viên. Intel Core i5-1235U, 8GB DDR4, 256GB SSD. Màn hình 15.6 inch FHD WVA anti-glare. Thiết kế chắc chắn với vỏ nhựa ABS cao cấp. Bảo hành Dell chính hãng 12 tháng tại nhà.',12490000,11490000,35,28,1,0,0,4.00,14,'2026-04-01 21:12:40','2026-04-06 21:25:31'),(24,5,1,'ASUS Zenbook 14 OLED UX3405MA','asus-zenbook-14-oled-ux3405ma','Laptop doanh nhân siêu mỏng, Intel Core Ultra 7, màn hình OLED 3K 120Hz, AI PC.','ASUS Zenbook 14 OLED là AI PC cao cấp với Intel Core Ultra 7 155H (Meteor Lake), NPU tích hợp cho tác vụ AI. Màn hình OLED 14 inch 3K 120Hz 100% DCI-P3 tuyệt đẹp. Thiết kế Ceraluminum siêu mỏng 14.9mm nặng chỉ 1.2kg. Pin 75Wh, sạc nhanh USB-C 65W.',27990000,25990000,10,7,1,1,0,4.70,5,'2026-04-01 21:12:40','2026-04-10 01:33:50'),(25,5,3,'HP Spectre x360 14 ef2013TU 2024','hp-spectre-x360-14-ef2013tu-2024','Laptop 2-in-1 cao cấp nhất HP, Intel Core Ultra 7, màn hình OLED cảm ứng, bút stylus.','HP Spectre x360 14 là laptop 2-in-1 flagship của HP với thiết kế xoay gập 360 độ. Intel Core Ultra 7 155U, màn hình OLED 2.8K cảm ứng 120Hz kèm bút HP MPP 2.0. Vỏ nhôm cao cấp, viền màn hình siêu mỏng 4 phía. Bảo mật vân tay + IR camera, pin 66Wh.',35990000,33490000,3,7,1,1,0,4.80,3,'2026-04-01 21:12:40','2026-04-19 00:45:28');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reviews` (
  `id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL COMMENT 'FK → products',
  `user_id` int NOT NULL COMMENT 'FK → users',
  `rating` tinyint NOT NULL COMMENT 'Số sao: 1-5',
  `comment` text COLLATE utf8mb4_unicode_ci COMMENT 'Nội dung nhận xét',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Hiển thị, 0=Ẩn',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `images` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_user_product` (`product_id`,`user_id`),
  KEY `fk_review_user` (`user_id`),
  KEY `idx_review_product` (`product_id`),
  CONSTRAINT `fk_review_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`),
  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `chk_rating` CHECK ((`rating` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng đánh giá sản phẩm';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
INSERT INTO `reviews` VALUES (1,1,2,5,'Laptop cực mạnh, chơi game mượt mà, tản nhiệt tốt. Rất hài lòng với sản phẩm!',1,'2026-03-28 23:52:19',NULL),(2,6,3,5,'Màn hình OLED đẹp xuất sắc, pin trâu, máy mỏng nhẹ. Đáng tiền!',1,'2026-03-28 23:52:19',NULL),(3,4,4,4,'Laptop chắc chắn, bàn phím gõ sướng, phù hợp làm việc văn phòng. Chỉ tiếc là không có webcam FHD.',1,'2026-03-28 23:52:19',NULL),(4,8,5,4,'Giá tốt cho cấu hình này, phù hợp sinh viên. Màn hình hơi thường.',1,'2026-03-28 23:52:19',NULL),(5,9,2,5,'Pin khủng thật sự, dùng cả ngày không lo hết pin. Màn hình 2.8K rất đẹp.',1,'2026-03-28 23:52:19',NULL),(6,22,7,5,'san pham ratt tott va dẹp',1,'2026-04-11 17:15:09','[\"reviews/e01adf135b9b4c52bebf50ebe42461f1.webp\"]');
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `shipping_info`
--

DROP TABLE IF EXISTS `shipping_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `shipping_info` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL COMMENT 'FK → orders (1-1)',
  `receiver_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tên người nhận',
  `receiver_phone` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'SĐT người nhận',
  `address` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Số nhà, tên đường',
  `ward` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Phường / Xã',
  `district` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Quận / Huyện',
  `province` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Tỉnh / Thành phố',
  `postal_code` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Mã bưu điện',
  `note` text COLLATE utf8mb4_unicode_ci COMMENT 'Ghi chú địa chỉ',
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_id` (`order_id`),
  CONSTRAINT `fk_shipping_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng địa chỉ giao hàng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `shipping_info`
--

LOCK TABLES `shipping_info` WRITE;
/*!40000 ALTER TABLE `shipping_info` DISABLE KEYS */;
INSERT INTO `shipping_info` VALUES (1,1,'Nguyễn Văn An','0912345678','12 Trần Duy Hưng','Trung Hòa','Cầu Giấy','Hà Nội',NULL,NULL),(2,2,'Trần Thị Bình','0923456789','45 Nguyễn Huệ','Bến Nghé','Quận 1','TP. Hồ Chí Minh',NULL,NULL),(3,3,'Lê Minh Cường','0934567890','23 Bạch Đằng','Thạch Thang','Hải Châu','Đà Nẵng',NULL,NULL),(4,4,'Nguyễn Văn An','0912345678','12 Trần Duy Hưng','Trung Hòa','Cầu Giấy','Hà Nội',NULL,NULL),(5,5,'Phạm Thu Dung','0945678901','78 Nguyễn Trãi','An Hòa','Ninh Kiều','Cần Thơ',NULL,NULL),(6,6,'Trần Thị Bình','0923456789','45 Nguyễn Huệ','Bến Nghé','Quận 1','TP. Hồ Chí Minh',NULL,NULL),(7,7,'Trần Văn Nam','0875478524','12a','bn','1','Hà Nội',NULL,''),(8,8,'Trần Văn Nam','0875478524','tan thinh','bong lai','qvo','Bắc Ninh',NULL,''),(9,9,'Trần Văn Nam','0875478524','tt','bl','qv','Bắc Ninh',NULL,''),(10,10,'Trần Văn Nam','0875478524','tân thịnh','Bồng lai','Quế võ','Bắc Ninh',NULL,''),(11,11,'Trần Văn Nam','0875478524','11','bl','2','TP. Hồ Chí Minh',NULL,''),(12,12,'Trần Văn Nam','0875478524','23a','xuân phương','q1','TP. Hồ Chí Minh',NULL,''),(13,13,'Trần Văn Nam','0875478524','11','11','1','TP. Hồ Chí Minh',NULL,''),(14,14,'Trần Văn Nam','0875478524','11','11','1','TP. Hồ Chí Minh',NULL,''),(15,15,'Trần Văn Nam','0875478524','11','1','1','TP. Hồ Chí Minh',NULL,'1'),(16,16,'Trần Văn Nam','0875478524','12a','bong lai','2','TP. Hồ Chí Minh',NULL,''),(17,17,'Trần Văn Nam','0875478524','1','1','1','TP. Hồ Chí Minh',NULL,'1');
/*!40000 ALTER TABLE `shipping_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Họ và tên người dùng',
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Email đăng nhập - không trùng lặp',
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'Mật khẩu đã mã hóa bcrypt',
  `phone` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Số điện thoại liên hệ',
  `address` text COLLATE utf8mb4_unicode_ci COMMENT 'Địa chỉ mặc định',
  `avatar` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Đường dẫn ảnh đại diện',
  `role` enum('admin','customer') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'customer' COMMENT 'Vai trò người dùng',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '1=Hoạt động, 0=Bị khóa',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Thời điểm tạo tài khoản',
  `updated_at` datetime DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP COMMENT 'Thời điểm cập nhật',
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Bảng tài khoản người dùng';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Quản Trị Viên','admin@laptopstore.com','$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdxlHEHGGlFO9Ei','0901234567','Hà Nội',NULL,'admin',1,'2026-03-28 23:52:19',NULL),(2,'Nguyễn Văn An','an.nguyen@gmail.com','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC02pfmqMhr.LKhWFues','0912345678','Hà Nội',NULL,'customer',1,'2026-03-28 23:52:19','2026-03-31 00:08:24'),(3,'Trần Thị Bình','binh.tran@gmail.com','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC02pfmqMhr.LKhWFues','0923456789','TP. Hồ Chí Minh',NULL,'customer',1,'2026-03-28 23:52:19',NULL),(4,'Lê Minh Cường','cuong.le@gmail.com','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC02pfmqMhr.LKhWFues','0934567890','Đà Nẵng',NULL,'customer',1,'2026-03-28 23:52:19',NULL),(5,'Phạm Thu Dung','dung.pham@gmail.com','$2b$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC02pfmqMhr.LKhWFues','0945678901','Cần Thơ',NULL,'customer',1,'2026-03-28 23:52:19',NULL),(6,'Trần Văn Thuận','tvanthuan235@gmail.com','$2b$12$X2jr0pDHouM.bNCnVPvk8.4BwJPTB7MztlZ3SVedNnT59MrKP4U2y','0867845804',NULL,NULL,'admin',1,'2026-03-30 03:36:00','2026-03-30 10:39:48'),(7,'Trần Văn Nam','nam2004@gmail.com','$2b$12$PthNY7cX/3c3LX.zvuR7Ve1KajwfkyA6bLP6umB7V0bSK0CRHDMvi','0875478524',NULL,NULL,'customer',1,'2026-04-08 14:34:51','2026-05-05 04:28:16'),(8,'Trần Văn Thiên','t@gmail.com','$2b$12$caj1K76zSuE979jJeCwSxeRhshyM7gY5IKfj7unkEkf61AjMrPD3K','0867845804',NULL,NULL,'customer',1,'2026-04-17 12:12:30',NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-06-24 19:10:52

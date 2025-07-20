-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: ballast.proxy.rlwy.net    Database: atendimento_fila
-- ------------------------------------------------------
-- Server version	9.3.0

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
-- Table structure for table `analistas_atendimento`
--

DROP TABLE IF EXISTS `analistas_atendimento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analistas_atendimento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analistas_atendimento`
--

LOCK TABLES `analistas_atendimento` WRITE;
/*!40000 ALTER TABLE `analistas_atendimento` DISABLE KEYS */;
INSERT INTO `analistas_atendimento` VALUES (1,'Danilo Meneses','danilo.dsi@gmail.com','2025-07-19 21:53:42'),(2,'Caio Lucas','caio.rm@gmail.com','2025-07-19 21:53:42'),(3,'Henrique','henrique@gmail.com','2025-07-19 21:53:42'),(4,'José','jose@gmail.com','2025-07-19 21:53:42');
/*!40000 ALTER TABLE `analistas_atendimento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atendimentos`
--

DROP TABLE IF EXISTS `atendimentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atendimentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `analista_id` int NOT NULL,
  `consultor_id` int DEFAULT NULL,
  `chegada_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `inicio_em` timestamp NULL DEFAULT NULL,
  `finalizado_em` timestamp NULL DEFAULT NULL,
  `status` enum('AGUARDANDO','EM_ATENDIMENTO','FINALIZADO','CANCELADO') DEFAULT 'AGUARDANDO',
  `prioridade` int DEFAULT '0',
  `case_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `analista_id` (`analista_id`),
  KEY `consultor_id` (`consultor_id`),
  CONSTRAINT `atendimentos_ibfk_1` FOREIGN KEY (`analista_id`) REFERENCES `analistas_atendimento` (`id`),
  CONSTRAINT `atendimentos_ibfk_2` FOREIGN KEY (`consultor_id`) REFERENCES `consultores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendimentos`
--

LOCK TABLES `atendimentos` WRITE;
/*!40000 ALTER TABLE `atendimentos` DISABLE KEYS */;
INSERT INTO `atendimentos` VALUES (1,1,1,'2025-07-19 21:54:49',NULL,NULL,'FINALIZADO',0,'001'),(2,2,2,'2025-07-19 21:54:49',NULL,NULL,'FINALIZADO',0,'002'),(3,2,4,'2025-07-20 01:42:16','2025-07-20 01:42:20','2025-07-20 02:21:59','FINALIZADO',0,'123456'),(4,3,1,'2025-07-20 01:42:50','2025-07-20 02:21:09','2025-07-20 02:22:10','FINALIZADO',0,'1321545'),(5,1,4,'2025-07-20 02:21:19','2025-07-20 02:22:27','2025-07-20 02:25:40','FINALIZADO',0,'12345678'),(6,2,1,'2025-07-20 02:21:33','2025-07-20 02:22:43','2025-07-20 02:25:41','FINALIZADO',0,'45687921'),(7,3,3,'2025-07-20 02:21:43','2025-07-20 02:22:47','2025-07-20 02:31:17','FINALIZADO',0,'4561328'),(8,1,4,'2025-07-20 02:25:57','2025-07-20 02:26:03','2025-07-20 02:31:13','FINALIZADO',0,'1325464'),(9,1,2,'2025-07-20 02:27:45','2025-07-20 02:28:07','2025-07-20 02:31:16','FINALIZADO',0,'13216546'),(10,3,1,'2025-07-20 02:27:58','2025-07-20 02:31:11','2025-07-20 02:31:15','FINALIZADO',0,'12315645'),(11,4,4,'2025-07-20 02:30:53','2025-07-20 02:31:20','2025-07-20 02:37:48','FINALIZADO',0,'131254564'),(12,1,2,'2025-07-20 02:31:06','2025-07-20 02:31:24','2025-07-20 02:37:49','FINALIZADO',0,'13215454'),(13,4,1,'2025-07-20 02:35:20','2025-07-20 02:35:24','2025-07-20 02:37:50','FINALIZADO',0,'1231546'),(14,1,4,'2025-07-20 02:38:48','2025-07-20 02:38:58','2025-07-20 02:52:03','FINALIZADO',0,'12345678'),(15,3,1,'2025-07-20 02:39:33','2025-07-20 02:39:39','2025-07-20 02:52:04','FINALIZADO',0,'13456654'),(16,4,2,'2025-07-20 02:45:17','2025-07-20 02:45:21','2025-07-20 02:52:05','FINALIZADO',0,'7898979'),(17,2,3,'2025-07-20 02:48:26','2025-07-20 02:48:31','2025-07-20 02:52:06','FINALIZADO',0,'789745477'),(18,4,4,'2025-07-20 02:52:19','2025-07-20 02:52:25','2025-07-20 02:53:00','FINALIZADO',0,'74859612'),(19,2,4,'2025-07-20 02:53:15','2025-07-20 02:53:19','2025-07-20 03:06:41','FINALIZADO',0,'78956468'),(20,3,4,'2025-07-20 03:07:01','2025-07-20 03:07:04','2025-07-20 15:00:08','FINALIZADO',0,'13215646'),(21,1,1,'2025-07-20 14:59:45','2025-07-20 15:00:11','2025-07-20 17:14:06','FINALIZADO',0,'12345687'),(22,1,4,'2025-07-20 17:13:58','2025-07-20 17:14:07','2025-07-20 17:34:04','FINALIZADO',0,'12345678'),(23,2,4,'2025-07-20 17:33:43','2025-07-20 17:34:20','2025-07-20 17:34:38','FINALIZADO',0,'12345678'),(24,3,1,'2025-07-20 17:34:12','2025-07-20 17:34:40',NULL,'EM_ATENDIMENTO',0,'13456878');
/*!40000 ALTER TABLE `atendimentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultores`
--

DROP TABLE IF EXISTS `consultores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `meet_link` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `disponivel` tinyint(1) DEFAULT '1',
  `email` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `criado_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultores`
--

LOCK TABLES `consultores` WRITE;
/*!40000 ALTER TABLE `consultores` DISABLE KEYS */;
INSERT INTO `consultores` VALUES (1,'Gean','https://meet.google.com/qtd-kypv-fza',0,NULL,'2025-07-19 21:51:26'),(2,'Joel','https://meet.google.com/thz-mgsz-ktq',1,NULL,'2025-07-19 21:51:26'),(3,'Kikão','https://meet.google.com/qtd-kypv-fza',1,NULL,'2025-07-19 21:51:26'),(4,'Galileu','https://meet.google.com/thz-mgsz-ktq',1,NULL,'2025-07-19 21:51:26');
/*!40000 ALTER TABLE `consultores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `perfil` enum('ADMIN','CONSULTOR','ANALISTA') NOT NULL DEFAULT 'ANALISTA',
  `ativo` tinyint(1) DEFAULT '1',
  `ultimo_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-20 15:24:39
-- MySQL dump 10.13  Distrib 8.0.42, for Win64 (x86_64)
--
-- Host: ballast.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.3.0

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
-- Table structure for table `analistas_atendimento`
--

DROP TABLE IF EXISTS `analistas_atendimento`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `analistas_atendimento` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analistas_atendimento`
--

LOCK TABLES `analistas_atendimento` WRITE;
/*!40000 ALTER TABLE `analistas_atendimento` DISABLE KEYS */;
INSERT INTO `analistas_atendimento` VALUES (1,'Analista Manual','2025-07-13 23:32:24','manual@example.com'),(2,'Teste novo','2025-07-13 23:56:44','novo@gmail.com'),(3,'Novo teste','2025-07-14 00:08:42','teste@gmail.com'),(4,'Danilo','2025-07-14 01:00:12','danilo@gamil.com');
/*!40000 ALTER TABLE `analistas_atendimento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atendimentos`
--

DROP TABLE IF EXISTS `atendimentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atendimentos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `analista_id` int NOT NULL,
  `consultor_id` int DEFAULT NULL,
  `chegada_em` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `inicio_em` timestamp NULL DEFAULT NULL,
  `finalizado_em` timestamp NULL DEFAULT NULL,
  `status` enum('AGUARDANDO','EM_ATENDIMENTO','FINALIZADO','CANCELADO') DEFAULT 'AGUARDANDO',
  `prioridade` int DEFAULT '0',
  `case_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `analista_id` (`analista_id`),
  KEY `consultor_id` (`consultor_id`),
  CONSTRAINT `atendimentos_ibfk_1` FOREIGN KEY (`analista_id`) REFERENCES `analistas_atendimento` (`id`),
  CONSTRAINT `atendimentos_ibfk_2` FOREIGN KEY (`consultor_id`) REFERENCES `consultores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=54 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendimentos`
--

LOCK TABLES `atendimentos` WRITE;
/*!40000 ALTER TABLE `atendimentos` DISABLE KEYS */;
INSERT INTO `atendimentos` VALUES (8,2,1,'2025-07-13 23:57:07','2025-07-14 00:06:00','2025-07-14 00:06:03','FINALIZADO',0,'78945612'),(12,2,1,'2025-07-14 00:09:51','2025-07-14 00:10:44','2025-07-14 00:10:46','FINALIZADO',0,'89977978'),(13,2,1,'2025-07-14 00:10:13','2025-07-14 00:10:47','2025-07-14 00:10:49','FINALIZADO',0,'8897799987'),(14,1,1,'2025-07-14 00:23:36','2025-07-14 00:23:53','2025-07-14 00:23:56','FINALIZADO',0,'78979789'),(15,3,1,'2025-07-14 00:29:21','2025-07-14 00:29:25','2025-07-14 00:29:32','FINALIZADO',0,'12425525'),(16,4,1,'2025-07-14 01:00:26','2025-07-14 01:00:31','2025-07-14 01:00:35','FINALIZADO',0,'11221122'),(17,2,1,'2025-07-14 01:21:25','2025-07-14 01:21:44','2025-07-14 01:21:46','FINALIZADO',0,'001234458'),(19,1,1,'2025-07-14 01:37:54','2025-07-14 01:43:10','2025-07-14 01:43:12','FINALIZADO',0,'45678915'),(20,2,1,'2025-07-14 01:43:20','2025-07-14 11:03:41','2025-07-14 11:03:44','FINALIZADO',0,'78946512'),(21,4,1,'2025-07-14 11:07:26','2025-07-14 11:09:39','2025-07-14 12:48:22','FINALIZADO',0,'00011222'),(22,3,3,'2025-07-14 11:07:37','2025-07-14 11:08:03','2025-07-14 11:08:58','FINALIZADO',23,'23654454'),(23,4,1,'2025-07-14 13:06:55','2025-07-14 13:07:09','2025-07-14 19:38:26','FINALIZADO',0,'00011221'),(24,3,4,'2025-07-14 19:38:35','2025-07-14 19:38:44','2025-07-14 19:41:45','FINALIZADO',0,'1231654'),(25,4,1,'2025-07-14 19:40:18','2025-07-14 19:42:31','2025-07-14 19:42:33','FINALIZADO',0,'12316546'),(26,4,1,'2025-07-15 13:40:16','2025-07-15 13:41:24','2025-07-15 14:51:58','FINALIZADO',0,'12354678'),(27,3,1,'2025-07-15 13:40:37','2025-07-15 14:52:02','2025-07-15 14:52:07','FINALIZADO',0,'11231156'),(28,2,2,'2025-07-15 14:58:25','2025-07-15 14:59:49','2025-07-15 14:59:55','FINALIZADO',0,'12345689'),(29,3,2,'2025-07-15 15:02:45','2025-07-15 15:02:53','2025-07-15 15:03:41','FINALIZADO',0,'12231156'),(30,4,1,'2025-07-16 10:55:59','2025-07-16 10:56:08','2025-07-16 10:56:13','FINALIZADO',0,'12345678'),(31,4,1,'2025-07-16 14:57:20','2025-07-16 16:10:38','2025-07-16 16:10:42','FINALIZADO',0,'1231564'),(32,4,1,'2025-07-16 14:58:04','2025-07-16 16:10:38','2025-07-16 20:08:16','FINALIZADO',0,'12315646'),(33,1,4,'2025-07-16 16:10:55','2025-07-16 16:10:57','2025-07-16 16:11:04','FINALIZADO',0,'12345678'),(34,2,5,'2025-07-16 17:12:37','2025-07-16 17:13:10','2025-07-16 18:14:04','FINALIZADO',0,'12345678'),(35,1,3,'2025-07-16 17:12:49','2025-07-16 17:38:19','2025-07-16 18:14:03','FINALIZADO',0,'25625625'),(36,2,1,'2025-07-16 17:13:02','2025-07-16 18:11:13','2025-07-16 18:14:01','FINALIZADO',0,'15948737'),(37,4,2,'2025-07-16 17:13:37','2025-07-16 18:12:09','2025-07-16 18:14:02','FINALIZADO',0,'12345678'),(38,3,1,'2025-07-16 17:36:48','2025-07-16 18:14:19','2025-07-16 20:08:14','FINALIZADO',39,'11231564'),(40,1,2,'2025-07-16 18:11:58','2025-07-16 20:08:55','2025-07-16 20:09:00','FINALIZADO',0,'12356464'),(41,4,2,'2025-07-16 20:08:45','2025-07-16 20:45:21','2025-07-16 21:00:30','FINALIZADO',0,'12345678'),(42,3,1,'2025-07-16 20:29:50','2025-07-16 20:45:06','2025-07-16 21:00:04','FINALIZADO',43,'78945654'),(43,3,5,'2025-07-16 20:47:04','2025-07-16 20:59:47','2025-07-16 21:00:20','FINALIZADO',0,'12345687'),(44,2,1,'2025-07-16 21:08:16','2025-07-16 21:08:24','2025-07-16 21:11:18','FINALIZADO',0,'12345645'),(45,1,1,'2025-07-16 21:12:02','2025-07-16 21:12:12','2025-07-16 21:12:55','FINALIZADO',0,'12345678'),(46,4,1,'2025-07-16 21:20:03','2025-07-16 21:20:22','2025-07-17 10:59:35','FINALIZADO',0,'12345678'),(47,3,1,'2025-07-18 16:30:33','2025-07-18 16:30:46','2025-07-18 16:31:24','FINALIZADO',0,'12345654'),(48,4,1,'2025-07-18 16:36:30','2025-07-18 16:36:34','2025-07-18 16:37:46','FINALIZADO',0,'123456'),(49,3,1,'2025-07-18 16:37:35','2025-07-18 16:37:48','2025-07-18 21:58:21','FINALIZADO',0,'12345687'),(50,1,5,'2025-07-18 17:10:01','2025-07-18 17:10:22','2025-07-18 21:59:06','FINALIZADO',0,'13254648'),(51,1,1,'2025-07-18 21:57:32','2025-07-18 21:58:28','2025-07-18 21:59:00','FINALIZADO',0,'123545678'),(52,3,2,'2025-07-18 21:57:57','2025-07-18 21:59:10','2025-07-18 21:59:38','FINALIZADO',0,'78945621'),(53,1,1,'2025-07-19 00:39:45','2025-07-19 00:39:54','2025-07-19 00:40:13','FINALIZADO',0,'12315448');
/*!40000 ALTER TABLE `atendimentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultores`
--

DROP TABLE IF EXISTS `consultores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultores` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `meet_link` varchar(255) NOT NULL,
  `disponivel` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `email` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultores`
--

LOCK TABLES `consultores` WRITE;
/*!40000 ALTER TABLE `consultores` DISABLE KEYS */;
INSERT INTO `consultores` VALUES (1,'Danilo','https://meet.google.com/fuv-nafk-rfg?authuser=0',1,'2025-07-14 00:05:56','danilo@gmail.com'),(2,'Gean','https://meet.google.com/fuv-nafk-rfg?authuser=0',1,'2025-07-14 00:06:48','gean@gmail.com'),(3,'Kikão','https://meet.google.com/bap-zhog-gea?authuser=0',1,'2025-07-14 00:07:05','kikao@gmail.com'),(4,'Joel','https://meet.google.com/fuv-nafk-rfg?authuser=0',1,'2025-07-14 00:07:21','joel@gmail.com'),(5,'Galileu','https://meet.google.com/fuv-nafk-rfg?authuser=0',1,'2025-07-14 00:07:39','galileu@gmail.com');
/*!40000 ALTER TABLE `consultores` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `nome` varchar(255) NOT NULL,
  `perfil` enum('ADMIN','CONSULTOR','ANALISTA') NOT NULL DEFAULT 'ANALISTA',
  `ativo` tinyint(1) DEFAULT '1',
  `ultimo_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-20 15:24:44

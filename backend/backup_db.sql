-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: atendimento_fila
-- ------------------------------------------------------
-- Server version	5.5.5-10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
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
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `analistas_atendimento`
--

LOCK TABLES `analistas_atendimento` WRITE;
/*!40000 ALTER TABLE `analistas_atendimento` DISABLE KEYS */;
INSERT INTO `analistas_atendimento` VALUES (1,'Danilo Meneses','2025-07-12 00:24:39','danilo.dsi@gmail.com'),(2,'Caio Lucas','2025-07-12 00:24:47','caio.rm@gmail.com'),(3,'Henrique','2025-07-12 00:30:57','henrique@gmail.com'),(4,'Jos├®','2025-07-12 00:34:41','jose@gmail.com'),(5,'Silvia','2025-07-13 21:14:19',''),(6,'Novo Analista Teste','2025-07-13 22:54:24','analista@gmail.com'),(8,'Analista teste Novo','2025-07-13 23:21:00','novo@gmail.com'),(9,'Analista Teste Final','2025-07-13 23:26:44','teste@gmail.com');
/*!40000 ALTER TABLE `analistas_atendimento` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `atendimentos`
--

DROP TABLE IF EXISTS `atendimentos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `atendimentos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `analista_id` int(11) NOT NULL,
  `consultor_id` int(11) DEFAULT NULL,
  `status` enum('AGUARDANDO','EM_ATENDIMENTO','FINALIZADO') DEFAULT 'AGUARDANDO',
  `chegada_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `inicio_em` timestamp NULL DEFAULT NULL,
  `finalizado_em` timestamp NULL DEFAULT NULL,
  `prioridade` int(11) DEFAULT 0,
  `case_number` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `analista_id` (`analista_id`),
  KEY `consultor_id` (`consultor_id`),
  CONSTRAINT `atendimentos_ibfk_1` FOREIGN KEY (`analista_id`) REFERENCES `analistas_atendimento` (`id`),
  CONSTRAINT `atendimentos_ibfk_2` FOREIGN KEY (`consultor_id`) REFERENCES `consultores` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `atendimentos`
--

LOCK TABLES `atendimentos` WRITE;
/*!40000 ALTER TABLE `atendimentos` DISABLE KEYS */;
INSERT INTO `atendimentos` VALUES (1,1,1,'FINALIZADO','2025-07-12 00:25:57','2025-07-12 00:28:20','2025-07-12 00:29:15',0,NULL),(2,2,1,'FINALIZADO','2025-07-12 00:26:14','2025-07-12 00:29:38','2025-07-12 00:30:15',0,NULL),(3,1,1,'FINALIZADO','2025-07-12 00:31:13','2025-07-12 00:35:05','2025-07-12 00:35:44',0,NULL),(4,2,2,'FINALIZADO','2025-07-12 00:31:20','2025-07-12 00:35:55','2025-07-12 00:36:02',0,NULL),(5,3,3,'FINALIZADO','2025-07-12 00:31:25','2025-07-12 00:36:10','2025-07-12 00:36:12',0,NULL),(6,4,1,'FINALIZADO','2025-07-12 00:34:53','2025-07-12 00:36:13','2025-07-12 00:36:15',0,NULL),(8,3,1,'FINALIZADO','2025-07-12 20:28:08','2025-07-12 20:40:30','2025-07-12 20:44:58',0,NULL),(9,4,2,'FINALIZADO','2025-07-12 20:28:16','2025-07-12 20:46:22','2025-07-12 20:46:28',1,NULL),(10,3,1,'FINALIZADO','2025-07-12 20:44:31','2025-07-12 20:46:37','2025-07-12 20:46:39',0,NULL),(11,1,1,'FINALIZADO','2025-07-12 20:44:35','2025-07-12 20:45:44','2025-07-12 20:46:05',12,NULL),(12,2,3,'FINALIZADO','2025-07-12 20:44:40','2025-07-12 20:46:33','2025-07-12 20:46:34',1,NULL),(13,2,2,'FINALIZADO','2025-07-12 21:00:54','2025-07-12 21:01:09','2025-07-12 21:01:23',0,NULL),(14,1,1,'FINALIZADO','2025-07-12 23:48:51','2025-07-12 23:49:28','2025-07-12 23:49:33',15,NULL),(15,3,3,'FINALIZADO','2025-07-12 23:48:57','2025-07-12 23:49:34','2025-07-12 23:49:35',0,NULL),(16,1,1,'FINALIZADO','2025-07-12 23:49:01','2025-07-12 23:49:23','2025-07-12 23:49:25',17,NULL),(17,2,1,'FINALIZADO','2025-07-12 23:50:31','2025-07-12 23:50:34','2025-07-12 23:53:17',0,NULL),(18,2,1,'FINALIZADO','2025-07-12 23:53:36','2025-07-12 23:53:41','2025-07-12 23:56:27',0,NULL),(19,1,1,'FINALIZADO','2025-07-12 23:56:35','2025-07-12 23:56:41','2025-07-12 23:57:21',0,NULL),(20,1,1,'FINALIZADO','2025-07-12 23:57:29','2025-07-12 23:57:31','2025-07-12 23:57:41',0,NULL),(21,2,1,'FINALIZADO','2025-07-12 23:57:46','2025-07-12 23:57:50','2025-07-12 23:57:51',0,NULL),(22,2,1,'FINALIZADO','2025-07-13 00:01:28','2025-07-13 00:01:32','2025-07-13 00:02:11',0,NULL),(23,2,1,'FINALIZADO','2025-07-13 00:02:35','2025-07-13 00:02:38','2025-07-13 00:04:28',0,NULL),(24,2,1,'FINALIZADO','2025-07-13 00:04:37','2025-07-13 00:04:39','2025-07-13 00:04:44',0,NULL),(25,2,1,'FINALIZADO','2025-07-13 00:06:22','2025-07-13 00:06:25','2025-07-13 00:07:48',0,NULL),(26,1,3,'FINALIZADO','2025-07-13 00:07:53','2025-07-13 00:08:09','2025-07-13 00:08:17',0,NULL),(27,3,2,'FINALIZADO','2025-07-13 00:07:57','2025-07-13 00:08:11','2025-07-13 00:08:19',0,NULL),(28,4,1,'FINALIZADO','2025-07-13 00:08:02','2025-07-13 00:08:13','2025-07-13 00:08:18',0,NULL),(29,1,2,'FINALIZADO','2025-07-13 00:37:19','2025-07-13 00:58:55','2025-07-13 00:58:59',0,NULL),(30,2,2,'FINALIZADO','2025-07-13 00:37:53','2025-07-13 00:38:15','2025-07-13 00:38:27',31,NULL),(31,2,2,'FINALIZADO','2025-07-13 01:04:53','2025-07-13 01:06:27','2025-07-13 01:06:31',0,NULL),(32,1,1,'FINALIZADO','2025-07-13 01:05:06','2025-07-13 01:05:49','2025-07-13 01:06:20',33,NULL),(33,1,1,'FINALIZADO','2025-07-13 01:35:51','2025-07-13 01:35:55','2025-07-13 01:38:38',0,'00123456'),(34,2,1,'FINALIZADO','2025-07-13 01:36:22','2025-07-13 01:42:11','2025-07-13 01:42:15',0,'00111111'),(35,2,1,'FINALIZADO','2025-07-13 01:44:44','2025-07-13 02:01:52','2025-07-13 02:01:54',0,'2323232'),(36,2,3,'FINALIZADO','2025-07-13 02:01:44','2025-07-13 02:01:55','2025-07-13 02:01:57',0,'22332233'),(37,2,4,'FINALIZADO','2025-07-13 16:58:20','2025-07-13 17:13:07','2025-07-13 17:13:14',0,'01020304'),(38,1,1,'FINALIZADO','2025-07-13 16:58:33','2025-07-13 17:13:09','2025-07-13 17:13:15',0,'01010101'),(39,3,2,'FINALIZADO','2025-07-13 16:58:53','2025-07-13 17:13:09','2025-07-13 17:13:16',0,'02030203'),(40,4,3,'FINALIZADO','2025-07-13 16:59:11','2025-07-13 17:13:10','2025-07-13 17:13:17',0,'04050607'),(41,2,4,'FINALIZADO','2025-07-13 23:50:36','2025-07-13 23:50:39','2025-07-13 23:50:42',0,'12345678');
/*!40000 ALTER TABLE `atendimentos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `consultores`
--

DROP TABLE IF EXISTS `consultores`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consultores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `meet_link` varchar(255) NOT NULL,
  `disponivel` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `email` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `consultores`
--

LOCK TABLES `consultores` WRITE;
/*!40000 ALTER TABLE `consultores` DISABLE KEYS */;
INSERT INTO `consultores` VALUES (1,'Gean','https://meet.google.com/qtd-kypv-fza',1,'2025-07-12 00:25:38',NULL),(2,'Joel','https://meet.google.com/thz-mgsz-ktq',1,'2025-07-12 00:26:59',NULL),(3,'Kik├úo','https://meet.google.com/qtd-kypv-fza',1,'2025-07-12 00:30:36',NULL),(4,'Galileu','https://meet.google.com/thz-mgsz-ktq',1,'2025-07-13 16:57:49','');
/*!40000 ALTER TABLE `consultores` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-07-18 20:37:05

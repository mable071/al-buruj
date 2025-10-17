-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 17, 2025 at 07:54 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `al_buruj_stock`
--

-- --------------------------------------------------------

--
-- Table structure for table `daily_report`
--

CREATE TABLE `daily_report` (
  `report_id` int(11) NOT NULL,
  `date` date NOT NULL,
  `total_products_in` int(11) NOT NULL DEFAULT 0,
  `total_products_out` int(11) NOT NULL DEFAULT 0,
  `generated_by` varchar(128) NOT NULL,
  `generated_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `product_id` int(11) NOT NULL,
  `product_name` varchar(150) NOT NULL,
  `unit` varchar(32) DEFAULT NULL,
  `description` varchar(512) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `date_added` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`product_id`, `product_name`, `unit`, `description`, `quantity`, `date_added`) VALUES
(35, 'amatsa', 'pcs', 'amata yinyange', 31, '2025-10-17 14:53:33'),
(39, 'cristiano', NULL, NULL, 85, '2025-10-17 15:28:43'),
(40, 'televiso', NULL, 'samsung tv', 45, '2025-10-17 15:47:18'),
(41, 'douches', 'kg', 'toka kure', 567, '2025-10-17 17:57:28');

-- --------------------------------------------------------

--
-- Table structure for table `product_in`
--

CREATE TABLE `product_in` (
  `ProductInID` int(11) NOT NULL,
  `ProductID` int(11) NOT NULL,
  `QuantityIn` int(11) NOT NULL,
  `supplier` varchar(255) DEFAULT NULL,
  `DateIn` datetime NOT NULL DEFAULT current_timestamp(),
  `comment` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_in`
--

INSERT INTO `product_in` (`ProductInID`, `ProductID`, `QuantityIn`, `supplier`, `DateIn`, `comment`) VALUES
(25, 35, 29, NULL, '2025-10-17 14:53:34', NULL),
(29, 39, 85, NULL, '2025-10-17 15:28:43', NULL),
(30, 40, 45, NULL, '2025-10-17 15:47:18', NULL),
(31, 35, 6, NULL, '2025-10-17 16:51:21', NULL),
(32, 41, 567, NULL, '2025-10-17 17:57:28', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `product_out`
--

CREATE TABLE `product_out` (
  `out_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity_out` int(11) NOT NULL,
  `date_out` datetime NOT NULL DEFAULT current_timestamp(),
  `issued_by` varchar(128) NOT NULL,
  `purpose` varchar(256) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `product_out`
--

INSERT INTO `product_out` (`out_id`, `product_id`, `quantity_out`, `date_out`, `issued_by`, `purpose`) VALUES
(11, 35, 2, '2025-10-17 14:55:56', 'jo', NULL);

--
-- Triggers `product_out`
--
DELIMITER $$
CREATE TRIGGER `trg_products_dec_qty` BEFORE INSERT ON `product_out` FOR EACH ROW BEGIN
  DECLARE current_qty INT;
  SELECT quantity INTO current_qty FROM products WHERE product_id = NEW.product_id FOR UPDATE;
  IF current_qty < NEW.quantity_out THEN
     SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Insufficient stock';
  END IF;
  UPDATE products
  SET quantity = quantity - NEW.quantity_out
  WHERE product_id = NEW.product_id;
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `user_id` int(11) NOT NULL,
  `username` varchar(64) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('admin','staff') NOT NULL DEFAULT 'staff',
  `created_at` datetime NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`user_id`, `username`, `password_hash`, `role`, `created_at`) VALUES
(1, 'admin', '$2b$10$7NjzmQbyKfI0MU4Mnekngumue1ezTuXb2/AK1oqG7rJFn45ztnZ8K', 'admin', '2025-10-13 11:50:16');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `daily_report`
--
ALTER TABLE `daily_report`
  ADD PRIMARY KEY (`report_id`),
  ADD UNIQUE KEY `date` (`date`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`product_id`),
  ADD UNIQUE KEY `product_name` (`product_name`);

--
-- Indexes for table `product_in`
--
ALTER TABLE `product_in`
  ADD PRIMARY KEY (`ProductInID`),
  ADD KEY `ProductID` (`ProductID`);

--
-- Indexes for table `product_out`
--
ALTER TABLE `product_out`
  ADD PRIMARY KEY (`out_id`),
  ADD KEY `fk_out_product` (`product_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `daily_report`
--
ALTER TABLE `daily_report`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `product_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `product_in`
--
ALTER TABLE `product_in`
  MODIFY `ProductInID` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=33;

--
-- AUTO_INCREMENT for table `product_out`
--
ALTER TABLE `product_out`
  MODIFY `out_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `user_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `product_in`
--
ALTER TABLE `product_in`
  ADD CONSTRAINT `product_in_ibfk_1` FOREIGN KEY (`ProductID`) REFERENCES `products` (`product_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `product_out`
--
ALTER TABLE `product_out`
  ADD CONSTRAINT `fk_out_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

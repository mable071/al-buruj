-- Update Product In table structure
-- Run this in your XAMPP phpMyAdmin or MySQL command line

-- First, let's see the current structure
DESCRIBE product_in;

-- Add new columns to existing product_in table
ALTER TABLE product_in 
ADD COLUMN supplier VARCHAR(255) DEFAULT NULL AFTER quantity_in,
ADD COLUMN comment TEXT DEFAULT NULL AFTER date_in;

-- Update the table to rename columns for consistency
ALTER TABLE product_in 
CHANGE COLUMN in_id ProductInID INT AUTO_INCREMENT PRIMARY KEY,
CHANGE COLUMN product_id ProductID INT NOT NULL,
CHANGE COLUMN quantity_in QuantityIn INT NOT NULL,
CHANGE COLUMN date_in DateIn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Add foreign key constraint if it doesn't exist
ALTER TABLE product_in 
ADD CONSTRAINT fk_product_in_product 
FOREIGN KEY (ProductID) REFERENCES products(product_id) 
ON DELETE CASCADE ON UPDATE CASCADE;

-- Show the updated structure
DESCRIBE product_in;

-- Sample data to test (optional)
-- INSERT INTO product_in (ProductID, QuantityIn, supplier, DateIn, comment) 
-- VALUES (1, 50, 'ABC Suppliers', NOW(), 'Initial stock purchase');

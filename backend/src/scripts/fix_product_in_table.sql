-- Fixed SQL script for Product In table
-- Run this in XAMPP phpMyAdmin

-- First, let's see what columns actually exist
DESCRIBE product_in;

-- If the table doesn't exist, create it from scratch
-- If it exists but has different column names, we'll adapt

-- Option 1: If table doesn't exist, create it
CREATE TABLE IF NOT EXISTS product_in (
    ProductInID INT AUTO_INCREMENT PRIMARY KEY,
    ProductID INT NOT NULL,
    QuantityIn INT NOT NULL,
    supplier VARCHAR(255) DEFAULT NULL,
    DateIn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    comment TEXT DEFAULT NULL,
    FOREIGN KEY (ProductID) REFERENCES products(product_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Option 2: If table exists but has different column names, let's check what we have
-- Run this to see current structure first:
-- DESCRIBE product_in;

-- If you have columns like 'in_id', 'product_id', 'quantity_in', 'date_in', 'received_by'
-- Then we need to rename them and add new columns:

-- Step 1: Add new columns first (if they don't exist)
ALTER TABLE product_in 
ADD COLUMN IF NOT EXISTS supplier VARCHAR(255) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS comment TEXT DEFAULT NULL;

-- Step 2: Rename existing columns to match our new structure
-- (Only run these if the columns exist with different names)
-- ALTER TABLE product_in CHANGE COLUMN in_id ProductInID INT AUTO_INCREMENT;
-- ALTER TABLE product_in CHANGE COLUMN product_id ProductID INT NOT NULL;
-- ALTER TABLE product_in CHANGE COLUMN quantity_in QuantityIn INT NOT NULL;
-- ALTER TABLE product_in CHANGE COLUMN date_in DateIn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 3: Add foreign key constraint if it doesn't exist
-- ALTER TABLE product_in 
-- ADD CONSTRAINT fk_product_in_product 
-- FOREIGN KEY (ProductID) REFERENCES products(product_id) 
-- ON DELETE CASCADE ON UPDATE CASCADE;

-- Show the final structure
DESCRIBE product_in;

import "dotenv/config";
import { pool } from "./src/config/db.js";

async function setupTables() {
    console.log("🔧 Setting up database tables...");
    
    try {
        // Check if tables exist
        const [tables] = await pool.query("SHOW TABLES");
        console.log("📋 Existing tables:", tables.map(t => Object.values(t)[0]));
        
        // Create users table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'staff') DEFAULT 'staff',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Users table ready");
        
        // Create products table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                product_id INT AUTO_INCREMENT PRIMARY KEY,
                product_name VARCHAR(255) NOT NULL,
                unit VARCHAR(32),
                description TEXT,
                quantity INT DEFAULT 0,
                date_added TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log("✅ Products table ready");
        
        // Create product_in table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_in (
                ProductInID INT AUTO_INCREMENT PRIMARY KEY,
                ProductID INT NOT NULL,
                QuantityIn INT NOT NULL,
                supplier VARCHAR(255),
                DateIn DATETIME DEFAULT CURRENT_TIMESTAMP,
                comment TEXT,
                FOREIGN KEY (ProductID) REFERENCES products(product_id) ON DELETE CASCADE
            )
        `);
        console.log("✅ Product_in table ready");
        
        // Create product_out table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS product_out (
                out_id INT AUTO_INCREMENT PRIMARY KEY,
                product_id INT NOT NULL,
                quantity_out INT NOT NULL,
                date_out DATETIME DEFAULT CURRENT_TIMESTAMP,
                issued_by VARCHAR(255) NOT NULL,
                purpose TEXT,
                FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE
            )
        `);
        console.log("✅ Product_out table ready");
        
        // Check if admin user exists
        const [users] = await pool.query("SELECT COUNT(*) as count FROM users WHERE username = 'admin'");
        
        if (users[0].count === 0) {
            console.log("👤 Creating admin user...");
            const bcrypt = await import('bcrypt');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            
            await pool.query(
                "INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')",
                ['admin', hashedPassword]
            );
            console.log("✅ Admin user created (username: admin, password: admin123)");
        } else {
            console.log("✅ Admin user already exists");
        }
        
        // Check if there are any products
        const [productCount] = await pool.query("SELECT COUNT(*) as count FROM products");
        console.log(`📦 Products in database: ${productCount[0].count}`);
        
        console.log("\n🎉 Database setup complete!");
        console.log("You can now start the backend server with: npm run dev");
        
    } catch (error) {
        console.error("❌ Error setting up tables:", error.message);
    } finally {
        await pool.end();
    }
}

setupTables();




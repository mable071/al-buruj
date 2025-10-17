import "dotenv/config";
import mysql from "mysql2/promise";

async function checkDatabase() {
    console.log("🔍 Checking database connection...");
    console.log("Environment variables:");
    console.log("- DB_HOST:", process.env.DB_HOST);
    console.log("- DB_USER:", process.env.DB_USER);
    console.log("- DB_PASSWORD:", process.env.DB_PASSWORD || "(empty)");
    console.log("- DB_NAME:", process.env.DB_NAME);
    
    try {
        // First, try to connect without database
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || "",
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306
        });
        
        console.log("✅ MySQL connection successful!");
        
        // Check if database exists
        const [databases] = await connection.execute(`SHOW DATABASES LIKE '${process.env.DB_NAME}'`);
        
        if (databases.length === 0) {
            console.log("❌ Database 'al_buruj_stock' does not exist!");
            console.log("📝 Creating database...");
            await connection.execute(`CREATE DATABASE ${process.env.DB_NAME}`);
            console.log("✅ Database created successfully!");
        } else {
            console.log("✅ Database 'al_buruj_stock' exists!");
        }
        
        await connection.end();
        
        // Now test with database
        const pool = mysql.createPool({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD || "",
            database: process.env.DB_NAME,
            port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
        
        const [result] = await pool.query("SELECT 1 as test");
        console.log("✅ Database connection with pool successful!");
        
        await pool.end();
        
    } catch (error) {
        console.log("❌ Database error:", error.message);
        console.log("\n🔧 Troubleshooting steps:");
        console.log("1. Make sure XAMPP is running");
        console.log("2. Start MySQL service in XAMPP Control Panel");
        console.log("3. Check if MySQL is running on port 3306");
        console.log("4. Verify database credentials in .env file");
    }
}

checkDatabase();

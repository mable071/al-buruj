import "dotenv/config";
import { pool } from "../config/db.js";

async function main() {
	console.log("DB params:", {
		host: process.env.DB_HOST,
		user: process.env.DB_USER,
		database: process.env.DB_NAME,
	});
	const [rows] = await pool.query(
		"SELECT user_id, username, LENGTH(password_hash) AS hash_len, role FROM users"
	);
	console.table(rows);
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});



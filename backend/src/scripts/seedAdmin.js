import "dotenv/config";
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

async function main() {
	const username = process.env.SEED_ADMIN_USERNAME || "admin";
	const password = process.env.SEED_ADMIN_PASSWORD || "admin123";
	const role = "admin";

	const hash = await bcrypt.hash(password, 10);
	await pool.query(
		"INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE username = username",
		[username, hash, role]
	);
	console.log(`Seeded admin user: ${username}`);
	process.exit(0);
}

main().catch((e) => {
	console.error(e);
	process.exit(1);
});



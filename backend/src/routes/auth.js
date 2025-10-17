import { Router } from "express";
import { pool } from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { loginSchema } from "../utils/validator.js";

export const router = Router();

router.post("/login", async (req, res) => {
	try {
		const parsed = loginSchema.safeParse(req.body);
		if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
		const { username, password } = parsed.data;

		const [rows] = await pool.query(
			"SELECT user_id, username, password_hash, role FROM users WHERE username = ?",
			[username]
		);
		if (rows.length === 0) return res.status(401).json({ error: "Invalid credentials" });

		const user = rows[0];
		const ok = await bcrypt.compare(password, user.password_hash);
		if (!ok) return res.status(401).json({ error: "Invalid credentials" });

		const token = jwt.sign(
			{ user_id: user.user_id, username: user.username, role: user.role },
			process.env.JWT_SECRET,
			{ expiresIn: "8h" }
		);
		console.log("Login successful for user:", user.username);
		return res.json({ token });
	} catch {
		return res.status(500).json({ error: "Server error" });
	}
});



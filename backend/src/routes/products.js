import { Router } from "express";
import { pool } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { addProductSchema } from "../utils/validator.js";

export const router = Router();
router.use(authRequired);

router.get("/", async (_req, res) => {
	const [rows] = await pool.query(
		"SELECT product_id, product_name, unit, description, quantity, date_added FROM products ORDER BY product_name"
	);
	res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
	res.json(rows);
});

router.post("/", async (req, res) => {
	const parsed = addProductSchema.safeParse(req.body);
	if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
	const { product_name, unit = null, description = null } = parsed.data;

	const [result] = await pool.query(
		"INSERT INTO products (product_name, unit, description, quantity, date_added) VALUES (?, ?, ?, 0, NOW())",
		[product_name, unit, description]
	);
	res.status(201).json({ product_id: result.insertId });
});

// Update product (name, unit, description)
router.put("/:id", async (req, res) => {
	const id = Number(req.params.id);
	if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
	const { product_name, unit = null, description = null } = req.body || {};
	if (!product_name && !unit && !description) return res.status(400).json({ error: "Nothing to update" });

	const fields = [];
	const values = [];
	if (product_name) { fields.push("product_name = ?"); values.push(product_name); }
	if (unit !== undefined) { fields.push("unit = ?"); values.push(unit); }
	if (description !== undefined) { fields.push("description = ?"); values.push(description); }
	values.push(id);

	await pool.query(`UPDATE products SET ${fields.join(", ")} WHERE product_id = ?`, values);
	return res.status(204).end();
});

// Delete product
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[row]] = await conn.query("SELECT quantity FROM products WHERE product_id = ? FOR UPDATE", [id]);
        if (!row) { await conn.rollback(); return res.status(404).json({ error: "Not found" }); }
        if (row.quantity !== 0) { await conn.rollback(); return res.status(400).json({ error: "Cannot delete product with non-zero quantity" }); }
        await conn.query("DELETE FROM products WHERE product_id = ?", [id]);
        await conn.commit();
        return res.status(204).end();
    } catch (e) {
        await conn.rollback();
        return res.status(500).json({ error: "Delete failed" });
    } finally {
        conn.release();
    }
});

router.get("/search", async (req, res) => {
	const q = (req.query.q || "").toString();
	const [rows] = await pool.query(
		"SELECT product_id, product_name, unit, description, quantity FROM products WHERE product_name LIKE ? OR unit LIKE ? ORDER BY product_name",
		[`%${q}%`, `%${q}%`]
	);
	res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
	res.json(rows);
});



import { Router } from "express";
import { pool } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { productOutSchema } from "../utils/validator.js";

export const router = Router();
router.use(authRequired);

// List product out entries with product names
router.get("/", async (_req, res) => {
	const [rows] = await pool.query(
		`SELECT o.out_id, o.product_id, p.product_name, o.quantity_out, o.date_out, o.issued_by, o.purpose
		 FROM product_out o JOIN products p ON p.product_id = o.product_id
		 ORDER BY o.date_out DESC, o.out_id DESC`
	);
	return res.json(rows);
});

router.post("/", async (req, res) => {
    try {
        const parsed = productOutSchema.safeParse(req.body);
        if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
        const { product_id, quantity_out, issued_by, purpose = null } = parsed.data;

        const qty = Number(quantity_out);
        if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: "quantity_out must be a positive integer" });

        const conn = await pool.getConnection();
        try {
            await conn.beginTransaction();
            const [[prod]] = await conn.query("SELECT quantity FROM products WHERE product_id = ? FOR UPDATE", [product_id]);
            if (!prod) { await conn.rollback(); return res.status(404).json({ error: "Product not found" }); }
            if (prod.quantity < qty) { await conn.rollback(); return res.status(400).json({ error: "Insufficient stock" }); }

            const [result] = await conn.query(
                "INSERT INTO product_out (product_id, quantity_out, date_out, issued_by, purpose) VALUES (?, ?, NOW(), ?, ?)",
                [product_id, qty, issued_by, purpose]
            );
            await conn.query("UPDATE products SET quantity = quantity - ? WHERE product_id = ?", [qty, product_id]);
            await conn.commit();
            return res.status(201).json({ out_id: result.insertId });
        } catch (e) {
            await conn.rollback();
            return res.status(500).json({ error: "Failed to create product out" });
        } finally {
            conn.release();
        }
    } catch (e) {
        return res.status(500).json({ error: "Failed to create product out" });
    }
});

// Update an out record; adjust product quantity if quantity_out changes
router.put("/:id", async (req, res) => {
	const id = Number(req.params.id);
	if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
	const { quantity_out, issued_by, purpose } = req.body || {};

	const conn = await pool.getConnection();
	try {
		await conn.beginTransaction();
		const [[row]] = await conn.query("SELECT product_id, quantity_out FROM product_out WHERE out_id = ? FOR UPDATE", [id]);
		if (!row) { await conn.rollback(); return res.status(404).json({ error: "Not found" }); }
		const updates = [];
		const params = [];
		if (issued_by !== undefined) { updates.push("issued_by = ?"); params.push(issued_by); }
		if (purpose !== undefined) { updates.push("purpose = ?"); params.push(purpose); }
		if (quantity_out !== undefined && Number.isInteger(Number(quantity_out))) {
			const newQty = Number(quantity_out);
			if (newQty <= 0) { await conn.rollback(); return res.status(400).json({ error: "quantity_out must be > 0" }); }
			const delta = newQty - row.quantity_out; // positive means more out
			if (delta !== 0) {
				// Check stock if increasing out
				if (delta > 0) {
					const [[prod]] = await conn.query("SELECT quantity FROM products WHERE product_id = ? FOR UPDATE", [row.product_id]);
					if (!prod || prod.quantity < delta) { await conn.rollback(); return res.status(400).json({ error: "Insufficient stock for update" }); }
				}
				await conn.query("UPDATE products SET quantity = quantity - ? WHERE product_id = ?", [delta, row.product_id]);
			}
			updates.push("quantity_out = ?"); params.push(newQty);
		}
		if (updates.length === 0) { await conn.rollback(); return res.status(400).json({ error: "Nothing to update" }); }
		params.push(id);
		await conn.query(`UPDATE product_out SET ${updates.join(", ")} WHERE out_id = ?`, params);
		await conn.commit();
		return res.status(204).end();
	} catch (e) {
		await conn.rollback();
		return res.status(500).json({ error: "Update failed" });
	} finally {
		conn.release();
	}
});

// Delete an out record; restore product quantity
router.delete("/:id", async (req, res) => {
	const id = Number(req.params.id);
	if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
	const conn = await pool.getConnection();
	try {
		await conn.beginTransaction();
		const [[row]] = await conn.query("SELECT product_id, quantity_out FROM product_out WHERE out_id = ? FOR UPDATE", [id]);
		if (!row) { await conn.rollback(); return res.status(404).json({ error: "Not found" }); }
		await conn.query("UPDATE products SET quantity = quantity + ? WHERE product_id = ?", [row.quantity_out, row.product_id]);
		await conn.query("DELETE FROM product_out WHERE out_id = ?", [id]);
		await conn.commit();
		return res.status(204).end();
	} catch (e) {
		await conn.rollback();
		return res.status(500).json({ error: "Delete failed" });
	} finally {
		conn.release();
	}
});



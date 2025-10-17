import { Router } from "express";
import { pool } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";
import { productInSchema } from "../utils/validator.js";

export const router = Router();
router.use(authRequired);

// Get all product in records
router.get("/", async (_req, res) => {
	const [rows] = await pool.query(`
		SELECT pi.ProductInID, pi.ProductID, p.product_name, pi.QuantityIn, pi.supplier, pi.DateIn, pi.comment
		FROM product_in pi
		JOIN products p ON pi.ProductID = p.product_id
		ORDER BY pi.DateIn DESC
	`);
	res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
	res.json(rows);
});

// Add new product in record
router.post("/", async (req, res) => {
    const parsed = productInSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
    const { product_id, quantity_in, received_by, supplier = null, comment = null } = parsed.data;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const qty = Number(quantity_in);
        if (!Number.isInteger(qty) || qty <= 0) { await conn.rollback(); return res.status(400).json({ error: "quantity_in must be a positive integer" }); }
        const [[prod]] = await conn.query("SELECT product_id FROM products WHERE product_id = ? FOR UPDATE", [product_id]);
        if (!prod) { await conn.rollback(); return res.status(404).json({ error: "Product not found" }); }
        const [result] = await conn.query(
            "INSERT INTO product_in (ProductID, QuantityIn, supplier, DateIn, comment) VALUES (?, ?, ?, NOW(), ?)",
            [product_id, qty, supplier, comment]
        );
        await conn.query("UPDATE products SET quantity = quantity + ? WHERE product_id = ?", [qty, product_id]);
        await conn.commit();
        return res.status(201).json({ ProductInID: result.insertId });
    } catch (e) {
        await conn.rollback();
        return res.status(500).json({ error: "Failed to create product in" });
    } finally {
        conn.release();
    }
});

// Update product in record
router.put("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

    const parsed = productInSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Invalid body" });
    const { quantity_in, supplier, comment } = parsed.data;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[row]] = await conn.query("SELECT ProductID, QuantityIn FROM product_in WHERE ProductInID = ? FOR UPDATE", [id]);
        if (!row) { await conn.rollback(); return res.status(404).json({ error: "Not found" }); }

        const fields = [];
        const values = [];
        let delta = 0;
        if (quantity_in !== undefined && Number.isInteger(Number(quantity_in))) {
            const newQty = Number(quantity_in);
            if (newQty <= 0) { await conn.rollback(); return res.status(400).json({ error: "quantity_in must be > 0" }); }
            delta = newQty - row.QuantityIn; // positive means more stock in
            // If delta is negative, ensure product stock can cover the decrease
            if (delta < 0) {
                const need = -delta;
                const [[prod]] = await conn.query("SELECT quantity FROM products WHERE product_id = ? FOR UPDATE", [row.ProductID]);
                if (!prod || prod.quantity < need) { await conn.rollback(); return res.status(400).json({ error: "Insufficient stock to decrease" }); }
            }
            fields.push("QuantityIn = ?"); values.push(newQty);
        }
        if (supplier !== undefined) { fields.push("supplier = ?"); values.push(supplier); }
        if (comment !== undefined) { fields.push("comment = ?"); values.push(comment); }
        if (fields.length === 0) { await conn.rollback(); return res.status(400).json({ error: "No fields to update" }); }

        values.push(id);
        await conn.query(`UPDATE product_in SET ${fields.join(", ")} WHERE ProductInID = ?`, values);
        if (delta !== 0) {
            await conn.query("UPDATE products SET quantity = quantity + ? WHERE product_id = ?", [delta, row.ProductID]);
        }
        await conn.commit();
        return res.status(204).end();
    } catch (e) {
        await conn.rollback();
        return res.status(500).json({ error: "Update failed" });
    } finally {
        conn.release();
    }
});

// Delete product in record
router.delete("/:id", async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[row]] = await conn.query("SELECT ProductID, QuantityIn FROM product_in WHERE ProductInID = ? FOR UPDATE", [id]);
        if (!row) { await conn.rollback(); return res.status(404).json({ error: "Not found" }); }
        // Ensure deleting won't drive stock negative
        const [[prod]] = await conn.query("SELECT quantity FROM products WHERE product_id = ? FOR UPDATE", [row.ProductID]);
        if (!prod || prod.quantity < row.QuantityIn) { await conn.rollback(); return res.status(400).json({ error: "Cannot delete: stock would become negative" }); }
        await conn.query("UPDATE products SET quantity = quantity - ? WHERE product_id = ?", [row.QuantityIn, row.ProductID]);
        await conn.query("DELETE FROM product_in WHERE ProductInID = ?", [id]);
        await conn.commit();
        return res.status(204).end();
    } catch (e) {
        await conn.rollback();
        return res.status(500).json({ error: "Delete failed" });
    } finally {
        conn.release();
    }
});

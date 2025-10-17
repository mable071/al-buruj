import { Router } from "express";
import { pool } from "../config/db.js";
import { authRequired } from "../middleware/auth.js";

export const router = Router();
router.use(authRequired);

// Dashboard summary stats
router.get("/dashboard", async (_req, res) => {
	try {
		// Total products count
		const [[products]] = await pool.query("SELECT COUNT(*) as total FROM products");
		
		// Total stock in
		const [[stockIn]] = await pool.query("SELECT IFNULL(SUM(QuantityIn), 0) as total FROM product_in");
		
		// Total stock out
		const [[stockOut]] = await pool.query("SELECT IFNULL(SUM(quantity_out), 0) as total FROM product_out");
		
		// Current stock balance (sum of all product quantities)
		const [[stockBalance]] = await pool.query("SELECT IFNULL(SUM(quantity), 0) as total FROM products");
		
		// Recent activity (last 10 movements)
		const [recentActivity] = await pool.query(`
			SELECT 'IN' as type, p.product_name, i.QuantityIn as quantity, i.DateIn as date, i.supplier as user
			FROM product_in i
			JOIN products p ON p.product_id = i.ProductID
			UNION ALL
			SELECT 'OUT' as type, p.product_name, o.quantity_out as quantity, o.date_out as date, o.issued_by as user
			FROM product_out o
			JOIN products p ON p.product_id = o.product_id
			ORDER BY date DESC
			LIMIT 10
		`);
		
		// Weekly data for charts (last 4 weeks)
		const [weeklyData] = await pool.query(`
			SELECT 
				DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7)) DAY)) as week_start,
				IFNULL(SUM(CASE WHEN i.QuantityIn IS NOT NULL THEN i.QuantityIn ELSE 0 END), 0) as stock_in,
				IFNULL(SUM(CASE WHEN o.quantity_out IS NOT NULL THEN o.quantity_out ELSE 0 END), 0) as stock_out
			FROM (
				SELECT 0 as week_num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
			) n
			LEFT JOIN product_in i ON DATE(i.DateIn) >= DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7)) DAY))
				AND DATE(i.DateIn) < DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7) - 7) DAY))
			LEFT JOIN product_out o ON DATE(o.date_out) >= DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7)) DAY))
				AND DATE(o.date_out) < DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7) - 7) DAY))
			GROUP BY n.week_num
			ORDER BY week_start DESC
		`);
		
		// Top products by stock
		const [topProducts] = await pool.query(`
			SELECT product_name, quantity
			FROM products
			WHERE quantity > 0
			ORDER BY quantity DESC
			LIMIT 8
		`);
		
		res.json({
			stats: {
				totalProducts: products.total,
				totalStockIn: stockIn.total,
				totalStockOut: stockOut.total,
				currentStockBalance: stockBalance.total
			},
			recentActivity,
			weeklyData,
			topProducts
		});
	} catch (e) {
		console.error("Dashboard error:", e);
		res.status(500).json({ error: "Failed to load dashboard data" });
	}
});

// Daily summary for a given date (YYYY-MM-DD)
router.get("/daily", async (req, res) => {
    try {
        const date = (req.query.date || "").toString();
        if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });

        const [[ins]] = await pool.query(
            "SELECT IFNULL(SUM(QuantityIn),0) as total_products_in FROM product_in WHERE DATE(DateIn)=?",
            [date]
        );
        const [[outs]] = await pool.query(
            "SELECT IFNULL(SUM(quantity_out),0) as total_products_out FROM product_out WHERE DATE(date_out)=?",
            [date]
        );
        const [movements] = await pool.query(
            `SELECT 'IN' as type, p.product_name, i.QuantityIn as quantity, i.DateIn as at FROM product_in i
             JOIN products p ON p.product_id=i.ProductID
             WHERE DATE(i.DateIn)=?
             UNION ALL
             SELECT 'OUT' as type, p.product_name, o.quantity_out as quantity, o.date_out as at FROM product_out o
             JOIN products p ON p.product_id=o.product_id
             WHERE DATE(o.date_out)=?
             ORDER BY at ASC`,
            [date, date]
        );

        res.json({
            date,
            total_products_in: ins.total_products_in,
            total_products_out: outs.total_products_out,
            movements
        });
    } catch (e) {
        console.error("Daily report error:", e);
        res.status(500).json({ error: "Failed to load daily summary" });
    }
});

import { sequelize, Product, ProductIn, ProductOut } from "../models/index.js";
import { Op, fn, col, QueryTypes } from "sequelize";

export const dashboard = async (_req, res) => {
  try {
    const [[{ totalProducts }]] = await Promise.all([
      Product.findAll({ attributes: [[fn("COUNT", col("product_id")), "totalProducts"]], raw: true }),
    ]);

    const [[{ totalStockIn }]] = await Promise.all([
      ProductIn.findAll({ attributes: [[fn("IFNULL", fn("SUM", col("QuantityIn")), 0), "totalStockIn"]], raw: true }),
    ]);

    const [[{ totalStockOut }]] = await Promise.all([
      ProductOut.findAll({ attributes: [[fn("IFNULL", fn("SUM", col("quantity_out")), 0), "totalStockOut"]], raw: true }),
    ]);

    const [[{ currentStockBalance }]] = await Promise.all([
      Product.findAll({ attributes: [[fn("IFNULL", fn("SUM", col("quantity")), 0), "currentStockBalance"]], raw: true }),
    ]);

    const recentActivity = await sequelize.query(
      `SELECT 'IN' as type, p.product_name, i.QuantityIn as quantity, i.DateIn as date, i.supplier as user
       FROM product_in i
       JOIN products p ON p.product_id = i.ProductID
       UNION ALL
       SELECT 'OUT' as type, p.product_name, o.quantity_out as quantity, o.date_out as date, o.issued_by as user
       FROM product_out o
       JOIN products p ON p.product_id = o.product_id
       ORDER BY date DESC
       LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    const weeklyData = await sequelize.query(
      `SELECT 
        DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7)) DAY)) as week_start,
        IFNULL((SELECT SUM(i.QuantityIn) FROM product_in i 
                WHERE DATE(i.DateIn) >= DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7)) DAY))
                  AND DATE(i.DateIn) < DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7) - 7) DAY))), 0) as stock_in,
        IFNULL((SELECT SUM(o.quantity_out) FROM product_out o 
                WHERE DATE(o.date_out) >= DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7)) DAY))
                  AND DATE(o.date_out) < DATE(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) + (n.week_num * 7) - 7) DAY))), 0) as stock_out
      FROM (SELECT 0 as week_num UNION SELECT 1 UNION SELECT 2 UNION SELECT 3) n
      ORDER BY week_start DESC`,
      { type: sequelize.QueryTypes.SELECT }
    );

    const topProducts = await Product.findAll({
      attributes: ["product_name", "quantity"],
      where: { quantity: { [Op.gt]: 0 } },
      order: [["quantity", "DESC"]],
      limit: 8,
      raw: true,
    });

    return res.json({
      stats: {
        totalProducts,
        totalStockIn,
        totalStockOut,
        currentStockBalance,
      },
      recentActivity,
      weeklyData,
      topProducts,
    });
  } catch (e) {
    console.error("Dashboard error:", e);
    return res.status(500).json({ error: "Failed to load dashboard data" });
  }
};

export const dailySummary = async (req, res) => {
  try {
    const date = (req.query.date || "").toString();
    if (!date) return res.status(400).json({ error: "date is required (YYYY-MM-DD)" });

    const [[{ total_products_in }]] = await ProductIn.findAll({
      attributes: [[fn("IFNULL", fn("SUM", col("QuantityIn")), 0), "total_products_in"]],
      where: sequelize.where(fn("DATE", col("DateIn")), date),
      raw: true,
    });

    const [[{ total_products_out }]] = await ProductOut.findAll({
      attributes: [[fn("IFNULL", fn("SUM", col("quantity_out")), 0), "total_products_out"]],
      where: sequelize.where(fn("DATE", col("date_out")), date),
      raw: true,
    });

    const movements = await sequelize.query(
      `SELECT 'IN' as type, p.product_name, i.QuantityIn as quantity, i.DateIn as at FROM product_in i
       JOIN products p ON p.product_id=i.ProductID
       WHERE DATE(i.DateIn)=?
       UNION ALL
       SELECT 'OUT' as type, p.product_name, o.quantity_out as quantity, o.date_out as at FROM product_out o
       JOIN products p ON p.product_id=o.product_id
       WHERE DATE(o.date_out)=?
       ORDER BY at ASC`,
      { replacements: [date, date], type: QueryTypes.SELECT }
    );

    return res.json({ date, total_products_in, total_products_out, movements });
  } catch (e) {
    console.error("Daily report error:", e);
    return res.status(500).json({ error: "Failed to load daily summary" });
  }
};

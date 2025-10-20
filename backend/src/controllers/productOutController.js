import { sequelize, Product, ProductOut } from "../models/index.js";

export const listProductOut = async (_req, res) => {
  const rows = await ProductOut.findAll({
    include: [{ model: Product, as: "product", attributes: ["product_id", "product_name"] }],
    order: [["date_out", "DESC"], ["out_id", "DESC"]],
    raw: true,
    nest: true,
  });
  const mapped = rows.map(r => ({
    out_id: r.out_id,
    product_id: r.product_id,
    product_name: r.product?.product_name,
    quantity_out: r.quantity_out,
    date_out: r.date_out,
    issued_by: r.issued_by,
    purpose: r.purpose,
  }));
  return res.json(mapped);
};

export const createProductOut = async (req, res) => {
  const { product_id, quantity_out, issued_by, purpose = null } = req.body || {};
  const qty = Number(quantity_out);
  if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: "quantity_out must be a positive integer" });
  if (!issued_by) return res.status(400).json({ error: "issued_by is required" });

  const t = await sequelize.transaction();
  try {
    const prod = await Product.findByPk(product_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!prod) { await t.rollback(); return res.status(404).json({ error: "Product not found" }); }
    if (prod.quantity < qty) { await t.rollback(); return res.status(400).json({ error: "Insufficient stock" }); }

    const created = await ProductOut.create({ product_id, quantity_out: qty, issued_by, purpose }, { transaction: t });
    await prod.update({ quantity: prod.quantity - qty }, { transaction: t });
    await t.commit();
    return res.status(201).json({ out_id: created.out_id });
  } catch (e) {
    await t.rollback();
    return res.status(500).json({ error: "Failed to create product out" });
  }
};

export const updateProductOut = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
  const { quantity_out, issued_by, purpose } = req.body || {};

  const t = await sequelize.transaction();
  try {
    const row = await ProductOut.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }

    const updates = {};
    if (issued_by !== undefined) updates.issued_by = issued_by;
    if (purpose !== undefined) updates.purpose = purpose;
    if (quantity_out !== undefined && Number.isInteger(Number(quantity_out))) {
      const newQty = Number(quantity_out);
      if (newQty <= 0) { await t.rollback(); return res.status(400).json({ error: "quantity_out must be > 0" }); }
      const delta = newQty - row.quantity_out; // positive means more out
      if (delta !== 0) {
        const prod = await Product.findByPk(row.product_id, { transaction: t, lock: t.LOCK.UPDATE });
        if (delta > 0 && (!prod || prod.quantity < delta)) { await t.rollback(); return res.status(400).json({ error: "Insufficient stock for update" }); }
        await prod.update({ quantity: prod.quantity - delta }, { transaction: t });
      }
      updates.quantity_out = newQty;
    }
    if (Object.keys(updates).length === 0) { await t.rollback(); return res.status(400).json({ error: "Nothing to update" }); }

    await row.update(updates, { transaction: t });
    await t.commit();
    return res.status(204).end();
  } catch (e) {
    await t.rollback();
    return res.status(500).json({ error: "Update failed" });
  }
};

export const deleteProductOut = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const t = await sequelize.transaction();
  try {
    const row = await ProductOut.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }
    const prod = await Product.findByPk(row.product_id, { transaction: t, lock: t.LOCK.UPDATE });
    await prod.update({ quantity: prod.quantity + row.quantity_out }, { transaction: t });
    await row.destroy({ transaction: t });
    await t.commit();
    return res.status(204).end();
  } catch (e) {
    await t.rollback();
    return res.status(500).json({ error: "Delete failed" });
  }
};

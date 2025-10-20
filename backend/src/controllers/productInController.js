import { sequelize, Product, ProductIn } from "../models/index.js";

export const listProductIn = async (_req, res) => {
  const rows = await ProductIn.findAll({
    include: [{ model: Product, as: "product", attributes: ["product_id", "product_name"] }],
    order: [["DateIn", "DESC"]],
    raw: true,
    nest: true,
  });
  const mapped = rows.map(r => ({
    ProductInID: r.ProductInID,
    ProductID: r.ProductID,
    product_name: r.product?.product_name,
    QuantityIn: r.QuantityIn,
    supplier: r.supplier,
    DateIn: r.DateIn,
    comment: r.comment,
  }));
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.json(mapped);
};

export const createProductIn = async (req, res) => {
  const { product_id, quantity_in, supplier = null, comment = null } = req.body || {};
  const qty = Number(quantity_in);
  if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ error: "quantity_in must be a positive integer" });

  const t = await sequelize.transaction();
  try {
    const prod = await Product.findByPk(product_id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!prod) { await t.rollback(); return res.status(404).json({ error: "Product not found" }); }

    const created = await ProductIn.create({ ProductID: product_id, QuantityIn: qty, supplier, comment }, { transaction: t });
    await prod.update({ quantity: prod.quantity + qty }, { transaction: t });
    await t.commit();
    return res.status(201).json({ ProductInID: created.ProductInID });
  } catch (e) {
    await t.rollback();
    return res.status(500).json({ error: "Failed to create product in" });
  }
};

export const updateProductIn = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
  const { quantity_in, supplier, comment } = req.body || {};

  const t = await sequelize.transaction();
  try {
    const row = await ProductIn.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }

    let delta = 0;
    const updates = {};
    if (quantity_in !== undefined && Number.isInteger(Number(quantity_in))) {
      const newQty = Number(quantity_in);
      if (newQty <= 0) { await t.rollback(); return res.status(400).json({ error: "quantity_in must be > 0" }); }
      delta = newQty - row.QuantityIn;
      if (delta < 0) {
        const prod = await Product.findByPk(row.ProductID, { transaction: t, lock: t.LOCK.UPDATE });
        if (!prod || prod.quantity < -delta) { await t.rollback(); return res.status(400).json({ error: "Insufficient stock to decrease" }); }
      }
      updates.QuantityIn = newQty;
    }
    if (supplier !== undefined) updates.supplier = supplier;
    if (comment !== undefined) updates.comment = comment;
    if (Object.keys(updates).length === 0) { await t.rollback(); return res.status(400).json({ error: "No fields to update" }); }

    await row.update(updates, { transaction: t });
    if (delta !== 0) {
      const prod = await Product.findByPk(row.ProductID, { transaction: t, lock: t.LOCK.UPDATE });
      await prod.update({ quantity: prod.quantity + delta }, { transaction: t });
    }
    await t.commit();
    return res.status(204).end();
  } catch (e) {
    await t.rollback();
    return res.status(500).json({ error: "Update failed" });
  }
};

export const deleteProductIn = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const t = await sequelize.transaction();
  try {
    const row = await ProductIn.findByPk(id, { transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }

    const prod = await Product.findByPk(row.ProductID, { transaction: t, lock: t.LOCK.UPDATE });
    if (!prod || prod.quantity < row.QuantityIn) { await t.rollback(); return res.status(400).json({ error: "Cannot delete: stock would become negative" }); }

    await prod.update({ quantity: prod.quantity - row.QuantityIn }, { transaction: t });
    await row.destroy({ transaction: t });
    await t.commit();
    return res.status(204).end();
  } catch (e) {
    await t.rollback();
    return res.status(500).json({ error: "Delete failed" });
  }
};

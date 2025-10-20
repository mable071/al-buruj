import { sequelize, Product } from "../models/index.js";
import { Op } from "sequelize";

export const listProducts = async (_req, res) => {
  const rows = await Product.findAll({
    attributes: ["product_id", "product_name", "unit", "description", "quantity", "date_added"],
    order: [["product_name", "ASC"]],
    raw: true,
  });
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.json(rows);
};

export const createProduct = async (req, res) => {
  const { product_name, unit = null, description = null } = req.body || {};
  if (!product_name) return res.status(400).json({ error: "Invalid body" });
  const created = await Product.create({ product_name, unit, description, quantity: 0 });
  return res.status(201).json({ product_id: created.product_id });
};

export const updateProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });
  const { product_name, unit = null, description = null } = req.body || {};
  if (!product_name && unit === undefined && description === undefined)
    return res.status(400).json({ error: "Nothing to update" });

  const fields = {};
  if (product_name) fields.product_name = product_name;
  if (unit !== undefined) fields.unit = unit;
  if (description !== undefined) fields.description = description;

  await Product.update(fields, { where: { product_id: id } });
  return res.status(204).end();
};

export const deleteProduct = async (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: "Invalid id" });

  const t = await sequelize.transaction();
  try {
    const row = await Product.findOne({ where: { product_id: id }, transaction: t, lock: t.LOCK.UPDATE });
    if (!row) { await t.rollback(); return res.status(404).json({ error: "Not found" }); }
    if (row.quantity !== 0) { await t.rollback(); return res.status(400).json({ error: "Cannot delete product with non-zero quantity" }); }
    await Product.destroy({ where: { product_id: id }, transaction: t });
    await t.commit();
    return res.status(204).end();
  } catch (e) {
    await t.rollback();
    return res.status(500).json({ error: "Delete failed" });
  }
};

export const searchProducts = async (req, res) => {
  const q = (req.query.q || "").toString();
  const rows = await Product.findAll({
    attributes: ["product_id", "product_name", "unit", "description", "quantity"],
    where: {
      [Op.or]: [
        { product_name: { [Op.like]: `%${q}%` } },
        { unit: { [Op.like]: `%${q}%` } },
      ],
    },
    order: [["product_name", "ASC"]],
    raw: true,
  });
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  return res.json(rows);
};

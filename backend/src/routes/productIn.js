import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { listProductIn, createProductIn, updateProductIn, deleteProductIn } from "../controllers/productInController.js";

export const router = Router();
router.use(authRequired);

// Get all product in records
router.get("/", listProductIn);

// Add new product in record
router.post("/", createProductIn);

// Update product in record
router.put("/:id", updateProductIn);

// Delete product in record
router.delete("/:id", deleteProductIn);

import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { listProducts, createProduct, updateProduct, deleteProduct, searchProducts } from "../controllers/productsController.js";

export const router = Router();
router.use(authRequired);

router.get("/", listProducts);

router.post("/", createProduct);

// Update product (name, unit, description)
router.put("/:id", updateProduct);

// Delete product
router.delete("/:id", deleteProduct);

router.get("/search", searchProducts);



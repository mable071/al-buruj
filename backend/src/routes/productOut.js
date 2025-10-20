import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { listProductOut, createProductOut, updateProductOut, deleteProductOut } from "../controllers/productOutController.js";

export const router = Router();
router.use(authRequired);

// List product out entries with product names
router.get("/", listProductOut);

router.post("/", createProductOut);

router.put("/:id", updateProductOut);

router.delete("/:id", deleteProductOut);



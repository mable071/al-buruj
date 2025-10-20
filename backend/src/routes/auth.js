import { Router } from "express";
import { login } from "../controllers/authController.js";

export const router = Router();

router.post("/login", login);



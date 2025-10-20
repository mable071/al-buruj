import { Router } from "express";
import { authRequired } from "../middleware/auth.js";
import { dashboard, dailySummary } from "../controllers/reportsController.js";

export const router = Router();
router.use(authRequired);

// Dashboard summary stats
router.get("/dashboard", dashboard);

// Daily summary for a given date (YYYY-MM-DD)
router.get("/daily", dailySummary);

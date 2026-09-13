import { Router } from "express";
import { getControlMetrics } from "../controllers/dashboard.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("control", "admin"));
router.get("/control-metrics", getControlMetrics);

export default router;

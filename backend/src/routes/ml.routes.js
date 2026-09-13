import { Router } from "express";
import { metrics, recoveryRecommend, simulate } from "../controllers/ml.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("control", "admin"));

router.post("/simulate", simulate);
router.post("/recovery/recommend", recoveryRecommend);
router.get("/metrics", metrics);

export default router;

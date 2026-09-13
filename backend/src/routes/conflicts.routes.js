import { Router } from "express";
import { getConflict, listConflicts, resolveConflict } from "../controllers/conflicts.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("control", "admin"));

router.get("/", listConflicts);
router.get("/:id", getConflict);
router.post("/:id/resolve", resolveConflict);

export default router;

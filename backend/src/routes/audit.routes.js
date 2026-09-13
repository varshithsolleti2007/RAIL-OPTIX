import { Router } from "express";
import { listAuditLogs } from "../controllers/audit.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("admin", "control"));
router.get("/", listAuditLogs);

export default router;

import { Router } from "express";
import {
  approveBlockRequest,
  createBlockRequest,
  failBlockRequest,
  getBlockRequest,
  listBlockRequests,
  recommendForBlockRequest,
  rejectBlockRequest,
  rescheduleBlockRequest,
  submitBlockRequest,
  updateBlockRequest,
} from "../controllers/blockRequests.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();
const DEPARTMENT_ROLES = ["engineering", "electrical", "snt"];

router.use(requireAuth);

router.post("/", requireRole(...DEPARTMENT_ROLES), createBlockRequest);
router.get("/", listBlockRequests);
router.get("/:id", getBlockRequest);
router.put("/:id", requireRole(...DEPARTMENT_ROLES), updateBlockRequest);
router.post("/:id/submit", requireRole(...DEPARTMENT_ROLES), submitBlockRequest);

router.post("/:id/recommend", requireRole("control"), recommendForBlockRequest);
router.post("/:id/approve", requireRole("control"), approveBlockRequest);
router.post("/:id/reject", requireRole("control"), rejectBlockRequest);
router.post("/:id/reschedule", requireRole("control"), rescheduleBlockRequest);
router.post("/:id/fail", requireRole("control"), failBlockRequest);

export default router;

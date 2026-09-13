import { Router } from "express";
import { listUsers, setUserActive } from "../controllers/users.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth, requireRole("admin"));

router.get("/", listUsers);
router.put("/:id/active", setUserActive);

export default router;

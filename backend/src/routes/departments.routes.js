import { Router } from "express";
import { createDepartment, listDepartments, updateDepartment } from "../controllers/departments.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listDepartments);
router.post("/", requireRole("admin"), createDepartment);
router.put("/:id", requireRole("admin"), updateDepartment);

export default router;

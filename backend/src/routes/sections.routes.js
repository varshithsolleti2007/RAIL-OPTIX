import { Router } from "express";
import { createSection, listSections, updateSection } from "../controllers/sections.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listSections);
router.post("/", requireRole("admin"), createSection);
router.put("/:id", requireRole("admin"), updateSection);

export default router;

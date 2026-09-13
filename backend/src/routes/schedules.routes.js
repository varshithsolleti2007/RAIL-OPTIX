import { Router } from "express";
import { getSchedule, listSchedules } from "../controllers/schedules.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listSchedules);
router.get("/:id", getSchedule);

export default router;

import { Router } from "express";
import { listMyNotifications, markNotificationRead } from "../controllers/notifications.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";

const router = Router();

router.use(requireAuth);

router.get("/", listMyNotifications);
router.post("/:id/read", markNotificationRead);

export default router;

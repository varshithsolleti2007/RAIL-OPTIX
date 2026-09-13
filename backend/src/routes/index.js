import { Router } from "express";
import authRoutes from "./auth.routes.js";
import departmentsRoutes from "./departments.routes.js";
import sectionsRoutes from "./sections.routes.js";
import blockRequestsRoutes from "./blockRequests.routes.js";
import conflictsRoutes from "./conflicts.routes.js";
import schedulesRoutes from "./schedules.routes.js";
import notificationsRoutes from "./notifications.routes.js";
import auditRoutes from "./audit.routes.js";
import usersRoutes from "./users.routes.js";
import mlRoutes from "./ml.routes.js";
import dashboardRoutes from "./dashboard.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "OK", code: "OK", data: { status: "healthy" } });
});

router.use("/auth", authRoutes);
router.use("/departments", departmentsRoutes);
router.use("/sections", sectionsRoutes);
router.use("/block-requests", blockRequestsRoutes);
router.use("/conflicts", conflictsRoutes);
router.use("/schedules", schedulesRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/audit", auditRoutes);
router.use("/users", usersRoutes);
router.use("/ml", mlRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;

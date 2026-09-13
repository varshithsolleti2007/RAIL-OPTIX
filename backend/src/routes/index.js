import { Router } from "express";
import authRoutes from "./auth.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, message: "OK", code: "OK", data: { status: "healthy" } });
});

router.use("/auth", authRoutes);

// Not yet implemented - see CLAUDE_CODE_PROJECT_CONTEXT.md §40 for the
// full module list. Mount each router here as it is built:
//   router.use("/departments", departmentRoutes);
//   router.use("/sections", sectionRoutes);
//   router.use("/block-requests", blockRequestRoutes);
//   router.use("/conflicts", conflictRoutes);
//   router.use("/schedules", scheduleRoutes);
//   router.use("/notifications", notificationRoutes);
//   router.use("/audit", auditRoutes);
//   router.use("/ml", mlGatewayRoutes);

export default router;

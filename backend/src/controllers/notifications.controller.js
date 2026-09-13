import Notification from "../models/Notification.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// A notification reaches a user if it targets their user id, their
// department, or their role (broadcast).
export const listMyNotifications = asyncHandler(async (req, res) => {
  const or = [{ role: req.user.role }, { user: req.user.id }];

  if (req.user.department) {
    or.push({ department: req.user.department });
  }

  const notifications = await Notification.find({ $or: or })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("relatedRequest", "requestNumber workType status");

  res.json({ success: true, message: "OK", code: "OK", data: { notifications } });
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(req.params.id, { read: true }, { returnDocument: "after" });

  if (!notification) {
    throw new ApiError(404, "Notification not found.", "NOT_FOUND");
  }

  res.json({ success: true, message: "OK", code: "OK", data: { notification } });
});

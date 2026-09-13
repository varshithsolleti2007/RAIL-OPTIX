import Schedule from "../models/Schedule.js";
import BlockRequest from "../models/BlockRequest.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

const POPULATE = [
  { path: "section", select: "name" },
  { path: "approvedBy", select: "name email" },
  { path: "request", select: "requestNumber workType priority department" },
];

export const listSchedules = asyncHandler(async (req, res) => {
  let filter = {};

  if (["engineering", "electrical", "snt"].includes(req.user.role)) {
    const departmentRequestIds = await BlockRequest.find({ department: req.user.department }).select("_id");
    filter = { request: { $in: departmentRequestIds.map((r) => r._id) } };
  }

  const schedules = await Schedule.find(filter).sort({ startTime: 1 }).populate(POPULATE);
  res.json({ success: true, message: "OK", code: "OK", data: { schedules } });
});

export const getSchedule = asyncHandler(async (req, res) => {
  const schedule = await Schedule.findById(req.params.id).populate(POPULATE);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found.", "NOT_FOUND");
  }

  res.json({ success: true, message: "OK", code: "OK", data: { schedule } });
});

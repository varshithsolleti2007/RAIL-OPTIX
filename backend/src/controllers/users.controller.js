import User from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-passwordHash").populate("department", "name code").sort({ createdAt: -1 });
  res.json({ success: true, message: "OK", code: "OK", data: { users } });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { returnDocument: "after" }).select("-passwordHash");

  if (!user) {
    throw new ApiError(404, "User not found.", "NOT_FOUND");
  }

  res.json({ success: true, message: "OK", code: "OK", data: { user } });
});

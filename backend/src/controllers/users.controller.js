import User, { ROLES } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select("-passwordHash").populate("department", "name code").sort({ createdAt: -1 });
  res.json({ success: true, message: "OK", code: "OK", data: { users } });
});

// POST /api/users - Admin-only user provisioning (name, role, department in one step).
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  if (!name || !email || !password || !role) {
    throw new ApiError(400, "name, email, password and role are required.", "VALIDATION_ERROR");
  }

  if (!ROLES.includes(role)) {
    throw new ApiError(400, `role must be one of: ${ROLES.join(", ")}`, "VALIDATION_ERROR");
  }

  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    throw new ApiError(409, "A user with this email already exists.", "DUPLICATE_EMAIL");
  }

  const passwordHash = await User.hashPassword(password);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    passwordHash,
    role,
    department: department || undefined,
  });

  const safeUser = await User.findById(user._id).select("-passwordHash").populate("department", "name code");

  res.status(201).json({ success: true, message: "User created.", code: "CREATED", data: { user: safeUser } });
});

export const setUserActive = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const user = await User.findByIdAndUpdate(req.params.id, { isActive }, { returnDocument: "after" }).select("-passwordHash");

  if (!user) {
    throw new ApiError(404, "User not found.", "NOT_FOUND");
  }

  res.json({ success: true, message: "OK", code: "OK", data: { user } });
});

import jwt from "jsonwebtoken";
import User, { ROLES } from "../models/User.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, department: user.department },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
  );
}

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, "Email and password are required.", "VALIDATION_ERROR");
  }

  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user || !user.isActive) {
    throw new ApiError(401, "Invalid credentials.", "INVALID_CREDENTIALS");
  }

  const valid = await user.comparePassword(password);

  if (!valid) {
    throw new ApiError(401, "Invalid credentials.", "INVALID_CREDENTIALS");
  }

  const token = signToken(user);

  res.json({
    success: true,
    message: "Login successful.",
    code: "OK",
    data: { token, user: user.toSafeJSON() },
  });
});

// GET /api/auth/me
export const me = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).populate("department", "name code");

  if (!user) {
    throw new ApiError(404, "User not found.", "NOT_FOUND");
  }

  res.json({
    success: true,
    message: "OK",
    code: "OK",
    data: { user: user.toSafeJSON() },
  });
});

// POST /api/auth/register
// Admin-only: the platform has no public self-registration. Users are
// provisioned by the Admin (see doc §5.1 - "Manage users").
export const register = asyncHandler(async (req, res) => {
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
    department,
  });

  res.status(201).json({
    success: true,
    message: "User created.",
    code: "CREATED",
    data: { user: user.toSafeJSON() },
  });
});

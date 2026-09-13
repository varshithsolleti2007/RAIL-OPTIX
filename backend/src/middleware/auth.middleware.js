import jwt from "jsonwebtoken";
import ApiError from "../utils/ApiError.js";

// Validates the JWT and attaches { id, role, department } to req.user.
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Missing or invalid authorization header.", "UNAUTHENTICATED"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    next(new ApiError(401, "Invalid or expired token.", "UNAUTHENTICATED"));
  }
}

// Role check must run after requireAuth. Every protected operation is
// checked server-side; the frontend role gate is a UX convenience only.
export function requireRole(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action.", "FORBIDDEN"));
    }
    next();
  };
}

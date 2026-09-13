import Department from "../models/Department.js";
import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

export const listDepartments = asyncHandler(async (req, res) => {
  const departments = await Department.find().sort({ name: 1 });
  res.json({ success: true, message: "OK", code: "OK", data: { departments } });
});

export const createDepartment = asyncHandler(async (req, res) => {
  const { name, code } = req.body;

  if (!name || !code) {
    throw new ApiError(400, "name and code are required.", "VALIDATION_ERROR");
  }

  const department = await Department.create({ name, code });
  res.status(201).json({ success: true, message: "Department created.", code: "CREATED", data: { department } });
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const { name, code, isActive } = req.body;

  const department = await Department.findByIdAndUpdate(
    req.params.id,
    { ...(name && { name }), ...(code && { code }), ...(isActive !== undefined && { isActive }) },
    { returnDocument: "after", runValidators: true }
  );

  if (!department) {
    throw new ApiError(404, "Department not found.", "NOT_FOUND");
  }

  res.json({ success: true, message: "Department updated.", code: "OK", data: { department } });
});

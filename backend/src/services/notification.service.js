import Notification from "../models/Notification.js";

export async function notifyDepartment(departmentId, { type, message, relatedRequest }) {
  return Notification.create({ department: departmentId, type, message, relatedRequest });
}

export async function notifyUser(userId, { type, message, relatedRequest }) {
  return Notification.create({ user: userId, type, message, relatedRequest });
}

export async function notifyRole(role, { type, message, relatedRequest }) {
  return Notification.create({ role, type, message, relatedRequest });
}

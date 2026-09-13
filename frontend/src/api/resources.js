import api from "./axios";

// Every backend response is { success, message, code, data }. Unwrap once here.
const unwrap = (promise) => promise.then((res) => res.data.data);

export const sectionsApi = {
  list: () => unwrap(api.get("/sections")),
};

export const departmentsApi = {
  list: () => unwrap(api.get("/departments")),
};

export const blockRequestsApi = {
  list: (params) => unwrap(api.get("/block-requests", { params })),
  get: (id) => unwrap(api.get(`/block-requests/${id}`)),
  create: (payload) => unwrap(api.post("/block-requests", payload)),
  update: (id, payload) => unwrap(api.put(`/block-requests/${id}`, payload)),
  submit: (id) => unwrap(api.post(`/block-requests/${id}/submit`)),
  recommend: (id) => unwrap(api.post(`/block-requests/${id}/recommend`)),
  approve: (id, payload) => unwrap(api.post(`/block-requests/${id}/approve`, payload || {})),
  reject: (id, reason) => unwrap(api.post(`/block-requests/${id}/reject`, { reason })),
  reschedule: (id, payload) => unwrap(api.post(`/block-requests/${id}/reschedule`, payload)),
  fail: (id) => unwrap(api.post(`/block-requests/${id}/fail`)),
};

export const conflictsApi = {
  list: (params) => unwrap(api.get("/conflicts", { params })),
  resolve: (id, resolution) => unwrap(api.post(`/conflicts/${id}/resolve`, { resolution })),
};

export const schedulesApi = {
  list: () => unwrap(api.get("/schedules")),
};

export const notificationsApi = {
  list: () => unwrap(api.get("/notifications")),
  markRead: (id) => unwrap(api.post(`/notifications/${id}/read`)),
};

export const dashboardApi = {
  controlMetrics: () => unwrap(api.get("/dashboard/control-metrics")),
};

export const mlApi = {
  simulateSectionDay: (sectionId, date) => unwrap(api.get(`/ml/simulate/section/${sectionId}`, { params: { date } })),
};

export const auditApi = {
  list: (params) => unwrap(api.get("/audit", { params })),
};

export const usersApi = {
  list: () => unwrap(api.get("/users")),
  setActive: (id, isActive) => unwrap(api.put(`/users/${id}/active`, { isActive })),
};

import api from "../utils/api.js";

export const adminGetAllUsers = (page = 1, limit = 10, search = "") =>
  api.get(`/api/admin/users?page=${page}&limit=${limit}&search=${search}`).then((r) => r.data);

export const adminGetUser = (userId) =>
  api.get(`/api/admin/users/${userId}`).then((r) => r.data);

export const adminSuspendUser = (userId) =>
  api.patch(`/api/admin/users/${userId}/suspend`).then((r) => r.data);

export const adminDeleteUser = (userId) =>
  api.delete(`/api/admin/users/${userId}`).then((r) => r.data);

export const adminUpdateRole = (userId, role) =>
  api.patch(`/api/admin/users/${userId}/role`, { role }).then((r) => r.data);

export const adminGetDashboardStats = () =>
  api.get("/api/admin/dashboard").then((r) => r.data);

export const adminGetMediaRecords = (params) =>
  api.get("/api/admin/media", { params }).then((r) => r.data);

export const adminGetPayments = (params) =>
  api.get("/api/admin/payments", { params }).then((r) => r.data);

export const adminGetApiStats = () =>
  api.get("/api/admin/api-stats").then((r) => r.data);

import api from "./axios";

export const getNotifications = (page = 1) => api.get(`/notifications?page=${page}`);
export const markAllRead = () => api.put("/notifications/read-all");
export const markRead = (id) => api.put(`/notifications/${id}/read`);
export const deleteNotification = (id) => api.delete(`/notifications/${id}`);

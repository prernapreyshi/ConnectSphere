import api from "./axios";

export const getProfile = (username) => api.get(`/users/${username}`);
export const updateProfile = (data) => api.put("/users/profile", data);
export const updateAvatar = (formData) =>
  api.put("/users/avatar", formData, { headers: { "Content-Type": "multipart/form-data" } });
export const removeAvatar = () => api.delete("/users/avatar");

export const searchUsers = (q, page = 1) => api.get(`/users/search?q=${q}&page=${page}`);
export const getSuggestions = () => api.get("/users/suggestions");

export const sendConnectionRequest = (id) => api.post(`/users/${id}/connect`);
export const respondToConnection = (requestId, action) => api.put(`/users/connections/${requestId}`, { action });
export const removeConnection = (id) => api.delete(`/users/${id}/connect`);
export const getConnectionRequests = () => api.get("/users/me/requests");

export const toggleFollow = (id) => api.post(`/users/${id}/follow`);

export const downloadResume = (username) =>
  api.get(`/users/${username}/resume`, { responseType: "blob" });

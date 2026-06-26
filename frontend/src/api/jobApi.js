import api from "./axios";

export const getJobs = (params = {}) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v && q.set(k, v));
  return api.get(`/jobs?${q}`);
};
export const getJob = (id) => api.get(`/jobs/${id}`);
export const createJob = (data) => api.post("/jobs", data);
export const updateJob = (id, data) => api.put(`/jobs/${id}`, data);
export const deleteJob = (id) => api.delete(`/jobs/${id}`);
export const applyForJob = (id) => api.post(`/jobs/${id}/apply`);
export const withdrawApplication = (id) => api.delete(`/jobs/${id}/apply`);
export const getMyPostedJobs = () => api.get("/jobs/my/posted");
export const getMyApplications = () => api.get("/jobs/my/applied");

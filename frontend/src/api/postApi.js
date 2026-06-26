import api from "./axios";

export const createPost = (formData) =>
  api.post("/posts", formData, { headers: { "Content-Type": "multipart/form-data" } });

export const getFeed = (cursor) =>
  api.get(`/posts/feed${cursor ? `?cursor=${cursor}` : ""}`);

export const getExplorePosts = (cursor, hashtag) => {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  if (hashtag) params.set("hashtag", hashtag);
  return api.get(`/posts/explore?${params}`);
};

export const getUserPosts = (username, cursor) =>
  api.get(`/posts/user/${username}${cursor ? `?cursor=${cursor}` : ""}`);

export const getPost = (id) => api.get(`/posts/${id}`);
export const deletePost = (id) => api.delete(`/posts/${id}`);

export const toggleLike = (id) => api.put(`/posts/${id}/like`);
export const addComment = (id, content) => api.post(`/posts/${id}/comments`, { content });
export const deleteComment = (id, commentId) => api.delete(`/posts/${id}/comments/${commentId}`);
export const toggleCommentLike = (id, commentId) => api.put(`/posts/${id}/comments/${commentId}/like`);

export const repost = (id, repostComment = "") => api.post(`/posts/${id}/repost`, { repostComment });
export const getTrendingHashtags = () => api.get("/posts/trending");

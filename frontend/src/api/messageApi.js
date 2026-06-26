import api from "./axios";

export const getConversations = () => api.get("/messages/conversations");
export const getOrCreateConversation = (userId) => api.post("/messages/conversations", { userId });
export const getMessages = (conversationId, cursor) =>
  api.get(`/messages/conversations/${conversationId}${cursor ? `?cursor=${cursor}` : ""}`);
export const sendMessage = (conversationId, content) =>
  api.post(`/messages/conversations/${conversationId}`, { content });
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`);
export const getTotalUnread = () => api.get("/messages/unread");

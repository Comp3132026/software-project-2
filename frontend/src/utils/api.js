import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateMe: (data) => api.put('/auth/me', data),
  getFriends: () => api.get('/auth/friends'),
  addFriend: (userId) => api.post(`/auth/friends/${userId}`),
  removeFriend: (userId) => api.delete(`/auth/friends/${userId}`),
  searchUsers: (q) => api.get(`/auth/search?q=${q}`),
};

export const groupsAPI = {
  getAll: () => api.get('/groups'),
  getOne: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  update: (id, data) => api.put(`/groups/${id}`, data),
  delete: (id) => api.delete(`/groups/${id}`),
  join: (data) => api.post('/groups/join', data),
  leave: (id, data) => api.post(`/groups/${id}/leave`, data),
  transferOwnership: (id, data) => api.post(`/groups/${id}/transfer-ownership`, data),
};

export const tasksAPI = {
  getByGroup: (groupId, filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/tasks/group/${groupId}${params ? `?${params}` : ''}`);
  },
  getMyTasks: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return api.get(`/tasks/my-tasks${params ? `?${params}` : ''}`);
  },
  getOne: (id) => api.get(`/tasks/${id}`),
  create: (data) => api.post('/tasks', data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  assign: (id, data) => api.put(`/tasks/${id}/assign`, data),
  complete: (id) => api.post(`/tasks/${id}/complete`),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const membersAPI = {
  getByGroup: (groupId) => api.get(`/members/group/${groupId}`),
  add: (groupId, data) => api.post(`/members/group/${groupId}/add`, data),
  updateRole: (groupId, userId, data) => api.put(`/members/group/${groupId}/${userId}/role`, data),
  remove: (groupId, userId) => api.delete(`/members/group/${groupId}/${userId}`),
  search: (q, groupId) => api.get(`/members/search?q=${q}&groupId=${groupId}`),
  flag: (groupId, memberId, data) => api.put(`/members/flag/${groupId}/${memberId}`, data),
};

export const chatAPI = {
  getMessages: (groupId) => api.get(`/chat/group/${groupId}`),
  send: (data) => api.post('/chat', data),
  delete: (id) => api.delete(`/chat/${id}`),
  report: (id) => api.post(`/chat/${id}/report`),
  pin: (id) => api.patch(`/chat/pin/${id}`),
  warn: (id, data) => api.post(`/chat/${id}/warn`, data),
};

export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getByGroup: (groupId) => api.get(`/notifications/group/${groupId}`),
  getHistory: (groupId) => api.get(`/notifications/history/${groupId}`),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  updateFrequency: (frequency) => api.put('/notifications/frequency', { frequency }),
  // Announcement
  sendAnnouncement: (groupId, message) =>
    api.post(`/notifications/announcement/${groupId}`, { message }),
  // Reminders
  setReminder: (taskId, data) => api.post(`/notifications/reminder/${taskId}`, data),
  getReminders: () => api.get('/notifications/reminders'),
};

export const aiAPI = {
  suggestTask: (data) => api.post('/ai/suggest-task', data),
  suggestPriority: (data) => api.post('/ai/suggest-priority', data),
  suggestAssignee: (data) => api.post('/ai/suggest-assignee', data),
};

export default api;

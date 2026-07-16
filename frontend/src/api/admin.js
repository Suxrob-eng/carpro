import api from './index';

export const adminApi = {
  // Get all users
  getUsers: async (params) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await api.get(`/admin/users/${id}`);
    return response.data;
  },

  // Block user
  blockUser: async (id) => {
    const response = await api.patch(`/admin/users/${id}/block`);
    return response.data;
  },

  // Unblock user
  unblockUser: async (id) => {
    const response = await api.patch(`/admin/users/${id}/unblock`);
    return response.data;
  },

  // Get admin statistics
  getStats: async () => {
    const response = await api.get('/admin/stats');
    return response.data;
  },
};

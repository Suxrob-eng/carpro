import api from './index';

export const login = (username, password) =>
  api.post('/auth/login', { username, password });

export const register = (data) => {
  return api.post('/auth/register', {
    username: data.username,
    phone_number: data.phone_number,
    password: data.password,
  });
};

export const getProfile = () => api.get('/auth/me');

export const updateProfile = (data) => {
  return api.put('/auth/me', data);
};

export const changePassword = (data) => api.post('/auth/change-password', data);

export const uploadAvatar = (file) => {
  const formData = new FormData();
  formData.append('avatar', file);
  return api.put('/auth/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const verifyEmail = (token) => api.get(`/auth/verify-email?token=${token}`);

export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });

export const resetPassword = (data) => api.post('/auth/reset-password', data);

export const logout = (refreshToken) => api.post('/auth/logout', { refresh_token: refreshToken });
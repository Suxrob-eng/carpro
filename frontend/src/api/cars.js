import api from './index';

export const carsApi = {
  // Get all cars with filters
  getCars: async (params) => {
    const response = await api.get('/cars', { params });
    return response.data;
  },

  // Get car by ID
  getCarById: async (id) => {
    const response = await api.get(`/cars/${id}`);
    return response.data;
  },

  // Create a new car
  createCar: async (data) => {
    const response = await api.post('/cars', data);
    return response.data;
  },

  // Update car
  updateCar: async (id, data) => {
    const response = await api.put(`/cars/${id}`, data);
    return response.data;
  },

  // Delete car
  deleteCar: async (id) => {
    const response = await api.delete(`/cars/${id}`);
    return response.data;
  },

  // Upload images
  uploadCarImages: async (id, formData) => {
    const response = await api.post(`/cars/${id}/images`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Add comment
  addComment: async (id, data) => {
    const response = await api.post(`/cars/${id}/comments`, data);
    return response.data;
  },

  // Get comments
  getComments: async (id, params) => {
    const response = await api.get(`/cars/${id}/comments`, { params });
    return response.data;
  },

  // Check favorite status
  checkFavorite: async (id) => {
    const response = await api.get(`/cars/${id}/favorites`);
    return response.data;
  },
};

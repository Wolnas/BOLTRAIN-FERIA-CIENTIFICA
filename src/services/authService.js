import api from './api';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    return res.data;
  },

  register: async (formData) => {
    const res = await api.post('/auth/register', formData);
    return res.data;
  },

  me: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (data: object) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

// Appointments
export const appointmentsApi = {
  getAll: (params?: object) => api.get('/appointments', { params }),
  create: (data: object) => api.post('/appointments', data),
  updateStatus: (id: string, status: string) => api.patch(`/appointments/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/appointments/${id}`),
};

// Specialists
export const specialistsApi = {
  getAll: () => api.get('/specialists'),
  create: (data: object) => api.post('/specialists', data),
  update: (id: string, data: object) => api.put(`/specialists/${id}`, data),
  delete: (id: string) => api.delete(`/specialists/${id}`),
  getAvailability: (id: string, date: string) => api.get(`/specialists/${id}/availability`, { params: { date } }),
};

// Services
export const servicesApi = {
  getAll: () => api.get('/services'),
  create: (data: object) => api.post('/services', data),
  update: (id: string, data: object) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// Clients
export const clientsApi = {
  getAll: (search?: string) => api.get('/clients', { params: { search } }),
  getById: (id: string) => api.get(`/clients/${id}`),
  create: (data: object) => api.post('/clients', data),
  update: (id: string, data: object) => api.put(`/clients/${id}`, data),
};

// Reports
export const reportsApi = {
  dashboard: () => api.get('/reports/dashboard'),
  revenue: (params?: object) => api.get('/reports/revenue', { params }),
  specialists: (params?: object) => api.get('/reports/specialists', { params }),
};

// Payments
export const paymentsApi = {
  getAll: () => api.get('/payments'),
  create: (data: object) => api.post('/payments', data),
};

// Business
export const businessApi = {
  getMe: () => api.get('/businesses/me'),
  update: (data: object) => api.put('/businesses/me', data),
  getUsers: () => api.get('/businesses/me/users'),
  addUser: (data: object) => api.post('/businesses/me/users', data),
};

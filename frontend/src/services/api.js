import axios from 'axios';

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001' });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('pt_token') || sessionStorage.getItem('pt_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const loginUser  = (email, password) => api.post('/api/auth/login', { email, password }).then(r => r.data);
export const register   = (email, password) => api.post('/api/auth/register', { email, password }).then(r => r.data);

export const searchML        = (q)              => api.get(`/api/products/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const searchFalabella = (q, limit = 10)  => api.get(`/api/falabella/search?q=${encodeURIComponent(q)}&limit=${limit}`).then(r => r.data);
export const searchAmazon    = (q, limit = 10)  => api.get(`/api/amazon/search?q=${encodeURIComponent(q)}&limit=${limit}`).then(r => r.data);
export const getProducts     = ()               => api.get('/api/products').then(r => r.data);
export const addProduct      = (product)        => api.post('/api/products', product).then(r => r.data);
export const getPriceHistory = (id)             => api.get(`/api/products/${id}/history`).then(r => r.data);
export const deleteProduct   = (id)             => api.delete(`/api/products/${id}`);
export const setProductTarget = (id, target_price) => api.patch(`/api/products/${id}/target`, { target_price }).then(r => r.data);
export const triggerUpdate   = ()               => api.post('/api/jobs/update-prices').then(r => r.data);

import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001' });

export const searchML = (q) => api.get(`/api/products/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const searchAmazon = (q) => api.get(`/api/amazon/search?q=${encodeURIComponent(q)}&limit=5`).then(r => r.data);
export const getProducts = () => api.get('/api/products').then(r => r.data);
export const addProduct = (product) => api.post('/api/products', product).then(r => r.data);
export const getPriceHistory = (id) => api.get(`/api/products/${id}/history`).then(r => r.data);
export const triggerUpdate = () => api.post('/api/jobs/update-prices').then(r => r.data);

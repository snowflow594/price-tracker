import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:3001' });

export const searchML = (q) => api.get(`/api/products/search?q=${encodeURIComponent(q)}`).then(r => r.data);
export const searchFalabella = (q, limit = 10) => api.get(`/api/falabella/search?q=${encodeURIComponent(q)}&limit=${limit}`).then(r => r.data);
export const searchAmazon = (q, limit = 10) => api.get(`/api/amazon/search?q=${encodeURIComponent(q)}&limit=${limit}`).then(r => r.data);
export const getProducts = () => api.get('/api/products').then(r => r.data);
export const addProduct = (product) => api.post('/api/products', product).then(r => r.data);
export const getPriceHistory = (id) => api.get(`/api/products/${id}/history`).then(r => r.data);
export const deleteProduct = (id) => api.delete(`/api/products/${id}`);
export const setProductTarget = (id, target_price) => api.patch(`/api/products/${id}/target`, { target_price }).then(r => r.data);
export const triggerUpdate = () => api.post('/api/jobs/update-prices').then(r => r.data);

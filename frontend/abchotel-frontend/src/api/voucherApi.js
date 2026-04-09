import axiosClient from './axiosClient';

export const voucherApi = {
  getAll: (onlyActive = false) => axiosClient.get('/vouchers', { params: { onlyActive } }),
  getById: (id) => axiosClient.get(`/vouchers/${id}`),
  create: (data) => axiosClient.post('/vouchers', data),
  update: (id, data) => axiosClient.put(`/vouchers/${id}`, data),
  toggleStatus: (id) => axiosClient.delete(`/vouchers/${id}`),
  apply: (data) => axiosClient.post('/vouchers/apply', data)
};
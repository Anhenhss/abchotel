import axiosClient from './axiosClient';

export const invoiceApi = {
  getAll: (status) => axiosClient.get('/Invoices', { params: { status } }),
  getById: (id) => axiosClient.get(`/Invoices/${id}`),
  recalculate: (id) => axiosClient.post(`/Invoices/${id}/recalculate`),
  payCash: (data) => axiosClient.post('/Invoices/pay', data),
  createVnPayUrl: (id) => axiosClient.post(`/Invoices/${id}/create-vnpay-url`)
};
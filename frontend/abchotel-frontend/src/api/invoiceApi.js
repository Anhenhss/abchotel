import axiosClient from './axiosClient';

export const invoiceApi = {
  getAll: (status) => axiosClient.get('/Invoices', { params: { status } }),
  getById: (id) => axiosClient.get(`/Invoices/${id}`),
  recalculate: (id) => axiosClient.post(`/Invoices/${id}/recalculate`),
  payCash: (data) => axiosClient.post('/Invoices/pay', data),
  createVnPayUrl: (id) => axiosClient.post(`/Invoices/${id}/create-vnpay-url`),
  
  // 🔥 THÊM 2 API NÀY ĐỂ ADD DỊCH VỤ / HƯ HỎNG NHANH
  addService: (invoiceId, data) => axiosClient.post(`/Invoices/${invoiceId}/add-service`, data),
  addDamage: (invoiceId, data) => axiosClient.post(`/Invoices/${invoiceId}/add-damage`, data),
  // Lấy hóa đơn bằng mã Booking
  getByBookingCode: (code) => axiosClient.get(`/Invoices/by-booking/${code}`),
};
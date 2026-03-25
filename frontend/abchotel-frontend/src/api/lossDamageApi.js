import axiosClient from './axiosClient';

export const lossDamageApi = {
  getByBooking: (bookingDetailId) => axiosClient.get(`/LossDamages/booking/${bookingDetailId}`),
  reportDamage: (data) => axiosClient.post('/LossDamages', data),
  updateStatus: (id, status) => axiosClient.patch(`/LossDamages/${id}/status`, { status }),
};
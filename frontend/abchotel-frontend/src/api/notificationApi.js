import axiosClient from './axiosClient';

export const notificationApi = {
  getMyNotifications: () => axiosClient.get('/Notifications'),
  markAsRead: (id) => axiosClient.put(`/Notifications/${id}/read`),
  markAllAsRead: () => axiosClient.put('/Notifications/read-all')
};
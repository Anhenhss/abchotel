import axiosClient from './axiosClient';

export const bookingApi = {
  // Lấy danh sách có hỗ trợ lọc theo trạng thái
  getAll: (status = '') => axiosClient.get('/Bookings', { params: { status } }),
  getMyBookings: () => axiosClient.get('/Bookings/my-bookings'),
  // Lấy chi tiết 1 đơn (Dùng cho Drawer sau này)
  getByCode: (code) => axiosClient.get(`/Bookings/${code}`),
  
  // Các thao tác chuyển trạng thái nhanh
  updateStatus: (id, status, reason = '') => axiosClient.patch(`/Bookings/${id}/status`, { status, reason }),
  
  searchRooms: (data) => axiosClient.post('/Bookings/search', data),
  createBooking: (data) => axiosClient.post('/Bookings/create', data),
  // Lấy danh sách số phòng cụ thể (Phòng vật lý)
  getSpecificRooms: (roomTypeId, checkIn, checkOut) => 
      axiosClient.get('/Bookings/specific-rooms', { params: { roomTypeId, checkIn, checkOut } }),
  
};
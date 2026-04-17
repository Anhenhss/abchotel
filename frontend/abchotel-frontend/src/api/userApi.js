import axiosClient from './axiosClient';

export const userApi = {

  /* =======================
     👤 PROFILE (USER)
  ======================= */

  // Lấy thông tin user đang đăng nhập
  getMyProfile: () => axiosClient.get('/user/profile'),

  // Cập nhật thông tin cá nhân
  updateMyProfile: (data) =>
    axiosClient.put('/user/profile', data),

  // Upload avatar
  uploadAvatar: (formData) =>
    axiosClient.post('/user/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  // Đổi mật khẩu user
  changePassword: (data) =>
    axiosClient.post('/user/change-password', data),


  /* =======================
     📦 BOOKING (USER)
  ======================= */

  // Lấy booking của user hiện tại
  getMyBookings: () =>
    axiosClient.get('/user/bookings'),

  // Xem chi tiết booking
  getMyBookingDetail: (id) =>
    axiosClient.get(`/user/bookings/${id}`),


  /* =======================
     👨‍💼 ADMIN - USER MANAGEMENT
  ======================= */

  // Danh sách user (search + paging + filter)
  getUsers: (params) =>
    axiosClient.get('/UserManagement', { params }),

  // Tạo user mới (admin)
  createUser: (data) =>
    axiosClient.post('/UserManagement', data),

  // Cập nhật user (admin)
  updateUser: (id, data) =>
    axiosClient.put(`/UserManagement/${id}`, data),

  // Khóa / mở khóa user (soft delete)
  toggleUserStatus: (id) =>
    axiosClient.delete(`/UserManagement/${id}`),

  // Đổi role user
  changeRole: (id, roleId) =>
    axiosClient.put(`/UserManagement/${id}/change-role`, {
      newRoleId: roleId
    }),

  // Reset mật khẩu user
  resetPassword: (id) =>
    axiosClient.post(`/UserManagement/${id}/reset-password`),


  /* =======================
     🔐 AUTH (OPTIONAL)
  ======================= */

  // Login
  login: (data) =>
    axiosClient.post('/auth/login', data),

  // Register
  register: (data) =>
    axiosClient.post('/auth/register', data),

  // Lấy user từ token
  getMe: () =>
    axiosClient.get('/auth/me')
};
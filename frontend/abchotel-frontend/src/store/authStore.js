import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null, // Thông tin profile
  isAuthenticated: false, // Trạng thái đã đăng nhập hay chưa

  // Hàm gọi khi đăng nhập thành công
  setAuth: (userData, accessToken, refreshToken) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user: userData, isAuthenticated: true });
  },

  // Hàm gọi khi đăng xuất (Xóa token)
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null, isAuthenticated: false });
  },
}));
import axios from 'axios';

const axiosClient = axios.create({
  baseURL: 'http://localhost:5035/api', 
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Trước khi gửi API đi -> Tự động nhét Token vào
axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    // Tự động gắn Token dạng Bearer vào Header
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor: Xử lý lỗi trả về (Ví dụ hết hạn Token sẽ xử lý ở đây sau)
axiosClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Xử lý lỗi phân quyền hoặc hết hạn token ở đây
    return Promise.reject(error);
  }
);

export default axiosClient;
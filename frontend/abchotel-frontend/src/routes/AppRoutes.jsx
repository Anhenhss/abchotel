import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AuthPage from '../pages/AuthPage'; // Import file vừa tạo

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/users" replace />} />
      
      {/* Route dành cho Khách chưa đăng nhập */}
      <Route path="/login" element={<AuthPage />} />

      {/* Routes dành cho Admin (Tạm thời cứ để mở, sau này mình sẽ cấu hình Protected Route) */}
      <Route path="/admin" element={<AdminLayout />}>
         <Route path="users" element={<div>Trang quản lý User (Sẽ làm ở bước sau)</div>} />
      </Route>
    </Routes>
  );
}
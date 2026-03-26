import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { Routes, Route } from 'react-router-dom';
import AdminLayout from '../layouts/AdminLayout';
import AuthPage from '../pages/AuthPage';
import HomePage from '../pages/HomePage';
import AdminDashboard from '../pages/AdminDashboard';
import Error404 from '../pages/Errors/Error404';
import ProtectedRoute from './ProtectedRoute';
import UserManagementPage from '../pages/UserManagementPage';
import RolesPage from '../pages/RolesPage';
import RequirePermission from './RequirePermission';
import ProfilePage from '../pages/ProfilePage';
import ShiftsPage from '../pages/ShiftsPage';
import AuditLogsPage from '../pages/AuditLogsPage';
import CategoriesPage from '../pages/CategoriesPage';
import ArticlesPage from '../pages/ArticlesPage';
import RoomTypesPage from '../pages/RoomTypesPage';
import RoomsPage from '../pages/RoomsPage';
import AttractionsPage from '../pages/AttractionsPage';
import AmenitiesPage from '../pages/AmenitiesPage';
import RoomInventoryPage from '../pages/RoomInventoryPage';
import LossDamagesPage from '../pages/LossDamagesPage';
import ReviewsPage from '../pages/ReviewsPage';

export default function AppRoutes() {
  const { checkAuth, isInitialized } = useAuthStore();

  // Chạy 1 lần duy nhất khi load web để khôi phục phiên
  useEffect(() => {
    checkAuth();
  }, []);

  // Nếu chưa check xong Token thì hiện màn hình loading, chặn không cho nhảy trang
  if (!isInitialized) {
    return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải dữ liệu hệ thống...</div>;
  }
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<AuthPage />} />

      <Route path="/admin" element={ <ProtectedRoute requireAdmin={true}><AdminLayout /></ProtectedRoute> }>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={
          <RequirePermission requiredPermissions={["MANAGE_USERS", "VIEW_USERS"]}> 
             <UserManagementPage />
          </RequirePermission>
        } />
        <Route path="roles" element={
          <RequirePermission requiredPermissions={["MANAGE_ROLES", "VIEW_ROLES"]}>
             <RolesPage />
          </RequirePermission>
        } />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="shifts" element={<ShiftsPage />} />
        <Route path="audit-logs" element={
          <RequirePermission requiredPermissions={["VIEW_AUDIT_LOGS"]}>
             <AuditLogsPage />
          </RequirePermission>
        } />
        <Route path="categories" element={
          <RequirePermission requiredPermissions={["MANAGE_CONTENT"]}>
             <CategoriesPage />
          </RequirePermission>
        } />
        <Route path="articles" element={
          <RequirePermission requiredPermissions={["MANAGE_CONTENT"]}>
             <ArticlesPage />
          </RequirePermission>
        } />
        <Route path="room-types" element={
          <RequirePermission requiredPermissions={["MANAGE_ROOMS"]}>
             <RoomTypesPage />
          </RequirePermission>
        } />
        <Route path="rooms" element={
          <RequirePermission requiredPermissions={["MANAGE_ROOMS"]}>
             <RoomsPage />
          </RequirePermission>
        } />
        <Route path="attractions" element={
          <RequirePermission requiredPermissions={["MANAGE_CONTENT"]}>
             <AttractionsPage />
          </RequirePermission>
        } />
        <Route path="amenities" element={
          <RequirePermission requiredPermissions={["MANAGE_INVENTORY"]}>
             <AmenitiesPage />
          </RequirePermission>
        } />
        <Route path="inventory" element={
          <RequirePermission requiredPermissions={["MANAGE_INVENTORY"]}>
             <RoomInventoryPage />
          </RequirePermission>
        } />
        <Route path="loss-damages" element={
          <RequirePermission requiredPermissions={["MANAGE_INVENTORY"]}>
             <LossDamagesPage />
          </RequirePermission>
        } />
        <Route path="reviews" element={
          <RequirePermission requiredPermissions={["MANAGE_CONTENT"]}>
             <ReviewsPage />
          </RequirePermission>
        } />


        {/* Tất cả các link menu chưa làm sẽ rơi vào trang 404 nằm giữa thân Layout */}
        <Route path="*" element={<Error404 />} />
      </Route>

      {/* Đường dẫn sai hoàn toàn bên ngoài */}
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
}
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
import RoomsPage from '../pages/RoomsPage';
import AttractionsPage from '../pages/AttractionsPage';
import AmenitiesPage from '../pages/AmenitiesPage';
import LossDamagesPage from '../pages/LossDamagesPage';
import ReviewsPage from '../pages/ReviewsPage';
import RoomDetailPage from '../pages/RoomDetail/RoomDetailPage';
import RoomSetupPage from '../pages/RoomSetup/RoomSetupPage';
import RoomSetupWizard from '../pages/RoomSetup/RoomSetupWizard';
import RoomTypeDetail from '../pages/RoomSetup/RoomTypeDetail';
import RoomConfigDetail from '../pages/RoomSetup/RoomConfigDetail';
import InventorySetupPage from '../pages/InventorySetup/InventorySetupPage';
import CategoryManagementPage from '../pages/Article/CategoryManagementPage';
import ArticleManagementPage from '../pages/Article/ArticleManagementPage';
import ArticleEditorPage from '../pages/Article/ArticleEditorPage';
import VouchersPage from '../pages/VouchersPage';
import MembershipsPage from '../pages/MembershipsPage';
import ServicesPage from '../pages/ServicesPage';
import BookingsPage from '../pages/BookingsPage';
import CreateBookingPage from "../pages/CreateBookingPage";
import InvoicesPage from "../pages/InvoicesPage";

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
      <Route path="dashboard" element={
          <RequirePermission requiredPermissions={["VIEW_DASHBOARD"]}> 
            <AdminDashboard />
          </RequirePermission>
        } />
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
            <CategoryManagementPage />
          </RequirePermission>
        } />
        <Route path="articles" element={
          <RequirePermission requiredPermissions={["MANAGE_CONTENT"]}>
            <ArticleManagementPage />
          </RequirePermission>
        } />

        <Route path="articles/editor/:id?" element={
          <RequirePermission requiredPermissions={["MANAGE_CONTENT"]}>
            <ArticleEditorPage />
          </RequirePermission>
        } />
        <Route path="room-setup" element={
          <RequirePermission requiredPermissions={["MANAGE_ROOMS"]}>
            <RoomSetupPage />
          </RequirePermission>
        } />
        <Route path="room-setup/create" element={
          <RequirePermission requiredPermissions={["MANAGE_ROOMS"]}>
            <RoomSetupWizard />
          </RequirePermission>
        } />
        <Route path="room-setup/:typeId" element={
          <RequirePermission requiredPermissions={["MANAGE_ROOMS"]}>
            <RoomTypeDetail />
          </RequirePermission>
        } />
        <Route path="room-setup/room/:roomId" element={
          <RequirePermission requiredPermissions={["MANAGE_ROOMS"]}>
            <RoomConfigDetail />
          </RequirePermission>
        } />
        <Route path="rooms" element={
          <RequirePermission requiredPermissions={["UPDATE_ROOM_STATUS", "UPDATE_CLEANING_STATUS", "MANAGE_INVENTORY", "MANAGE_ROOMS"]}>
             <RoomsPage />
          </RequirePermission>
        } />
        <Route path="rooms/:id" element={
          <RequirePermission requiredPermissions={["UPDATE_ROOM_STATUS", "UPDATE_CLEANING_STATUS", "MANAGE_INVENTORY", "MANAGE_ROOMS"]}>
             <RoomDetailPage />
          </RequirePermission>
        } />
        <Route path="inventory-setup" element={
          <RequirePermission requiredPermissions={["MANAGE_INVENTORY"]}>
            <InventorySetupPage />
          </RequirePermission>
        } />
        <Route path="attractions" element={
          <RequirePermission requiredPermissions={["MANAGE_CONTENT"]}>
             <AttractionsPage />
          </RequirePermission>
        } />
        <Route path="amenities" element={
          <RequirePermission requiredPermissions={["MANAGE_ROOMS"]}>
             <AmenitiesPage />
          </RequirePermission>
        } />
        <Route path="loss-damages" element={
          <RequirePermission requiredPermissions={["VIEW_REPORTS", "MANAGE_INVOICES"]}>
            <LossDamagesPage />
          </RequirePermission>
        } />
        <Route path="reviews" element={
          <RequirePermission requiredPermissions={["MANAGE_CONTENT"]}>
             <ReviewsPage />
          </RequirePermission>
        } />
        <Route path="vouchers" element={
          <RequirePermission requiredPermissions={["MANAGE_VOUCHERS"]}>
             <VouchersPage />
          </RequirePermission>
        } />
        <Route path="memberships" element={
          <RequirePermission requiredPermissions={["MANAGE_USERS"]}>
             <MembershipsPage />
          </RequirePermission>
        } />
        <Route path="services" element={
          <RequirePermission requiredPermissions={["MANAGE_SERVICES"]}>
             <ServicesPage />
          </RequirePermission>
        } />
        <Route path="bookings" element={
          <RequirePermission requiredPermissions={["MANAGE_BOOKINGS"]}>
             <BookingsPage />
          </RequirePermission>
        } />
        <Route path="bookings/create" element={
          <RequirePermission requiredPermissions={["MANAGE_BOOKINGS"]}>
             <CreateBookingPage />
          </RequirePermission>
        } />
        <Route path="invoices" element={
          <RequirePermission requiredPermissions={["MANAGE_INVOICES"]}>
            <InvoicesPage />
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
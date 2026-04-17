// 1. Import trang Profile vào đầu file
import Profile from './pages/Profile'; 
import ClientLayout from './layouts/ClientLayout'; // Đảm bảo đã import Layout

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Các route của bạn thường nằm ở đây */}
        
        {/* 2. Thêm Route cho Profile, bọc trong ClientLayout để có màu Xanh dương - Đỏ */}
        <Route path="/" element={<ClientLayout />}>
           <Route path="profile" element={<Profile />} />
           {/* Các trang khác của Client như Home, Room... */}
        </Route>

        {/* Route cho Admin (nếu có) */}
        <Route path="/admin" element={<AdminLayout />}>
           {/* ... */}
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
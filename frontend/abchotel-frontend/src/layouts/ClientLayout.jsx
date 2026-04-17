import React, { useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, User, Home, Calendar, LogOut } from 'lucide-react';
import * as signalR from '@microsoft/signalr';

const ClientLayout = () => {
  const location = useLocation();

  useEffect(() => {
    // Cấu hình SignalR Realtime
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:xxxx/notificationHub") // Thay port backend của bạn vào đây
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => console.log("Đã kết nối SignalR thành công!"))
      .catch(err => console.error("Lỗi kết nối SignalR: ", err));

    connection.on("ReceiveNotification", (message) => {
      // Hiển thị thông báo (có thể dùng Toast tại đây)
      alert("Thông báo mới: " + message);
    });

    return () => connection.stop();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* SIDEBAR - Tông màu Xanh dương đen */}
      <aside className="w-64 bg-[#001f3f] text-white hidden md:flex flex-col shadow-xl">
        <div className="p-6 border-b border-white/10 text-center font-bold text-xl tracking-widest text-[#8b0000]">
          ABC HOTEL
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <Link to="/" className={`flex items-center gap-3 p-3 rounded-lg transition ${location.pathname === '/' ? 'bg-[#8b0000]' : 'hover:bg-white/10'}`}>
            <Home size={20} /> Trang chủ
          </Link>
          <Link to="/profile" className={`flex items-center gap-3 p-3 rounded-lg transition ${location.pathname === '/profile' ? 'bg-[#8b0000]' : 'hover:bg-white/10'}`}>
            <User size={20} /> Hồ sơ cá nhân
          </Link>
          <Link to="/booking" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/10 transition">
            <Calendar size={20} /> Đặt phòng
          </Link>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button className="flex items-center gap-3 w-full p-3 hover:text-red-400 transition">
            <LogOut size={20} /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div className="flex-1 flex flex-col">
        {/* Header - Mobile Responsive */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shadow-sm">
          <div className="md:hidden font-bold text-[#001f3f]">ABC HOTEL</div>
          <div className="ml-auto flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-[#8b0000]">
              <Bell size={22} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#8b0000] rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 border-l pl-4">
              <span className="text-sm font-medium text-[#001f3f]">Ly Huỳnh</span>
            </div>
          </div>
        </header>

        {/* Nơi hiển thị các trang con (Profile, Home,...) */}
        <main className="p-4 md:p-8 flex-1 overflow-y-auto">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default ClientLayout;
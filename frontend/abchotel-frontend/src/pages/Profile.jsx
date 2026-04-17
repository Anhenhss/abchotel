import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserCircle2, Mail, Phone, MapPin, Star, Camera, ShieldCheck, CreditCard } from 'lucide-react';

const Profile = () => {
  const [activeTab, setActiveTab] = useState('chung');

  // Dữ liệu mẫu (sau này bạn sẽ gọi API từ backend .NET)
  const user = {
    name: "Huỳnh Thị Trúc Ly",
    role: "Quản lý viên (HR)",
    email: "truly123000907@gmail.com",
    phone: "0123 456 789",
    location: "Đại học Lạc Hồng (LHU)",
    points: 907
  };

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-[#001f3f] mb-6">Hồ sơ Cá nhân</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT TRÁI: SIDEBAR THÔNG TIN */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-2xl shadow-sm border-t-4 border-[#8b0000] p-6 flex flex-col items-center">
              <div className="relative mb-4">
                <div className="w-32 h-32 rounded-full border-4 border-[#001f3f]/10 flex items-center justify-center bg-gray-50">
                  <UserCircle2 size={80} className="text-[#001f3f]" />
                </div>
                <button className="absolute bottom-1 right-1 bg-[#8b0000] text-white p-2 rounded-full hover:bg-red-800 transition-colors">
                  <Camera size={16} />
                </button>
              </div>
              <h2 className="text-xl font-bold text-[#001f3f]">{user.name}</h2>
              <p className="text-gray-500 text-sm font-medium">{user.role}</p>
              
              <div className="w-full mt-6 pt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Mail size={16} className="text-[#8b0000]" /> {user.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Phone size={16} className="text-[#8b0000]" /> {user.phone}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <MapPin size={16} className="text-[#8b0000]" /> {user.location}
                </div>
              </div>
            </div>

            {/* THẺ ĐIỂM TÍCH LŨY (Dạng Card cho Mobile) */}
            <div className="bg-[#001f3f] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
              <Star className="absolute -right-4 -top-4 w-24 h-24 text-white/5" />
              <p className="text-blue-200 text-xs uppercase tracking-widest font-bold mb-1">Thành viên ưu tú</p>
              <h3 className="text-3xl font-bold">{user.points} <span className="text-sm font-normal">Điểm</span></h3>
              <div className="mt-4 h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-[#8b0000]" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>

          {/* CỘT PHẢI: FORM CẬP NHẬT */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm overflow-hidden flex flex-col">
            {/* Tabs Header */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => setActiveTab('chung')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'chung' ? 'bg-white text-[#8b0000] border-b-2 border-[#8b0000]' : 'text-gray-400 hover:text-[#001f3f]'}`}
              >
                Thông tin chung
              </button>
              <button 
                onClick={() => setActiveTab('matkhau')}
                className={`flex-1 py-4 text-sm font-bold transition-all ${activeTab === 'matkhau' ? 'bg-white text-[#8b0000] border-b-2 border-[#8b0000]' : 'text-gray-400 hover:text-[#001f3f]'}`}
              >
                Đổi mật khẩu
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 md:p-8 flex-grow">
              <AnimatePresence mode="wait">
                {activeTab === 'chung' ? (
                  <motion.div 
                    key="chung" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-[#001f3f] uppercase mb-2 block">Họ và tên *</label>
                      <input type="text" defaultValue={user.name} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#8b0000] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#001f3f] uppercase mb-2 block">Số điện thoại</label>
                      <input type="text" defaultValue={user.phone} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#8b0000] outline-none tracking-wider" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#001f3f] uppercase mb-2 block">Giới tính</label>
                      <select className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#8b0000] outline-none">
                        <option>Nữ</option>
                        <option>Nam</option>
                        <option>Khác</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-xs font-bold text-[#001f3f] uppercase mb-2 block">Địa chỉ</label>
                      <input type="text" defaultValue={user.location} className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#8b0000] outline-none" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="pass" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6 max-w-md">
                    <div>
                      <label className="text-xs font-bold text-[#001f3f] uppercase mb-2 block">Mật khẩu hiện tại</label>
                      <input type="password" underline="none" className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#8b0000] outline-none" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#001f3f] uppercase mb-2 block">Mật khẩu mới</label>
                      <input type="password" underline="none" className="w-full p-3 rounded-xl border border-gray-200 focus:border-[#8b0000] outline-none" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer Nút bấm */}
            <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button className="bg-[#001f3f] text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-[#001f3f]/90 active:scale-95 transition-all shadow-lg shadow-blue-900/20">
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
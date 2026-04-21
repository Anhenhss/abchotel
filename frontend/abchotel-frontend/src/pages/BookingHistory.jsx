import React from 'react';

const BookingHistory = () => {
  const bookings = [
    {
      id: 'ABC-7799',
      hotel: 'ABC Luxury Resort & Spa',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=200',
      checkIn: '20/04/2026',
      checkOut: '22/04/2026',
      roomType: 'Phòng Suite Hướng Biển',
      price: '5.500.000đ',
      status: 'Đã xác nhận'
    },
    {
      id: 'ABC-1234',
      hotel: 'ABC Plaza Center',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=200',
      checkIn: '10/03/2026',
      checkOut: '12/03/2026',
      roomType: 'Phòng Deluxe Giường Đôi',
      price: '2.100.000đ',
      status: 'Hoàn thành'
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Đã xác nhận': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Hoàn thành': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-gray-900">Hành trình của bạn</h1>
          <p className="text-gray-500">Xem lại những khoảnh khắc tuyệt vời tại ABC Hotel</p>
        </div>

        {/* Thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Tổng chuyến đi</p>
            <p className="text-2xl font-bold text-blue-600">12</p>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">Thành viên</p>
            <p className="text-2xl font-bold text-amber-600">Gold Member</p>
          </div>
        </div>

        {/* Danh sách đặt phòng */}
        <div className="space-y-6">
          {bookings.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row">
                {/* Hình ảnh */}
                <div className="md:w-48 h-48 md:h-auto">
                  <img src={item.image} alt={item.hotel} className="w-full h-full object-cover" />
                </div>

                {/* Nội dung */}
                <div className="flex-1 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <span className="text-xs font-mono text-gray-400 uppercase tracking-widest">Mã đơn: {item.id}</span>
                      <h3 className="text-xl font-bold text-gray-800 mt-1">{item.hotel}</h3>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-xs font-semibold border ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-6">
                    <div>
                      <p className="text-gray-400 uppercase text-[10px] font-bold">Ngày nhận phòng</p>
                      <p className="font-medium text-gray-700">{item.checkIn}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px] font-bold">Ngày trả phòng</p>
                      <p className="font-medium text-gray-700">{item.checkOut}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px] font-bold">Loại phòng</p>
                      <p className="font-medium text-gray-700">{item.roomType}</p>
                    </div>
                    <div>
                      <p className="text-gray-400 uppercase text-[10px] font-bold">Tổng thanh toán</p>
                      <p className="font-bold text-blue-600">{item.price}</p>
                    </div>
                  </div>

                  {/* Nút thao tác */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-50">
                    <button className="flex-1 md:flex-none px-6 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                      Xem chi tiết đơn
                    </button>
                    {item.status === 'Hoàn thành' && (
                      <button className="flex-1 md:flex-none px-6 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
                        Đánh giá 5⭐
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookingHistory;
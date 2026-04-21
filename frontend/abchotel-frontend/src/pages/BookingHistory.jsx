import React from 'react';

const BookingHistory = () => {
  // Sau này Ly sẽ lấy dữ liệu từ api ở đây
  const bookings = [
    { id: '1', hotel: 'Mường Thanh', date: '20/10/2023', status: 'Thành công' },
  ];

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Lịch sử đặt phòng</h1>
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-4 py-2">Mã đơn</th>
            <th className="border px-4 py-2">Khách sạn</th>
            <th className="border px-4 py-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((item) => (
            <tr key={item.id}>
              <td className="border px-4 py-2">{item.id}</td>
              <td className="border px-4 py-2">{item.hotel}</td>
              <td className="border px-4 py-2 text-green-500">{item.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default BookingHistory;
import React from 'react'

function App() {
  const history = [
    { id: 'BK001', hotel: 'ABC Hotel Luxury', date: '20/04/2026', price: '1.200.000đ', status: 'Hoàn thành' },
    { id: 'BK002', hotel: 'ABC Hotel Plaza', date: '25/04/2026', price: '950.000đ', status: 'Đang chờ' }
  ]

  return (
    <div style={{ padding: '20px', color: 'white', backgroundColor: '#1a202c', minHeight: '100vh' }}>
      <h2 style={{ fontSize: '24px', marginBottom: '20px' }}>Lịch sử đặt phòng - Ly</h2>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid #444' }}>
            <th style={{ textAlign: 'left', padding: '10px' }}>Mã đơn</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Khách sạn</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Ngày</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Giá</th>
            <th style={{ textAlign: 'left', padding: '10px' }}>Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {history.map((item) => (
            <tr key={item.id} style={{ borderBottom: '1px solid #333' }}>
              <td style={{ padding: '10px' }}>{item.id}</td>
              <td style={{ padding: '10px' }}>{item.hotel}</td>
              <td style={{ padding: '10px' }}>{item.date}</td>
              <td style={{ padding: '10px' }}>{item.price}</td>
              <td style={{ padding: '10px', color: item.status === 'Hoàn thành' ? '#4ade80' : '#fbbf24' }}>
                {item.status}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default App
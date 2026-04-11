import React, { useState, useEffect } from 'react';
import { Drawer, Descriptions, Table, Tag, Button, Space, Typography, Divider, Spin, notification, Popconfirm } from 'antd';
import { Printer, XCircle, CreditCard, CheckCircle, ClockCounterClockwise, User, CalendarBlank, Door } from '@phosphor-icons/react';
import dayjs from 'dayjs';

import { bookingApi } from '../api/bookingApi';
import { COLORS } from '../constants/theme';

const { Title, Text } = Typography;

export default function BookingDetailDrawer({ isOpen, onClose, bookingCode }) {
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  // Gọi API lấy dữ liệu chi tiết khi ngăn kéo mở ra
  useEffect(() => {
    if (isOpen && bookingCode) {
      fetchDetail();
    }
  }, [isOpen, bookingCode]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getByCode(bookingCode);
      setBookingData(res);
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Không thể lấy thông tin chi tiết.' });
      onClose(); // Lỗi thì đóng ngăn kéo luôn
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async () => {
    try {
      setLoading(true);
      await bookingApi.updateStatus(bookingData.id, 'Cancelled', 'Hủy bởi Lễ tân (No-Show)');
      api.success({ message: 'Thành công', description: 'Đã hủy đơn đặt phòng.' });
      fetchDetail(); // Load lại dữ liệu mới
    } catch (e) {
      api.error({ message: 'Lỗi', description: 'Không thể hủy đơn này.' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const renderStatus = (status) => {
    switch (status) {
      case 'Pending': return <Tag color="warning" icon={<ClockCounterClockwise/>}>Chờ thanh toán</Tag>;
      case 'Confirmed': return <Tag color="processing" icon={<CheckCircle/>}>Đã xác nhận</Tag>;
      case 'Checked_in': return <Tag color="success">Đang lưu trú</Tag>;
      case 'Completed': return <Tag color="default">Đã hoàn thành</Tag>;
      case 'Cancelled': return <Tag color="error" icon={<XCircle/>}>Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  // Cấu hình bảng hiển thị danh sách phòng khách đặt
  const roomColumns = [
    {
      title: 'Hạng Phòng', dataIndex: 'roomTypeName', key: 'roomType',
      render: (text) => <Text strong style={{ color: COLORS.MIDNIGHT_BLUE }}>{text}</Text>
    },
    {
      title: 'Số Phòng', dataIndex: 'roomNumber', key: 'roomNumber',
      render: (text) => <Tag color={text === 'Sẽ xếp khi nhận phòng' ? 'default' : 'blue'}>{text}</Tag>
    },
    {
      title: 'Nhận/Trả', key: 'dates',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{dayjs(record.checkIn).format('DD/MM/YY')}</Text>
          <Text style={{ fontSize: 12 }}>{dayjs(record.checkOut).format('DD/MM/YY')}</Text>
        </Space>
      )
    },
    {
      title: 'Giá', dataIndex: 'price', key: 'price', align: 'right',
      render: (val) => <Text strong style={{ color: COLORS.ACCENT_RED }}>{new Intl.NumberFormat('vi-VN').format(val)}đ</Text>
    }
  ];

  return (
    <>
      {contextHolder}
      
      {/* 1. GIAO DIỆN HIỂN THỊ TRÊN MÀN HÌNH (ẨN KHI IN) */}
      <Drawer
        title={
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Title level={4} style={{ color: COLORS.MIDNIGHT_BLUE, margin: 0 }}>Đơn {bookingCode}</Title>
              {bookingData && renderStatus(bookingData.status)}
            </Space>
          </div>
        }
        placement="right"
        width={600}
        onClose={onClose}
        open={isOpen}
        className="no-print" // Class này lát mình cấu hình CSS để ẩn đi khi in
      >
        {loading || !bookingData ? (
          <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* NỘI DUNG CHÍNH */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Title level={5} style={{ color: COLORS.MIDNIGHT_BLUE }}><User size={18} style={{ verticalAlign: 'text-bottom' }}/> Thông tin Khách hàng</Title>
              <Descriptions column={1} size="small" bordered style={{ marginBottom: 24, backgroundColor: '#fff' }}>
                <Descriptions.Item label="Họ tên">{bookingData.guestName || 'Khách vãng lai'}</Descriptions.Item>
                <Descriptions.Item label="Số điện thoại">{bookingData.guestPhone || '---'}</Descriptions.Item>
                <Descriptions.Item label="Số CCCD/Passport">{bookingData.identityNumber || <Text type="secondary">Chưa cập nhật</Text>}</Descriptions.Item>
              </Descriptions>

              <Title level={5} style={{ color: COLORS.MIDNIGHT_BLUE }}><CreditCard size={18} style={{ verticalAlign: 'text-bottom' }}/> Thông tin Thanh toán</Title>
              <Descriptions column={1} size="small" bordered style={{ marginBottom: 24, backgroundColor: '#fff' }}>
                <Descriptions.Item label="Tổng tiền (Dự kiến)">
                  <Text strong style={{ color: COLORS.ACCENT_RED, fontSize: 16 }}>{new Intl.NumberFormat('vi-VN').format(bookingData.totalAmount)}đ</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Trạng thái Hóa đơn">
                  {bookingData.invoiceStatus === 'Paid' ? <Tag color="success">Đã thanh toán</Tag> : <Tag color="error">Chưa thanh toán / Nợ</Tag>}
                </Descriptions.Item>
              </Descriptions>

              <Title level={5} style={{ color: COLORS.MIDNIGHT_BLUE }}><Door size={18} style={{ verticalAlign: 'text-bottom' }}/> Danh sách Phòng đã đặt</Title>
              <Table 
                columns={roomColumns} 
                dataSource={bookingData.rooms} 
                rowKey={(record, index) => index} 
                pagination={false} 
                size="small"
                style={{ border: `1px solid ${COLORS.LIGHTEST}`, borderRadius: 8 }}
              />
            </div>

            {/* PHẦN FOOTER CHỨA NÚT BẤM (Nằm dính dưới cùng) */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.LIGHTEST}`, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={onClose} size="large">Đóng</Button>
              
              <Space>
                {/* Chỉ cho in nếu đã thanh toán */}
                <Button 
                  type="primary" 
                  size="large" 
                  icon={<Printer size={20} />} 
                  onClick={handlePrint}
                  disabled={bookingData.invoiceStatus !== 'Paid'}
                  style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }}
                >
                  In Hóa Đơn
                </Button>

                {/* Khóa nút hủy nếu đơn đã hoàn thành hoặc hủy rồi */}
                {(bookingData.status === 'Pending' || bookingData.status === 'Confirmed') && (
                  <Popconfirm title="Xác nhận khách No-Show và hủy đơn?" onConfirm={handleCancelBooking}>
                    <Button danger size="large" icon={<XCircle size={20} />}>Hủy Đơn</Button>
                  </Popconfirm>
                )}
              </Space>
            </div>

          </div>
        )}
      </Drawer>

      {/* ========================================================================= */}
      {/* 2. KHU VỰC ẨN: CHỈ HIỂN THỊ KHI BẤM NÚT IN (CSS @media print) */}
      {/* ========================================================================= */}
      {bookingData && (
        <div className="print-only">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{ margin: 0 }}>ABC HOTEL</h1>
            <p style={{ margin: 0 }}>123 Đường Ven Biển, TP. XYZ</p>
            <p style={{ margin: 0 }}>SĐT: 0123.456.789</p>
            <h2>HÓA ĐƠN THANH TOÁN (RECEIPT)</h2>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p><b>Khách hàng:</b> {bookingData.guestName}</p>
              <p><b>Số điện thoại:</b> {bookingData.guestPhone}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><b>Mã đơn:</b> {bookingData.bookingCode}</p>
              <p><b>Ngày in:</b> {dayjs().format('DD/MM/YYYY HH:mm')}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Hạng Phòng</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Đơn giá</th>
              </tr>
            </thead>
            <tbody>
              {bookingData.rooms.map((room, idx) => (
                <tr key={idx} style={{ borderBottom: '1px dotted #ccc' }}>
                  <td style={{ padding: 8 }}>{room.roomTypeName} ({room.roomNumber})</td>
                  <td style={{ textAlign: 'right', padding: 8 }}>{new Intl.NumberFormat('vi-VN').format(room.price)}đ</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ textAlign: 'right', fontSize: 18 }}>
            <p><b>Tổng cộng:</b> {new Intl.NumberFormat('vi-VN').format(bookingData.totalAmount)}đ</p>
            <p><b>Trạng thái:</b> ĐÃ THANH TOÁN</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <p><i>Cảm ơn quý khách và hẹn gặp lại!</i></p>
          </div>
        </div>
      )}

      {/* CSS XỬ LÝ ẨN/HIỆN KHI IN CỰC KỲ XỊN XÒ */}
      <style>{`
        /* Mặc định trên màn hình máy tính thì ẩn cái khu vực in đi */
        .print-only { display: none; }

        /* KHI MÁY IN ĐƯỢC KÍCH HOẠT (@media print) */
        @media print {
          /* 1. Ẩn tất cả mọi thứ trên màn hình (Sidebar, Header, Drawer...) */
          body * { visibility: hidden; }
          
          /* 2. Chỉ hiện duy nhất cái khung in Hóa đơn */
          .print-only, .print-only * {
            visibility: visible;
          }
          
          /* 3. Dàn cái hóa đơn ra giữa giấy A4 */
          .print-only {
            display: block;
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 20px;
            font-family: monospace;
            color: #000;
          }
        }
      `}</style>
    </>
  );
}
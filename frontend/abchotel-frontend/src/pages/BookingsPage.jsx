import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Input, notification, Tooltip, Popconfirm, Grid, Divider, Empty, Tabs } from 'antd';
import { MagnifyingGlass, CalendarCheck, Eye, XCircle, CheckCircle, ClockCounterClockwise } from '@phosphor-icons/react';
import dayjs from 'dayjs';

import { bookingApi } from '../api/bookingApi';
import { useSignalR } from '../hooks/useSignalR';
import { COLORS } from '../constants/theme';

import BookingDetailDrawer from '../components/BookingDetailDrawer'; 

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function BookingsPage() {
  const screens = useBreakpoint();
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });

  // States
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('ALL'); // Lọc theo trạng thái

  // Drawer States (Chuẩn bị cho bước sau)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBookingCode, setSelectedBookingCode] = useState(null);

  // Lấy dữ liệu
  const fetchBookings = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      // Giả định backend có API lấy toàn bộ Booking
      const res = await bookingApi.getAll(); 
      setBookings(res || []);
    } catch (error) {
      if (!isSilent) api.error({ message: 'Lỗi', description: 'Không thể tải danh sách đặt phòng.' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  // Lắng nghe thông báo Realtime từ hệ thống (VD: Có khách vừa đặt phòng trên Web)
  useSignalR((notification) => {
    if (notification.permission === "MANAGE_BOOKINGS") {
      fetchBookings(true);
    }
  });

  // Xử lý đổi trạng thái nhanh (Hủy đơn nếu No-Show)
  const handleCancelBooking = async (id) => {
    try {
      setLoading(true);
      await bookingApi.updateStatus(id, 'Cancelled', 'Hủy bởi Lễ tân (No-Show)');
      api.success({ message: 'Thành công', description: 'Đã hủy đơn đặt phòng.' });
      fetchBookings();
    } catch (e) {
      api.error({ message: 'Lỗi', description: 'Không thể hủy đơn này.' });
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = (code) => {
    setSelectedBookingCode(code);
    setIsDrawerOpen(true);
  };

  // 🔥 THUẬT TOÁN LỌC VÀ SẮP XẾP (ĐẨY ĐƠN KHÓA XUỐNG CUỐI)
  const processedBookings = bookings
    .filter(b => {
      // 1. Lọc theo Tab (Trạng thái)
      if (activeTab !== 'ALL' && b.status !== activeTab) return false;
      
      // 2. Lọc theo thanh tìm kiếm (Mã đơn, Tên khách, SĐT)
      const searchLower = searchText.toLowerCase();
      return (
        b.bookingCode?.toLowerCase().includes(searchLower) ||
        b.guestName?.toLowerCase().includes(searchLower) ||
        b.guestPhone?.includes(searchText)
      );
    })
    .sort((a, b) => {
      // Đẩy Cancelled và Completed xuống dưới cùng
      const getWeight = (status) => {
        if (status === 'Cancelled' || status === 'Completed') return 10; // Nặng nhất, rớt xuống đáy
        if (status === 'Pending') return 1; // Cần xử lý gấp, nổi lên đầu
        return 5; // Còn lại ở giữa
      };
      
      const weightA = getWeight(a.status);
      const weightB = getWeight(b.status);
      
      if (weightA !== weightB) return weightA - weightB;
      // Cùng trạng thái thì cái nào mới tạo xếp trên
      return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
    });

  // Hàm render UI Trạng thái
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

  // Cấu hình Cột cho Table (PC)
  const columns = [
    {
      title: 'Mã Đơn', dataIndex: 'bookingCode', key: 'code',
      render: (text, record) => {
        const isLocked = record.status === 'Cancelled' || record.status === 'Completed';
        return <Text strong style={{ color: isLocked ? COLORS.MUTED : COLORS.MIDNIGHT_BLUE, textDecoration: record.status === 'Cancelled' ? 'line-through' : 'none' }}>{text}</Text>
      }
    },
    {
      title: 'Khách hàng', key: 'guest',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: COLORS.DARKEST }}>{record.guestName || 'Khách vãng lai'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.guestPhone}</Text>
        </Space>
      )
    },
    {
      title: 'Thời gian lưu trú', key: 'dates',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13 }}>Vào: <Text strong>{record.actualCheckIn ? dayjs(record.actualCheckIn).format('DD/MM/YY HH:mm') : 'Chưa nhận'}</Text></Text>
          <Text style={{ fontSize: 13 }}>Ra: <Text strong>{record.actualCheckOut ? dayjs(record.actualCheckOut).format('DD/MM/YY HH:mm') : 'Chưa trả'}</Text></Text>
        </Space>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center',
      render: (status) => renderStatus(status)
    },
    {
      title: 'Thao tác', key: 'actions', align: 'center', width: 120,
      render: (_, record) => {
        const isLocked = record.status === 'Cancelled' || record.status === 'Completed';
        return (
          <Space size="small">
            <Tooltip title="Xem chi tiết">
              <Button type="primary" ghost icon={<Eye size={20} />} onClick={() => openDrawer(record.bookingCode)} style={{ borderColor: COLORS.LIGHT, color: COLORS.MIDNIGHT_BLUE }} />
            </Tooltip>
            
            {/* Nút Hủy chỉ hiện khi đơn đang Pending hoặc Confirmed */}
            {!isLocked && record.status !== 'Checked_in' && (
              <Popconfirm title="Khách No-Show? Bạn chắc chắn muốn hủy đơn này?" onConfirm={() => handleCancelBooking(record.id)}>
                <Button type="text" danger icon={<XCircle size={20} />} />
              </Popconfirm>
            )}
          </Space>
        )
      }
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {contextHolder}
      <Title level={3} style={{ color: COLORS.MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Quản lý Đơn Đặt Phòng</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: screens.md ? 0 : '16px 0' }}>
        
        {/* THANH TÌM KIẾM VÀ TABS PHÂN LOẠI */}
        <div style={{ display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: screens.xs ? 'stretch' : 'center', marginBottom: 16, gap: 16, padding: screens.md ? '0' : '0 16px' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            style={{ flex: 1 }}
            items={[
              { key: 'ALL', label: 'Tất cả đơn' },
              { key: 'Pending', label: 'Chờ thanh toán' },
              { key: 'Confirmed', label: 'Sắp đến' },
              { key: 'Checked_in', label: 'Đang lưu trú' },
            ]}
          />
          <Input 
            placeholder="Tìm mã đơn, tên, SĐT..." 
            prefix={<MagnifyingGlass color={COLORS.MUTED} />} 
            allowClear 
            onChange={e => setSearchText(e.target.value)}
            style={{ width: screens.xs ? '100%' : 280 }}
            size="large"
          />
          <Button type="primary" size="large" style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }} onClick={() => navigate('/admin/bookings/create')}>+ Đặt Phòng Mới</Button>
        </div>

        {/* HIỂN THỊ DỮ LIỆU (PC BẢNG / MOBILE CARD) */}
        {screens.md ? (
          <Table 
            columns={columns} dataSource={processedBookings} rowKey="id" loading={loading}
            pagination={{ pageSize: 10 }} rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
            {processedBookings.length === 0 ? <Empty description="Không có đơn đặt phòng nào" /> : processedBookings.map(record => {
              const isLocked = record.status === 'Cancelled' || record.status === 'Completed';
              return (
                <div key={record.id} style={{ border: `1px solid ${COLORS.LIGHTEST}`, borderRadius: 8, padding: 16, backgroundColor: isLocked ? '#fafafa' : '#fff', opacity: isLocked ? 0.6 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16, color: COLORS.MIDNIGHT_BLUE, textDecoration: record.status === 'Cancelled' ? 'line-through' : 'none' }}>{record.bookingCode}</Text>
                    {renderStatus(record.status)}
                  </div>
                  <Space direction="vertical" size={2} style={{ width: '100%', marginBottom: 12 }}>
                    <Text strong>{record.guestName || 'Khách vãng lai'}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>SĐT: {record.guestPhone}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>Ngày tạo: {dayjs(record.createdAt).format('DD/MM/YY HH:mm')}</Text>
                  </Space>
                  <Divider style={{ margin: '8px 0' }} />
                  <Button type="primary" block ghost onClick={() => openDrawer(record.bookingCode)}>Xem chi tiết đơn</Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* COMPONENT NGĂN KÉO CHI TIẾT SẼ GẮN VÀO ĐÂY */}
      <BookingDetailDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} bookingCode={selectedBookingCode} />

      <style>{`
        .ant-table-thead > tr > th { background-color: ${COLORS.LIGHTEST} !important; color: ${COLORS.MIDNIGHT_BLUE} !important; font-weight: 700 !important; }
        .table-row-light { background-color: #ffffff; }
        .table-row-dark { background-color: #fcfcfc; }
        .ant-tabs-nav::before { border-bottom: none !important; }
      `}</style>
    </div>
  );
}
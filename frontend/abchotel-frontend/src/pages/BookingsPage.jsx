import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Input, notification, Tooltip, Popconfirm, Grid, Divider, Empty, Tabs } from 'antd';
import { MagnifyingGlass, Eye, XCircle, CheckCircle, ClockCounterClockwise, CalendarCheck, DoorOpen } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { bookingApi } from '../api/bookingApi';
import { useSignalR } from '../hooks/useSignalR';

import BookingDetailDrawer from '../components/BookingDetailDrawer'; 

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

// 🔥 BẢNG MÀU LUXURY ĐỒNG BỘ
const LUXURY_COLORS = {
    DARKEST: '#1C2E4A', NAVY: '#344966', MUTED_BLUE: '#7D92AD', 
    LIGHT_BLUE: '#B4CDED', LIGHTEST: '#E9F0F8', WHITE: '#FFFFFF',
    GOLD: '#D4AF37', ACCENT_RED: '#8A1538', SUCCESS: '#52c41a'
};

export default function BookingsPage() {
  const screens = useBreakpoint();
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });
  const navigate = useNavigate(); 

  // States
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // 🔥 MẶC ĐỊNH MỞ TAB "ĐẾN HÔM NAY" ĐỂ LỄ TÂN VÀO CA LÀ THẤY NGAY
  const [activeTab, setActiveTab] = useState('ArrivalsToday'); 

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedBookingCode, setSelectedBookingCode] = useState(null);

  const fetchBookings = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await bookingApi.getAll(); 
      setBookings(res || []);
    } catch (error) {
      if (!isSilent) api.error({ message: 'Lỗi', description: 'Không thể tải danh sách đơn.' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => { fetchBookings(); }, []);

  useSignalR((notification) => {
    // Reload data nếu có đơn đặt phòng mới hoặc có ai đó vừa thanh toán
    if (notification.permission === "MANAGE_BOOKINGS" || notification.permission === "MANAGE_INVOICES") {
      fetchBookings(true);
    }
  });

  const openDrawer = (code) => {
    setSelectedBookingCode(code);
    setIsDrawerOpen(true);
  };

  // 🔥 THUẬT TOÁN LỌC THEO LUỒNG VẬN HÀNH THỰC TẾ CỦA KHÁCH SẠN
  const processedBookings = bookings
    .filter(b => {
      // 1. Lọc theo Tab Nghiệp vụ
      if (activeTab === 'ArrivalsToday') {
          // Khách có lịch nhận hôm nay (Tạm dùng createdAt vì DTO chưa có ExpectedCheckIn)
          return dayjs(b.createdAt).isSame(dayjs(), 'day') && (b.status === 'Confirmed' || b.status === 'Pending');
      }
      if (activeTab === 'InHouse') return b.status === 'Checked_in';
      if (activeTab === 'Upcoming') return b.status === 'Confirmed' && dayjs(b.createdAt).isAfter(dayjs(), 'day');
      if (activeTab === 'PendingPayment') return b.status === 'Pending';
      if (activeTab !== 'ALL' && b.status !== activeTab) return false;
      
      // 2. Lọc theo thanh tìm kiếm
      const searchLower = searchText.toLowerCase();
      return (
        b.bookingCode?.toLowerCase().includes(searchLower) ||
        b.guestName?.toLowerCase().includes(searchLower) ||
        b.guestPhone?.includes(searchText)
      );
    })
    .sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf());

  const renderStatus = (status) => {
    switch (status) {
      case 'Pending': return <Tag color="warning" icon={<ClockCounterClockwise/>}> Chờ tiền Online</Tag>;
      case 'Confirmed': return <Tag color="processing" icon={<CheckCircle/>}> Đã xác nhận</Tag>;
      case 'Checked_in': return <Tag color="success" icon={<DoorOpen/>}> Đang lưu trú</Tag>;
      case 'Completed': return <Tag color="default">Đã trả phòng</Tag>;
      case 'Cancelled': return <Tag color="error" icon={<XCircle/>}> Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã Đơn', dataIndex: 'bookingCode', key: 'code',
      render: (text, record) => {
        const isLocked = record.status === 'Cancelled' || record.status === 'Completed';
        return <Text strong style={{ color: isLocked ? LUXURY_COLORS.MUTED_BLUE : LUXURY_COLORS.NAVY, textDecoration: record.status === 'Cancelled' ? 'line-through' : 'none', fontSize: 15 }}>{text}</Text>
      }
    },
    {
      title: 'Khách hàng', key: 'guest',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: LUXURY_COLORS.DARKEST }}>{record.guestName || 'Khách vãng lai'}</Text>
          <Text type="secondary" style={{ fontSize: 13 }}>{record.guestPhone}</Text>
        </Space>
      )
    },
    {
      title: 'Thời gian thực tế', key: 'dates',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 13, color: LUXURY_COLORS.MUTED_BLUE }}>Vào: <Text strong style={{ color: LUXURY_COLORS.DARKEST }}>{record.actualCheckIn ? dayjs(record.actualCheckIn).format('DD/MM/YYYY HH:mm') : '---'}</Text></Text>
          <Text style={{ fontSize: 13, color: LUXURY_COLORS.MUTED_BLUE }}>Ra: <Text strong style={{ color: LUXURY_COLORS.DARKEST }}>{record.actualCheckOut ? dayjs(record.actualCheckOut).format('DD/MM/YYYY HH:mm') : '---'}</Text></Text>
        </Space>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center',
      render: (status) => renderStatus(status)
    },
    {
      title: 'Thao tác', key: 'actions', align: 'center', width: 180,
      render: (_, record) => (
        <Button type="primary" ghost icon={<Eye size={20} />} onClick={() => openDrawer(record.bookingCode)} style={{ borderColor: LUXURY_COLORS.LIGHT_BLUE, color: LUXURY_COLORS.WHITE, backgroundColor: LUXURY_COLORS.DARKEST }}>
           Chi tiết / Thu tiền
        </Button>
      )
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {contextHolder}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Title level={3} style={{ color: LUXURY_COLORS.DARKEST, margin: 0, fontWeight: 700 }}>Vận hành Đặt phòng & Thu ngân</Title>
        <Button type="primary" size="large" icon={<CalendarCheck size={20}/>} style={{ backgroundColor: LUXURY_COLORS.ACCENT_RED }} onClick={() => navigate('/admin/bookings/create')}>
           ĐẶT PHÒNG MỚI
        </Button>
      </div>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(13,24,33,0.05)', padding: screens.md ? 0 : '16px 0', backgroundColor: LUXURY_COLORS.WHITE }}>
        
        <div style={{ display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: screens.xs ? 'stretch' : 'center', marginBottom: 16, gap: 16, padding: screens.md ? '0' : '0 16px' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            style={{ flex: 1, width: '100%' }}
            items={[
              { key: 'ArrivalsToday', label: <span style={{ fontWeight: activeTab === 'ArrivalsToday' ? 600 : 400 }}>Đến hôm nay <Tag color={LUXURY_COLORS.ACCENT_RED} style={{ marginLeft: 4, borderRadius: 12 }}>{bookings.filter(b => dayjs(b.createdAt).isSame(dayjs(), 'day') && (b.status === 'Confirmed' || b.status === 'Pending')).length}</Tag></span> },
              { key: 'InHouse', label: <span style={{ fontWeight: activeTab === 'InHouse' ? 600 : 400 }}>Đang lưu trú</span> },
              { key: 'Upcoming', label: 'Sắp đến' },
              { key: 'PendingPayment', label: 'Chờ thanh toán Online' },
              { key: 'ALL', label: 'Tất cả' },
            ]}
          />
          <Input 
            placeholder="Tìm mã đơn, tên, SĐT..." 
            prefix={<MagnifyingGlass color={LUXURY_COLORS.MUTED_BLUE} />} 
            allowClear 
            onChange={e => setSearchText(e.target.value)}
            style={{ width: screens.xs ? '100%' : 300, borderColor: LUXURY_COLORS.LIGHT_BLUE }}
            size="large"
          />
        </div>

        {screens.md ? (
          <Table 
            columns={columns} dataSource={processedBookings} rowKey="id" loading={loading}
            pagination={{ pageSize: 10 }} rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
            {processedBookings.length === 0 ? <Empty description="Không có đơn nào phù hợp" /> : processedBookings.map(record => {
              const isLocked = record.status === 'Cancelled' || record.status === 'Completed';
              return (
                <div key={record.id} style={{ border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}`, borderRadius: 8, padding: 16, backgroundColor: isLocked ? LUXURY_COLORS.LIGHTEST : LUXURY_COLORS.WHITE, opacity: isLocked ? 0.7 : 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16, color: LUXURY_COLORS.NAVY, textDecoration: record.status === 'Cancelled' ? 'line-through' : 'none' }}>{record.bookingCode}</Text>
                    {renderStatus(record.status)}
                  </div>
                  <Space direction="vertical" size={2} style={{ width: '100%', marginBottom: 12 }}>
                    <Text strong style={{ color: LUXURY_COLORS.DARKEST }}>{record.guestName || 'Khách vãng lai'}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>SĐT: {record.guestPhone}</Text>
                  </Space>
                  <Divider style={{ margin: '8px 0', borderColor: LUXURY_COLORS.LIGHT_BLUE }} />
                  <Button type="primary" block ghost onClick={() => openDrawer(record.bookingCode)} style={{ borderColor: LUXURY_COLORS.NAVY, color: LUXURY_COLORS.NAVY }}>Chi tiết / Thu tiền</Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Component siêu ngăn kéo All-in-One mà chúng ta vừa làm */}
      <BookingDetailDrawer 
          isOpen={isDrawerOpen} 
          onClose={() => { setIsDrawerOpen(false); fetchBookings(true); }} 
          bookingCode={selectedBookingCode} 
      />

      <style>{`
        .ant-table-thead > tr > th { background-color: ${LUXURY_COLORS.LIGHTEST} !important; color: ${LUXURY_COLORS.DARKEST} !important; font-weight: 700 !important; }
        .table-row-light { background-color: #ffffff; }
        .table-row-dark { background-color: #f8fafc; }
        .ant-tabs-nav::before { border-bottom: 1px solid ${LUXURY_COLORS.LIGHT_BLUE} !important; }
        .ant-tabs-tab.ant-tabs-tab-active .ant-tabs-tab-btn { color: ${LUXURY_COLORS.NAVY} !important; }
        .ant-tabs-ink-bar { background-color: ${LUXURY_COLORS.NAVY} !important; }
      `}</style>
    </div>
  );
}
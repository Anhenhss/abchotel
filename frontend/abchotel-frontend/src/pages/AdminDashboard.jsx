import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Statistic, Table, Tag, Progress, Timeline, Space, Grid, Button, notification } from 'antd';
import { 
  Bed, Key, WarningCircle, CalendarCheck, ClockClockwise, Users, ArrowRight, Wallet, ArrowsClockwise 
} from '@phosphor-icons/react';
import dayjs from 'dayjs';

import axiosClient from '../api/axiosClient';
import { useAuthStore } from '../store/authStore';
import { COLORS } from '../constants/theme';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function AdminDashboard() {
  const screens = useBreakpoint();
  const { user } = useAuthStore();
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });
  const [loading, setLoading] = useState(true);

  // 🔥 XÓA MOCK DATA VÀ ĐƯA VỀ 0. Nếu API chạy đúng, số sẽ tự động nhảy!
  const [dashboardData, setDashboardData] = useState({
    stats: { revenue: 0, newBookings: 0, availableRooms: 0, pendingIssues: 0 },
    roomStatus: { total: 0, occupied: 0, available: 0, cleaning: 0, maintenance: 0 },
    recentBookings: [],
    activities: []
  });

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/Dashboard');
      const data = res.data || res; // Lấy data phòng trường hợp Axios trả về object bọc ngoài
      
      setDashboardData({
        // Hỗ trợ cả 2 trường hợp JSON trả về chữ thường (stats) hoặc chữ hoa (Stats)
        stats: data.stats || data.Stats || { revenue: 0, newBookings: 0, availableRooms: 0, pendingIssues: 0 },
        roomStatus: data.roomStatus || data.RoomStatus || { total: 0, occupied: 0, available: 0, cleaning: 0, maintenance: 0 },
        recentBookings: data.recentBookings || data.RecentBookings || [],
        activities: data.activities || data.Activities || []
      });
      
    } catch (error) {
      console.error("Lỗi lấy dữ liệu Dashboard", error);
      api.error({ message: 'Lỗi kết nối', description: 'Không thể lấy dữ liệu tổng quan. Vui lòng kiểm tra lại Backend.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getBookingStatusTag = (status) => {
    switch (status?.toUpperCase()) {
      case 'PENDING': return <Tag color="warning">Chờ nhận phòng</Tag>;
      case 'CHECKEDIN': return <Tag color="processing">Đang ở</Tag>;
      case 'CHECKEDOUT': return <Tag color="success">Đã trả phòng</Tag>;
      case 'CANCELLED': return <Tag color="error">Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, paddingBottom: 24 }}>
      {contextHolder}
      
      {/* 1. LỜI CHÀO & HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <Title level={2} style={{ color: COLORS.MIDNIGHT_BLUE, margin: '0 0 4px 0', fontFamily: '"Source Serif 4", serif' }}>
            Chào mừng trở lại, {user?.FullName || user?.name || 'Quản trị viên'} 👋
          </Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            Hôm nay là {dayjs().format('dddd, [ngày] DD [tháng] MM [năm] YYYY')}. Chúc bạn một ngày làm việc hiệu quả!
          </Text>
        </div>
        
        {/* 🔥 THÊM NÚT LÀM MỚI (REFRESH) */}
        <Button 
          type="primary" 
          size="large" 
          icon={<ArrowsClockwise size={20} />} 
          onClick={fetchDashboard} 
          loading={loading}
          style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }}
        >
          Làm mới
        </Button>
      </div>

      {/* 2. THẺ KPI (KEY PERFORMANCE INDICATORS) */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ borderRadius: 16, background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', color: '#fff', boxShadow: '0 4px 12px rgba(30,60,114,0.2)' }}>
            <Statistic 
              title={<span style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600 }}>DOANH THU THÁNG NÀY</span>} 
              value={dashboardData.stats.revenue || dashboardData.stats.Revenue || 0} 
              formatter={val => new Intl.NumberFormat('vi-VN').format(val)}
              suffix="₫"
              styles={{ content: { color: '#fff', fontWeight: 'bold', fontSize: 26 } }} 
              prefix={<Wallet size={28} weight="duotone" style={{ marginRight: 8, opacity: 0.8 }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title={<span style={{ color: COLORS.MUTED, fontSize: 14, fontWeight: 600 }}>ĐẶT PHÒNG MỚI (HÔM NAY)</span>} 
              value={dashboardData.stats.newBookings || dashboardData.stats.NewBookings || 0} 
              styles={{ content: { color: COLORS.DARKEST, fontWeight: 'bold', fontSize: 26 } }} 
              prefix={<CalendarCheck size={28} color="#1890ff" weight="duotone" style={{ marginRight: 8 }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title={<span style={{ color: COLORS.MUTED, fontSize: 14, fontWeight: 600 }}>PHÒNG SẴN SÀNG ĐÓN KHÁCH</span>} 
              value={dashboardData.stats.availableRooms || dashboardData.stats.AvailableRooms || 0} 
              styles={{ content: { color: '#52c41a', fontWeight: 'bold', fontSize: 26 } }} 
              prefix={<Key size={28} color="#52c41a" weight="duotone" style={{ marginRight: 8 }} />} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <Statistic 
              title={<span style={{ color: COLORS.MUTED, fontSize: 14, fontWeight: 600 }}>SỰ CỐ / HƯ HỎNG CHỜ XỬ LÝ</span>} 
              value={dashboardData.stats.pendingIssues || dashboardData.stats.PendingIssues || 0} 
              styles={{ content: { color: COLORS.ACCENT_RED, fontWeight: 'bold', fontSize: 26 } }} 
              prefix={<WarningCircle size={28} color={COLORS.ACCENT_RED} weight="duotone" style={{ marginRight: 8 }} />} 
            />
          </Card>
        </Col>
      </Row>

      {/* 3. KHU VỰC BIỂU ĐỒ & THỐNG KÊ CHI TIẾT */}
      <Row gutter={[24, 24]}>
        
        {/* CỘT TRÁI: BẢNG DANH SÁCH ĐẶT PHÒNG */}
        <Col xs={24} xl={16}>
          <Card 
            title={<Space><Users size={22} color={COLORS.MIDNIGHT_BLUE}/> <span style={{fontSize: 18, color: COLORS.MIDNIGHT_BLUE}}>Lịch đặt phòng mới nhất</span></Space>} 
            variant="borderless" 
            style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: '100%' }}
            extra={<a href="/admin/bookings" style={{ color: COLORS.ACCENT_RED, fontWeight: 600 }}>Xem tất cả <ArrowRight /></a>}
          >
            <Table 
              dataSource={dashboardData.recentBookings} 
              rowKey={record => record.id || record.Id} 
              pagination={false}
              loading={loading}
              scroll={{ x: 600 }}
              columns={[
                { title: 'Mã Đặt Phòng', render: (_, record) => <Text strong>{record.id || record.Id}</Text> },
                { title: 'Khách hàng', render: (_, record) => record.customer || record.Customer },
                { title: 'Phòng', render: (_, record) => <Tag color="blue">{record.room || record.Room}</Tag> },
                { title: 'Tổng tiền', align: 'right', render: (_, record) => <Text strong>{new Intl.NumberFormat('vi-VN').format(record.amount || record.Amount || 0)} ₫</Text> },
                { title: 'Trạng thái', align: 'center', render: (_, record) => getBookingStatusTag(record.status || record.Status) },
              ]}
            />
          </Card>
        </Col>

        {/* CỘT PHẢI: TRẠNG THÁI PHÒNG (Room Status) */}
        <Col xs={24} xl={8}>
          <Card 
            title={<Space><Bed size={22} color={COLORS.MIDNIGHT_BLUE}/> <span style={{fontSize: 18, color: COLORS.MIDNIGHT_BLUE}}>Công suất phòng</span></Space>} 
            variant="borderless" 
            style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)', height: '100%' }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <Progress 
                type="dashboard" 
                percent={dashboardData.roomStatus.total > 0 ? Math.round(( (dashboardData.roomStatus.occupied || dashboardData.roomStatus.Occupied || 0) / (dashboardData.roomStatus.total || dashboardData.roomStatus.Total || 1) ) * 100) : 0} 
                strokeColor={COLORS.MIDNIGHT_BLUE}
                size={180}
                format={percent => (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <span style={{ fontSize: 32, fontWeight: 'bold', color: COLORS.DARKEST }}>{percent}%</span>
                    <span style={{ fontSize: 14, color: COLORS.MUTED }}>Đang thuê</span>
                  </div>
                )}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text><Badge color="blue" /> Đang ở (Occupied)</Text>
                <Text strong>{dashboardData.roomStatus.occupied || dashboardData.roomStatus.Occupied || 0} phòng</Text>
              </div>
              <Progress percent={dashboardData.roomStatus.total > 0 ? Math.round(( (dashboardData.roomStatus.occupied || dashboardData.roomStatus.Occupied || 0) / (dashboardData.roomStatus.total || dashboardData.roomStatus.Total || 1) ) * 100) : 0} showInfo={false} strokeColor="#1890ff" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text><Badge color="green" /> Sẵn sàng đón khách</Text>
                <Text strong>{dashboardData.roomStatus.available || dashboardData.roomStatus.Available || 0} phòng</Text>
              </div>
              <Progress percent={dashboardData.roomStatus.total > 0 ? Math.round(( (dashboardData.roomStatus.available || dashboardData.roomStatus.Available || 0) / (dashboardData.roomStatus.total || dashboardData.roomStatus.Total || 1) ) * 100) : 0} showInfo={false} strokeColor="#52c41a" />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text><Badge color="orange" /> Đang dọn dẹp</Text>
                <Text strong>{dashboardData.roomStatus.cleaning || dashboardData.roomStatus.Cleaning || 0} phòng</Text>
              </div>
              <Progress percent={dashboardData.roomStatus.total > 0 ? Math.round(( (dashboardData.roomStatus.cleaning || dashboardData.roomStatus.Cleaning || 0) / (dashboardData.roomStatus.total || dashboardData.roomStatus.Total || 1) ) * 100) : 0} showInfo={false} strokeColor="#faad14" />
            </div>
          </Card>
        </Col>

      </Row>

      {/* 4. KHU VỰC HOẠT ĐỘNG GẦN ĐÂY */}
      <Card 
        title={<Space><ClockClockwise size={22} color={COLORS.MIDNIGHT_BLUE}/> <span style={{fontSize: 18, color: COLORS.MIDNIGHT_BLUE}}>Nhật ký hoạt động (Ghi nhận hư hỏng)</span></Space>} 
        variant="borderless" 
        style={{ borderRadius: 16, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}
      >
        <Timeline
          mode={screens.md ? "alternate" : "start"}
          items={dashboardData.activities.map(act => ({
            color: act.color || act.Color,
            content: (
              <>
                <Text strong style={{ display: 'block' }}>{act.desc || act.Desc}</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>{act.time || act.Time}</Text>
              </>
            ),
          }))}
        />
      </Card>

    </div>
  );
}

// Component phụ trợ nhỏ để tạo chấm màu
const Badge = ({ color }) => (
  <span style={{ display: 'inline-block', width: 10, height: 10, borderRadius: '50%', backgroundColor: color, marginRight: 8 }}></span>
);
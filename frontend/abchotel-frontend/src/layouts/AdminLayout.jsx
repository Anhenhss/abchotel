import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, notification, Space, Typography, Button, Popover, List } from 'antd';
import { 
  Users, Key, Bed, List as ListIcon, Article, BellRinging, SignOut, UserCircle, CaretDown, 
  House, SquaresFour, Archive, Star, MapPin, WarningCircle, Clock, ChartLineUp, Door, FileText, WifiHigh
} from '@phosphor-icons/react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSignalR } from '../hooks/useSignalR';
import { notificationApi } from '../api/notificationApi';
import logo from '../assets/logo.png';

const { Header, Sider, Content } = Layout;
const { Text, Title } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuthStore();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifs = async () => {
      try {
        const res = await notificationApi.getMyNotifications();
        setNotifications(res);
        setUnreadCount(res.filter(n => !n.isRead).length);
      } catch (error) { 
        console.log("Lỗi lấy thông báo:", error); 
      }
    };
    fetchNotifs();
  }, []);

  useSignalR((newNotif) => {
    setUnreadCount(prev => prev + 1); 
    setNotifications(prev => [{...newNotif, isRead: false, id: Date.now()}, ...prev].slice(0, 20));

    notification.info({
      message: newNotif.title || 'Thông báo hệ thống',
      description: newNotif.content,
      placement: 'topRight',
      icon: <BellRinging color={ACCENT_RED} weight="fill" />, 
      style: { borderLeft: `4px solid ${ACCENT_RED}` }
    });
  });

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({...n, isRead: true})));
    } catch (error) {
      console.log("Lỗi đánh dấu đã đọc", error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userMenuItems = [
    { key: 'profile', icon: <UserCircle size={18} />, label: 'Hồ sơ cá nhân', onClick: () => navigate('/admin/profile') },
    { type: 'divider' },
    { key: 'logout', icon: <SignOut size={18} color={ACCENT_RED} />, label: <span style={{ color: ACCENT_RED, fontWeight: 500 }}>Đăng xuất</span>, onClick: handleLogout },
  ];

  const notificationContent = (
    <div style={{ width: 340 }}>
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text strong style={{ fontSize: 15, color: MIDNIGHT_BLUE }}>Thông báo mới</Text>
        <Button type="link" size="small" onClick={handleMarkAllAsRead}>Đánh dấu đã đọc</Button>
      </div>
      
      {/* 🛡️ FIX Ở ĐÂY: Thêm max-height, thanh cuộn và cắt đúng 10 thông báo */}
      <div style={{ maxHeight: 380, overflowY: 'auto', padding: '0 4px' }} className="custom-sider-scroll">
        <List
          itemLayout="horizontal"
          dataSource={notifications.slice(0, 10)} // Chỉ lấy 10 cái mới nhất
          locale={{ emptyText: 'Không có thông báo mới' }}
          renderItem={item => (
            <List.Item style={{ padding: '12px 8px', cursor: 'pointer', transition: 'background 0.3s', opacity: item.isRead ? 0.6 : 1, borderBottom: '1px solid #f5f5f5' }} className="notif-item">
              <List.Item.Meta
                avatar={<Avatar style={{ backgroundColor: item.isRead ? '#f0f0f0' : '#ffe8eb', color: item.isRead ? '#bfbfbf' : ACCENT_RED }} icon={<BellRinging />} />}
                title={<Text strong style={{ fontSize: 13, color: item.isRead ? '#8c8c8c' : '#0F1A2B' }}>{item.title || 'Hệ thống'}</Text>}
                description={<Text style={{ fontSize: 12, color: item.isRead ? '#bfbfbf' : '#52677D' }} ellipsis={{ rows: 2 }}>{item.content}</Text>}
              />
            </List.Item>
          )}
        />
      </div>

      <div style={{ padding: '8px 12px', textAlign: 'center', borderTop: '1px solid #f0f0f0', backgroundColor: '#fafafa', borderRadius: '0 0 8px 8px' }}>
        <Button type="link" block onClick={() => navigate('/admin/audit-logs')} style={{ color: ACCENT_RED, fontWeight: 500 }}>
          Xem toàn bộ Lịch sử Hệ thống
        </Button>
      </div>
    </div>
  );

  const renderGroupTitle = (title) => collapsed ? <div style={{ borderBottom: '1px solid #52677D', margin: '16px 8px 8px 8px' }} /> : <span style={{ color: '#52677D', fontWeight: 600, fontSize: 12 }}>{title}</span>;

  const sidebarMenuItems = [
    { key: '/admin/dashboard', icon: <SquaresFour size={20} />, label: 'Tổng quan' },
    { key: 'grp_quy', label: renderGroupTitle('HỆ THỐNG & NHÂN SỰ'), type: 'group', children: [
      { key: '/admin/users', icon: <Users size={20} />, label: 'Người dùng' },
      { key: '/admin/roles', icon: <Key size={20} />, label: 'Vai trò & Quyền' },
    ]},
    { key: 'grp_nhung_thao', label: renderGroupTitle('QUẢN LÝ LƯU TRÚ'), type: 'group', children: [
      { key: '/admin/rooms', icon: <Bed size={20} />, label: 'Sơ đồ Phòng' },
      { key: '/admin/room-types', icon: <Door size={20} />, label: 'Loại phòng' },
      { key: '/admin/amenities', icon: <WifiHigh size={20} />, label: 'Tiện ích phòng' },
      { key: '/admin/inventory', icon: <Archive size={20} />, label: 'Kho vật tư' },
      { key: '/admin/loss-damages', icon: <WarningCircle size={20} />, label: 'Ghi nhận Hư hỏng' },
      { key: '/admin/reviews', icon: <Star size={20} />, label: 'Đánh giá từ khách' },
      { key: '/admin/attractions', icon: <MapPin size={20} />, label: 'Điểm du lịch' },
    ]},
    { key: 'grp_anh', label: renderGroupTitle('QUẢN LÝ NỘI DUNG'), type: 'group', children: [
      { key: '/admin/categories', icon: <FileText size={20} />, label: 'Danh mục' },
      { key: '/admin/articles', icon: <Article size={20} />, label: 'Bài viết & Blog' },
    ]},
    { key: 'grp_ly', label: renderGroupTitle('BÁO CÁO & GIÁM SÁT'), type: 'group', children: [
      { key: '/admin/shifts', icon: <Clock size={20} />, label: 'Chấm công ca làm' },
      { key: '/admin/performance', icon: <ChartLineUp size={20} />, label: 'KPI Nhân viên' },
      { key: '/admin/audit-logs', icon: <ListIcon size={20} />, label: 'Lịch sử hệ thống' },
    ]},
  ];

  return (
    <Layout style={{ minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        .custom-sider-scroll::-webkit-scrollbar { width: 4px; }
        .custom-sider-scroll::-webkit-scrollbar-thumb { background: #52677D; border-radius: 4px; }
        .notif-item:hover { background-color: #e9f0f8 !important; border-radius: 6px; }
        .ant-menu-dark .ant-menu-item-selected { background-color: ${ACCENT_RED} !important; border-radius: 8px !important; width: calc(100% - 16px) !important; margin: 4px 8px !important; }
        .ant-menu-dark .ant-menu-item:hover:not(.ant-menu-item-selected) { background-color: rgba(138, 21, 56, 0.2) !important; border-radius: 8px !important; width: calc(100% - 16px) !important; margin: 4px 8px !important; }
      `}</style>
      
      <Sider trigger={null} collapsible collapsed={collapsed} width={260} theme="dark" style={{ height: '100vh', borderRight: '1px solid #0F1A2B' }}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'flex-start', padding: collapsed ? '0' : '0 20px', borderBottom: '1px solid #1C2E4A', flexShrink: 0 }}>
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: collapsed ? 0 : 12 }}><img src={logo} alt="Logo" style={{ width: 24, height: 24, objectFit: 'contain' }} /></div>
            {!collapsed && <Title level={4} style={{ color: '#FFFFFF', margin: 0, fontFamily: '"Source Serif 4", serif', letterSpacing: '2px' }}>ABCHOTEL</Title>}
          </div>
          
          <div className="custom-sider-scroll" style={{ flex: 1, overflowY: 'auto' }}>
            <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={sidebarMenuItems} onClick={({ key }) => navigate(key)} style={{ paddingBottom: 20 }} />
          </div>

        </div>
      </Sider>

      <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <Header style={{ padding: '0 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderBottom: '1px solid #e9f0f8', flexShrink: 0 }}>
          <Space size="middle">
            <Button type="text" icon={<ListIcon size={24} color="#1C2E4A" />} onClick={() => setCollapsed(!collapsed)} />
            <Button type="text" icon={<House size={20} color="#52677D" />} onClick={() => navigate('/')} style={{ color: '#52677D', fontWeight: 500 }}>Về trang chủ</Button>
          </Space>
          <Space size="large">
            
            <Popover content={notificationContent} trigger="click" placement="bottomRight" arrow={false} overlayInnerStyle={{ padding: 0, borderRadius: 8, overflow: 'hidden' }}>
              <Badge count={unreadCount} overflowCount={99} color={ACCENT_RED}>
                <BellRinging size={24} color="#1C2E4A" weight="regular" style={{ cursor: 'pointer', marginTop: 4 }} onClick={() => setUnreadCount(0)} />
              </Badge>
            </Popover>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8 }}>
                <Avatar 
                  src={user?.avatarUrl} 
                  icon={!user?.avatarUrl && !user?.fullName ? <UserCircle /> : null} 
                  style={{ 
                    backgroundColor: user?.avatarUrl ? 'transparent' : '#e9f0f8', 
                    color: ACCENT_RED, 
                    fontWeight: 'bold',
                    border: '1px solid #e9f0f8'
                  }} 
                >
                  {!user?.avatarUrl && user?.fullName ? user.fullName.charAt(0).toUpperCase() : ''}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', lineHeight: '1.2' }}>
                  <Text style={{ color: '#0F1A2B', fontWeight: 600, fontSize: '14px' }}>{user?.fullName || 'Người dùng'}</Text>
                  <Text style={{ color: '#52677D', fontSize: '12px' }}>{user?.roleName || 'Guest'}</Text>
                </div>
                <CaretDown size={14} color="#0F1A2B" style={{ marginLeft: 4 }} />
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ flex: 1, margin: '24px', background: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflowY: 'auto' }}>
          <Outlet /> 
        </Content>
      </Layout>
    </Layout>
  );
}
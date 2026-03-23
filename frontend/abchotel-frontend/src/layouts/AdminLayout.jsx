import React, { useState, useEffect } from 'react';
import { Layout, Menu, Dropdown, Avatar, Badge, notification, Space, Typography } from 'antd';
import { 
  Users, Key, Bed, ListBullets, Article,
  BellRinging, SignOut, UserCircle, CaretDown 
} from '@phosphor-icons/react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
// import { useSignalR } from '../hooks/useSignalR'; // Kích hoạt sau khi làm xong file Hook

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  // 1. CHUÔNG THÔNG BÁO REALTIME (Góc trên)
  // useSignalR((newNotif) => {
  //   setUnreadCount(prev => prev + 1);
  //   // Dùng Notification của Ant Design hiện phía trên màn hình, KHÔNG dùng alert()
  //   notification.open({
  //     message: newNotif.title,
  //     description: newNotif.content,
  //     placement: 'top',
  //     icon: <BellRinging color="#52677D" weight="fill" />,
  //     style: { borderLeft: '4px solid #1C2E4A' }
  //   });
  // });

  // 2. DROPDOWN HỒ SƠ & ĐĂNG XUẤT
  const userMenuItems = [
    { key: 'profile', icon: <UserCircle size={18} />, label: 'Hồ sơ cá nhân' },
    { type: 'divider' },
    { key: 'logout', icon: <SignOut size={18} color="red" />, label: <span style={{ color: 'red' }}>Đăng xuất</span> },
  ];

  const handleUserMenuClick = ({ key }) => {
    if (key === 'profile') navigate('/admin/profile');
    if (key === 'logout') {
      // Logic xóa token ở LocalStorage sẽ viết sau
      console.log('Đã đăng xuất');
      navigate('/login');
    }
  };

  // 3. MENU SIDEBAR DÙNG CHUNG CHO CẢ TEAM
  const sidebarMenuItems = [
    { key: '/admin/users', icon: <Users size={20} />, label: 'Quản lý Nhân sự' },
    { key: '/admin/roles', icon: <Key size={20} />, label: 'Quyền hạn' },
    { key: '/admin/rooms', icon: <Bed size={20} />, label: 'Sơ đồ Phòng' }, // Của Nhung
    { key: '/admin/articles', icon: <Article size={20} />, label: 'Bài viết' }, // Của Ánh
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* THANH MENU BÊN TRÁI (SIDEBAR) */}
      <Sider width={250} theme="dark" breakpoint="lg" collapsedWidth="0">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid #1C2E4A' }}>
           <Text style={{ color: '#D1CFC9', fontSize: 24, fontWeight: 'bold', fontFamily: '"Source Serif 4", serif' }}>
             abchotel
           </Text>
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[location.pathname]} 
          items={sidebarMenuItems} 
          onClick={({ key }) => navigate(key)}
          style={{ marginTop: 16 }}
        />
      </Sider>

      <Layout>
        {/* HEADER DÙNG CHUNG */}
        <Header style={{ padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderBottom: '1px solid #e9f0f8', boxShadow: '0 1px 4px rgba(0,21,41,0.08)' }}>
          <Space size="large">
            {/* Chuông thông báo */}
            <Badge count={unreadCount} overflowCount={99} size="small">
              <BellRinging size={24} color="#1C2E4A" weight="regular" style={{ cursor: 'pointer', marginTop: 4 }} />
            </Badge>
            
            {/* Avatar và Tên tài khoản có mũi tên thả xuống */}
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight" arrow>
              <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: 8, transition: 'background 0.3s' }} className="user-dropdown">
                <Avatar icon={<UserCircle />} style={{ backgroundColor: '#52677D' }} />
                <Text style={{ color: '#0F1A2B', fontWeight: 600 }}>Admin Quý</Text>
                <CaretDown size={14} color="#0F1A2B" />
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* NỘI DUNG TỪNG TRANG (SẼ ĐƯỢC BƠM VÀO ĐÂY) */}
        <Content style={{ margin: '24px', background: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', overflow: 'auto' }}>
          <Outlet /> 
        </Content>
      </Layout>
    </Layout>
  );
}
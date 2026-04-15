import React, { useState, useEffect } from 'react';
import { Layout, Menu, Button, Space, Typography, Dropdown, Avatar, Badge, Popover, Drawer, Grid, List } from 'antd';
import { 
  UserCircle, BellRinging, List as ListIcon, SignOut, CalendarCheck, 
  MapPin, Phone, EnvelopeSimple, FacebookLogo, InstagramLogo, TiktokLogo,
  Bed, Coffee, Ticket, Article, House
} from '@phosphor-icons/react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useSignalR } from '../hooks/useSignalR';
import { notificationApi } from '../api/notificationApi';
import logo from '../assets/logo.png'; // Đảm bảo em có logo này

const { Header, Content, Footer } = Layout;
const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

// BẢNG MÀU LUXURY CỦA QUÝ
const THEME = {
  NAVY_DARK: '#0D1821',
  NAVY_LIGHT: '#1C2E4A',
  DARK_RED: '#8A1538',
  GOLD: '#D4AF37', // Thêm chút màu Vàng Gold cho Luxury
  WHITE: '#FFFFFF',
  GRAY_LIGHT: '#F8FAFC'
};

export default function ClientLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const screens = useBreakpoint();
  const isMobile = !screens.lg;

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Realtime Notifications
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Bắt sự kiện cuộn chuột để làm Header Glassmorphism
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch Thông báo
  useEffect(() => {
    if (isAuthenticated) {
      notificationApi.getMyNotifications().then(res => {
        setNotifications(res);
        setUnreadCount(res.filter(n => !n.isRead).length);
      }).catch(e => console.log(e));
    }
  }, [isAuthenticated]);

  useSignalR((newNotif) => {
    if (!isAuthenticated) return;
    setUnreadCount(prev => prev + 1);
    setNotifications(prev => [{ ...newNotif, isRead: false, id: Date.now() }, ...prev].slice(0, 10));
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ===================== DATA MENU =====================
  const menuItems = [
    { key: '/', icon: <House size={20} />, label: 'TRANG CHỦ' },
    { key: '/rooms', icon: <Bed size={20} />, label: 'PHÒNG & SUITES' },
    { key: '/services', icon: <Coffee size={20} />, label: 'DỊCH VỤ' },
    { key: '/offers', icon: <Ticket size={20} />, label: 'ƯU ĐÃI' },
    { key: '/blog', icon: <Article size={20} />, label: 'TIN TỨC' },
  ];

  const userDropdownItems = [
    { key: 'profile', icon: <UserCircle size={18} />, label: 'Hồ sơ cá nhân', onClick: () => navigate('/profile') },
    { key: 'my-bookings', icon: <CalendarCheck size={18} />, label: 'Lịch sử đặt phòng', onClick: () => navigate('/my-bookings') },
    { type: 'divider' },
    { key: 'logout', icon: <SignOut size={18} color={THEME.DARK_RED} />, label: <span style={{ color: THEME.DARK_RED, fontWeight: 500 }}>Đăng xuất</span>, onClick: handleLogout },
  ];

  // ===================== RENDER HEADER =====================
  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: THEME.WHITE }}>
      
      {/* HIỆU ỨNG CSS LUXURY */}
      <style>{`
        .client-header {
          transition: all 0.3s ease;
          position: fixed;
          top: 0;
          width: 100%;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 5%;
        }
        .header-transparent { background: transparent; box-shadow: none; }
        .header-solid { 
          background: rgba(255, 255, 255, 0.95); 
          backdrop-filter: blur(10px); 
          box-shadow: 0 4px 20px rgba(0,0,0,0.05); 
        }
        .client-menu { background: transparent !important; border-bottom: none !important; flex: 1; justify-content: center; }
        .client-menu .ant-menu-item { font-family: "Source Serif 4", serif; font-weight: 600; letter-spacing: 1px; }
        .client-menu .ant-menu-item:hover::after, .client-menu .ant-menu-item-selected::after {
          border-bottom-color: ${THEME.DARK_RED} !important;
        }
        .client-menu .ant-menu-item-selected { color: ${THEME.DARK_RED} !important; }
        .btn-luxury { background-color: ${THEME.NAVY_DARK}; color: white; border-radius: 0; letter-spacing: 2px; font-family: "Source Serif 4", serif; transition: 0.3s; }
        .btn-luxury:hover { background-color: ${THEME.DARK_RED} !important; color: white !important; }
      `}</style>

      {/* HEADER CHÍNH */}
      <Header className={`client-header ${scrolled ? 'header-solid' : 'header-transparent'}`}>
        
        {/* LOGO TRÁI */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={logo} alt="Logo" style={{ height: 40, marginRight: 12 }} />
          <Title level={3} style={{ margin: 0, color: scrolled ? THEME.NAVY_DARK : (isMobile ? THEME.NAVY_DARK : THEME.DARK_RED), fontFamily: '"Source Serif 4", serif', letterSpacing: '3px' }}>
            ABCHOTEL
          </Title>
        </div>

        {/* MENU GIỮA (Chỉ hiện trên Desktop) */}
        {!isMobile && (
          <Menu 
            mode="horizontal" 
            selectedKeys={[location.pathname]} 
            items={menuItems} 
            className="client-menu"
            onClick={({key}) => navigate(key)}
            style={{ color: scrolled ? THEME.NAVY_DARK : '#000' }}
          />
        )}

        {/* TOOLBAR PHẢI (User, Bell, Nút Đặt phòng) */}
        <Space size="large" align="center">
          
          {/* Nút Đặt phòng ngay */}
          {!isMobile && (
            <Button className="btn-luxury" size="large" onClick={() => navigate('/booking')}>
              ĐẶT PHÒNG NGAY
            </Button>
          )}

          {/* Icon Menu Mobile */}
          {isMobile && (
            <ListIcon size={28} color={scrolled ? THEME.NAVY_DARK : '#000'} onClick={() => setMobileMenuOpen(true)} />
          )}

          {/* NẾU ĐÃ ĐĂNG NHẬP */}
          {isAuthenticated ? (
            <Space size="middle">
              {!isMobile && (
                <Popover content={<div style={{ width: 300, padding: 10 }}><i>Chức năng thông báo đang hoàn thiện...</i></div>} trigger="click" placement="bottomRight">
                  <Badge count={unreadCount} color={THEME.DARK_RED}>
                    <BellRinging size={24} color={scrolled ? THEME.NAVY_DARK : '#000'} style={{ cursor: 'pointer' }} />
                  </Badge>
                </Popover>
              )}
              
              <Dropdown menu={{ items: userDropdownItems }} placement="bottomRight" arrow>
                <Avatar 
                  style={{ cursor: 'pointer', backgroundColor: THEME.NAVY_LIGHT, border: `2px solid ${THEME.GOLD}` }}
                  src={user?.avatarUrl}
                  icon={!user?.avatarUrl ? <UserCircle size={24} /> : null}
                />
              </Dropdown>
            </Space>
          ) : (
            /* NẾU CHƯA ĐĂNG NHẬP */
            !isMobile && (
              <Space>
                <Button type="text" style={{ color: scrolled ? THEME.NAVY_DARK : '#000', fontWeight: 600 }} onClick={() => navigate('/login')}>Đăng nhập</Button>
                <Button style={{ borderColor: THEME.DARK_RED, color: THEME.DARK_RED, borderRadius: 0 }} onClick={() => navigate('/register')}>Đăng ký</Button>
              </Space>
            )
          )}
        </Space>
      </Header>

      {/* MENU NGĂN KÉO CHO MOBILE */}
      <Drawer title="ABCHOTEL" placement="left" onClose={() => setMobileMenuOpen(false)} open={mobileMenuOpen}>
        <Menu mode="vertical" items={menuItems} onClick={({key}) => { navigate(key); setMobileMenuOpen(false); }} style={{ borderRight: 'none' }} />
        {!isAuthenticated ? (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Button block onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Đăng nhập</Button>
            <Button block type="primary" style={{ backgroundColor: THEME.DARK_RED }} onClick={() => { navigate('/register'); setMobileMenuOpen(false); }}>Đăng ký</Button>
          </div>
        ) : (
          <Button block type="primary" danger style={{ marginTop: 20 }} onClick={() => { handleLogout(); setMobileMenuOpen(false); }}>Đăng xuất</Button>
        )}
      </Drawer>

      {/* ===================== PHẦN NỘI DUNG ĐỘNG (OUTLET) ===================== */}
      {/* paddingTop: 80px để nội dung không bị Header che mất */}
      <Content style={{ paddingTop: 80, minHeight: '80vh' }}>
        <Outlet />
      </Content>

      {/* ===================== RENDER FOOTER LUXURY ===================== */}
      <Footer style={{ backgroundColor: THEME.NAVY_DARK, color: '#fff', padding: '60px 5% 20px 5%', marginTop: 40 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: '40px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 40 }}>
          
          {/* CỘT 1: THƯƠNG HIỆU */}
          <div style={{ flex: '1 1 250px' }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 20 }}>
              <img src={logo} alt="Logo" style={{ height: 40, filter: 'brightness(0) invert(1)', marginRight: 12 }} />
              <Title level={3} style={{ margin: 0, color: '#fff', fontFamily: '"Source Serif 4", serif', letterSpacing: '2px' }}>ABCHOTEL</Title>
            </div>
            <Text style={{ color: '#A0AABF', display: 'block', marginBottom: 20, lineHeight: 1.8 }}>
              Trải nghiệm kỳ nghỉ hoàn hảo với sự sang trọng, tinh tế và dịch vụ đẳng cấp 5 sao ngay tại trung tâm thành phố.
            </Text>
            <Space size="large">
              <FacebookLogo size={28} color="#fff" style={{ cursor: 'pointer' }} />
              <InstagramLogo size={28} color="#fff" style={{ cursor: 'pointer' }} />
              <TiktokLogo size={28} color="#fff" style={{ cursor: 'pointer' }} />
            </Space>
          </div>

          {/* CỘT 2: LIÊN KẾT */}
          <div style={{ flex: '1 1 150px' }}>
            <Title level={5} style={{ color: THEME.GOLD, letterSpacing: '1px', marginBottom: 20 }}>KHÁM PHÁ</Title>
            <Space direction="vertical" size="middle">
              <Link to="/rooms" style={{ color: '#A0AABF' }}>Phòng & Suites</Link>
              <Link to="/about" style={{ color: '#A0AABF' }}>Về chúng tôi</Link> 
              <Link to="/contact" style={{ color: '#A0AABF' }}>Liên hệ</Link>
              <Link to="/privacy-policy" style={{ color: '#A0AABF' }}>Chính sách & Điều khoản</Link>
              <Link to="/blog" style={{ color: '#A0AABF' }}>Cẩm nang du lịch</Link>
            </Space>
          </div>

          {/* CỘT 3: THÔNG TIN LIÊN HỆ */}
          <div style={{ flex: '1 1 250px' }}>
            <Title level={5} style={{ color: THEME.GOLD, letterSpacing: '1px', marginBottom: 20 }}>LIÊN HỆ</Title>
            <Space direction="vertical" size="middle" style={{ color: '#A0AABF' }}>
              <Space><MapPin size={20} color={THEME.DARK_RED}/> 123 Nguyễn Văn Linh, Đà Nẵng, VN</Space>
              <Space><Phone size={20} color={THEME.DARK_RED}/> +84 236 123 4567</Space>
              <Space><EnvelopeSimple size={20} color={THEME.DARK_RED}/> booking@abchotel.com</Space>
            </Space>
          </div>

        </div>

        {/* BẢN QUYỀN */}
        <div style={{ textAlign: 'center', paddingTop: 20 }}>
          <Text style={{ color: '#6A7A92', fontSize: 13 }}>
            © {new Date().getFullYear()} ABCHOTEL. Lập trình bởi Viên Xuân Quý. All rights reserved.
          </Text>
        </div>
      </Footer>
    </Layout>
  );
}
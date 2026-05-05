import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, Spin, Tag, Input, ConfigProvider, Divider, notification } from 'antd';
import { 
  MagnifyingGlass, Crown, Sparkle, CaretRight, BellRinging, Diamond,
  Coffee, ForkKnife, BeerStein, Car, Martini, Campfire, 
  Bicycle, Waves, Scissors, Pill, Leaf, Calendar
} from '@phosphor-icons/react';
import { serviceApi } from '../../api/serviceApi';
import * as signalR from '@microsoft/signalr';

const { Title, Text, Paragraph } = Typography;

const THEME = {
  NAVY_DARK: '#0D1821',
  GOLD: '#D4AF37',
  GOLD_BRIGHT: '#F3E5AB',
  GOLD_SOFT: 'rgba(212, 175, 55, 0.1)',
  SLATE: '#64748b',
  WHITE: '#FFFFFF',
  BG_SOFT: '#F8FAFC',
};

export default function ClientServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(null);

  // Tách hàm load dữ liệu ra để có thể gọi lại từ SignalR
  const loadData = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      if (serviceApi) {
        const [s, c] = await Promise.all([
          serviceApi.getServices(true), 
          serviceApi.getCategories()
        ]);
        const activeCats = Array.isArray(c) ? c : [];
        setServices(Array.isArray(s) ? s : []);
        setCategories(activeCats);
        if (activeCats.length > 0 && isInitial) setActiveCat(activeCats[0].id);
      }
    } catch (e) { 
      console.error("Lỗi tải dữ liệu", e); 
    } finally { 
      if (isInitial) setLoading(false); 
    }
  }, []);

  // Effect kết nối SignalR
  useEffect(() => {
    const token = localStorage.getItem('token');
    const connection = new signalR.HubConnectionBuilder()
      .withUrl("https://localhost:5035/notificationHub", {
        accessTokenFactory: () => token
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        // Lắng nghe sự kiện từ Backend
        connection.on("ReceiveNotification", (msg) => {
          notification.open({
            message: <span style={{ color: THEME.GOLD, fontWeight: 'bold' }}>Elite Concierge</span>,
            description: msg,
            icon: <BellRinging weight="fill" color={THEME.GOLD} />,
            placement: 'bottomRight',
            className: 'luxury-notification'
          });

          // QUAN TRỌNG: Gọi lại hàm loadData để cập nhật danh sách dịch vụ ngay lập tức
          loadData(false); 
        });
      })
      .catch(err => console.error("SignalR Connection Error: ", err));

    return () => { connection.stop(); };
  }, [loadData]); // Thêm loadData vào dependency để đảm bảo SignalR dùng hàm mới nhất

  // Load dữ liệu lần đầu khi vào trang
  useEffect(() => {
    loadData(true);
  }, [loadData]);

  const getServiceIcon = (name) => {
    const n = name.toLowerCase();
    if (n.includes('buffet') || n.includes('ăn') || n.includes('sáng')) return <ForkKnife size={48} weight="duotone" />;
    if (n.includes('uống') || n.includes('cafe') || n.includes('cà phê')) return <Coffee size={48} weight="duotone" />;
    if (n.includes('rượu') || n.includes('bar') || n.includes('cocktail')) return <Martini size={48} weight="duotone" />;
    if (n.includes('spa') || n.includes('massage') || n.includes('thư giãn')) return <Leaf size={48} weight="duotone" />;
    if (n.includes('xe') || n.includes('vận chuyển') || n.includes('đưa đón')) return <Car size={48} weight="duotone" />;
    if (n.includes('biển') || n.includes('bơi') || n.includes('tắm')) return <Waves size={48} weight="duotone" />;
    if (n.includes('gym') || n.includes('thể thao')) return <Bicycle size={48} weight="duotone" />;
    if (n.includes('tiệc') || n.includes('sự kiện')) return <Calendar size={48} weight="duotone" />;
    
    return <Sparkle size={48} weight="duotone" />;
  };

  const scrollToCategory = (id) => {
    setActiveCat(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const offset = 100;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div className="elite-loader">
      <div className="loader-diamond"></div>
      <Text style={{ marginTop: 24, color: THEME.GOLD, letterSpacing: 8, fontSize: 12, fontWeight: 300 }}>ELITE SERVICES</Text>
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { fontFamily: '"Source Serif 4", serif' } }}>
      <div style={{ minHeight: '100vh', background: THEME.BG_SOFT }}>
        
        <section className="hero-banner">
          <img 
            src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2000&q=80" 
            className="hero-media"
            alt="Luxury Hotel"
          />
          <div className="hero-overlay"></div>
          
          <div className="hero-content">
            <div className="floating-crown">
                <Crown size={32} weight="fill" color={THEME.GOLD} />
            </div>
            <Text className="hero-subtitle">BEYOND EXPECTATIONS</Text>
            <Title className="hero-title">
              Trải Nghiệm <span className="shimmer-gold">Đặc Quyền</span>
            </Title>
            <div className="hero-search-bar">
              <MagnifyingGlass size={22} color={THEME.GOLD} weight="bold" />
              <input 
                placeholder="Tìm kiếm dịch vụ quý khách mong muốn..." 
                onChange={e => setSearch(e.target.value)} 
                className="hero-search-input-native"
              />
            </div>
          </div>
        </section>

        <div className="content-wrapper">
          <Row gutter={[60, 0]}>
            <Col xs={24} md={7} lg={6}>
              <div className="sidebar-container">
                <div className="sidebar-label-group">
                  <div className="label-line"></div>
                  <Text className="sidebar-label">Danh Mục</Text>
                </div>
                
                <nav className="sidebar-nav">
                  {categories.map(cat => (
                    <div 
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className={`nav-item ${activeCat === cat.id ? 'active' : ''}`}
                    >
                      <span className="nav-text">{cat.name}</span>
                      <span className="nav-count">{services.filter(s => s.categoryId === cat.id).length}</span>
                    </div>
                  ))}
                </nav>
              </div>
            </Col>

            <Col xs={24} md={17} lg={18}>
              {categories.map((cat) => {
                const filtered = services.filter(s => s.categoryId === cat.id && s.name.toLowerCase().includes(search.toLowerCase()));
                if (filtered.length === 0) return null;

                return (
                  <div key={cat.id} id={`category-${cat.id}`} className="service-group">
                    <div className="group-header">
                      <Title level={2} className="group-title">{cat.name}</Title>
                      <div className="group-divider"></div>
                    </div>

                    <Row gutter={[30, 40]}>
                      {filtered.map(svc => (
                        <Col xs={24} sm={12} xl={8} key={svc.id}>
                          <div className="service-card-premium">
                            <div className="card-image-placeholder">
                                <div className="icon-bg-circle"></div>
                                <div className="icon-wrapper">
                                  {getServiceIcon(svc.name)}
                                </div>
                            </div>
                            <div className="card-body">
                              <div className="card-top-info">
                                <Tag className="card-tag">PREMIUM</Tag>
                                <Sparkle size={16} color={THEME.GOLD} weight="fill" />
                              </div>
                              <Title level={4} className="card-title">{svc.name}</Title>
                              <Paragraph className="card-desc" ellipsis={{ rows: 2 }}>
                                {svc.description ? svc.description.replace(/<[^>]*>/g, '') : 'Trải nghiệm tinh hoa dịch vụ được thiết kế riêng cho kỳ nghỉ của bạn.'}
                              </Paragraph>
                              <div className="card-footer">
                                <div className="card-price">
                                  <span className="price-label">Giá từ</span>
                                  <div>
                                    <span className="price-num">{svc.price?.toLocaleString()}</span>
                                    <span className="price-unit">VND</span>
                                  </div>
                                </div>
                                <div className="card-action-btn">
                                    <CaretRight size={18} weight="bold" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </Col>
                      ))}
                    </Row>
                  </div>
                );
              })}
            </Col>
          </Row>
        </div>

        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@300;400;600;700&family=Inter:wght@300;400;500&display=swap');
          
          body { overflow-x: hidden; }

          .hero-banner { 
            height: 550px; background: #000; position: relative; 
            display: flex; align-items: center; justify-content: center; overflow: hidden;
          }
          .hero-media { position: absolute; width: 100%; height: 100%; object-fit: cover; top: 0; left: 0; z-index: 0; filter: brightness(0.8) contrast(1.1); transform: scale(1.05); animation: slowZoom 20s infinite alternate; }
          @keyframes slowZoom { from { transform: scale(1); } to { transform: scale(1.15); } }
          
          .hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(13,24,33,0.8), rgba(13,24,33,0.2), rgba(248,250,252,1)); z-index: 1; }
          .hero-content { position: relative; z-index: 2; text-align: center; width: 100%; top: -20px; }
          .hero-subtitle { color: ${THEME.GOLD}; letter-spacing: 8px; font-size: 13px; font-weight: 600; display: block; margin-bottom: 10px; }
          .hero-title { color: white !important; font-size: 72px !important; margin: 0 0 40px !important; font-weight: 700 !important; }
          
          .floating-crown { animation: float 3s ease-in-out infinite; margin-bottom: 10px; }
          @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

          .shimmer-gold {
            display: inline-block;
            background: linear-gradient(to right, #BF953F, #FCF6BA, #B38728, #FBF5B7, #AA771C);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 200% auto;
            animation: shimmer-effect 4s infinite linear;
          }
          @keyframes shimmer-effect { to { background-position: 200% center; } }
          
          .hero-search-bar {
            max-width: 650px; margin: 0 auto; background: rgba(255,255,255,0.08);
            backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.2);
            border-radius: 100px; padding: 15px 35px; display: flex; align-items: center; gap: 15px;
            box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5); transition: 0.3s;
          }
          .hero-search-bar:focus-within { background: rgba(255,255,255,0.15); border-color: ${THEME.GOLD}; transform: scale(1.02); }
          .hero-search-input-native { background: transparent; border: none; outline: none; color: white; width: 100%; font-size: 18px; font-family: 'Inter', sans-serif; }
          .hero-search-input-native::placeholder { color: rgba(255,255,255,0.5); }

          .content-wrapper { max-width: 1400px; margin: 0 auto; padding: 0 24px 100px; }
          .sidebar-container { position: sticky; top: 100px; }
          .sidebar-nav { background: white; padding: 10px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.03); }
          .nav-item { padding: 18px 25px; cursor: pointer; display: flex; align-items: center; justify-content: space-between; border-radius: 15px; margin-bottom: 5px; transition: 0.3s; }
          .nav-item:hover { background: ${THEME.BG_SOFT}; }
          .nav-item.active { background: ${THEME.NAVY_DARK}; box-shadow: 0 10px 20px rgba(13,24,33,0.2); }
          .nav-item.active .nav-text { color: ${THEME.GOLD}; font-weight: 600; }
          .nav-item.active .nav-count { background: ${THEME.GOLD}; color: ${THEME.NAVY_DARK}; }
          .nav-text { font-size: 15px; color: #475569; font-family: 'Inter', sans-serif; }
          .nav-count { font-size: 10px; padding: 2px 8px; border-radius: 20px; background: #f1f5f9; color: #94a3b8; font-weight: 700; }

          .service-card-premium { 
            background: white; border-radius: 24px; overflow: hidden;
            transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1); height: 100%; display: flex; flex-direction: column; 
            border: 1px solid rgba(0,0,0,0.03); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);
          }
          .card-image-placeholder { 
            height: 200px; background: #0D1821; 
            display: flex; align-items: center; justify-content: center; position: relative;
            overflow: hidden;
          }
          .icon-bg-circle {
            position: absolute; width: 120px; height: 120px; background: radial-gradient(circle, ${THEME.GOLD_SOFT} 0%, transparent 70%);
            border-radius: 50%; opacity: 0.5; transition: 0.5s;
          }
          .icon-wrapper { color: ${THEME.GOLD}; z-index: 1; transition: 0.5s; filter: drop-shadow(0 0 10px rgba(212,175,55,0.3)); }
          
          .service-card-premium:hover { transform: translateY(-15px); box-shadow: 0 30px 60px -12px rgba(13,24,33,0.15); }
          .service-card-premium:hover .icon-wrapper { transform: scale(1.2); color: white; }
          .service-card-premium:hover .icon-bg-circle { transform: scale(2); opacity: 0.2; background: ${THEME.GOLD}; }
          .service-card-premium:hover .card-image-placeholder { background: ${THEME.GOLD}; }

          .card-body { padding: 30px; flex: 1; display: flex; flex-direction: column; }
          .card-top-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
          .card-tag { background: ${THEME.GOLD_SOFT}; border: none; color: ${THEME.GOLD}; font-size: 10px; font-weight: 700; letter-spacing: 1px; padding: 4px 12px; border-radius: 4px; }
          .card-title { margin-bottom: 15px !important; font-size: 22px !important; color: ${THEME.NAVY_DARK} !important; letter-spacing: -0.5px; }
          .card-desc { color: ${THEME.SLATE}; font-size: 14px; line-height: 1.6; margin-bottom: 30px !important; font-family: 'Inter', sans-serif; }
          
          .card-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; }
          .price-label { display: block; font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 4px; }
          .price-num { font-size: 26px; font-weight: 700; color: ${THEME.NAVY_DARK}; font-family: 'Source Serif 4'; }
          .price-unit { font-size: 12px; color: ${THEME.SLATE}; margin-left: 4px; font-weight: 500; }
          
          .card-action-btn { 
            width: 45px; height: 45px; background: ${THEME.BG_SOFT}; border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; color: ${THEME.NAVY_DARK};
            transition: 0.3s;
          }
          .service-card-premium:hover .card-action-btn { background: ${THEME.GOLD}; color: white; transform: rotate(-45deg); }

          .group-title { font-size: 32px !important; margin-bottom: 10px !important; position: relative; display: inline-block; }
          .group-divider { height: 4px; width: 60px; background: ${THEME.GOLD}; border-radius: 2px; margin-bottom: 40px; }
          .service-group { margin-bottom: 80px; }

          .elite-loader { height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; background: ${THEME.NAVY_DARK}; }
          .loader-diamond { width: 50px; height: 50px; border: 1px solid ${THEME.GOLD}; transform: rotate(45deg); position: relative; animation: diamondRotate 2s infinite ease-in-out; }
          @keyframes diamondRotate { 0% { transform: rotate(45deg) scale(1); border-color: ${THEME.GOLD}; } 50% { transform: rotate(225deg) scale(1.2); border-color: white; } 100% { transform: rotate(405deg) scale(1); border-color: ${THEME.GOLD}; } }
          
          @media (max-width: 768px) {
            .hero-title { font-size: 48px !important; }
            .hero-banner { height: 450px; }
            .sidebar-nav { display: flex; flex-direction: row; overflow-x: auto; white-space: nowrap; gap: 10px; background: transparent; box-shadow: none; padding: 0; }
            .nav-item { flex: 0 0 auto; background: white; margin-bottom: 0; }
          }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
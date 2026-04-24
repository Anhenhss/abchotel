import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin, Tag, Input, ConfigProvider, Divider, List, notification } from 'antd';
import { MagnifyingGlass, Crown, Sparkle, ArrowUpRight, CaretRight, BellRinging } from '@phosphor-icons/react';
import { serviceApi } from '../../api/serviceApi';
import * as signalR from '@microsoft/signalr';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;

const THEME = {
  NAVY_DARK: '#0D1821',
  GOLD: '#D4AF37',
  WHITE: '#FFFFFF',
  GRAY_BG: '#F8FAFC'
};

export default function ClientServicesPage() {
  const [services, setServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState(null);

  // 1. KẾT NỐI SIGNALR REALTIME
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
        connection.on("ReceiveNotification", (msg) => {
          notification.open({
            message: 'Thông báo dịch vụ',
            description: msg,
            icon: <BellRinging weight="fill" color={THEME.GOLD} />,
            placement: 'bottomRight',
            style: { borderRadius: '8px', borderLeft: `4px solid ${THEME.GOLD}` }
          });
        });
      })
      .catch(err => console.error("SignalR Connection Error: ", err));

    return () => { connection.stop(); };
  }, []);

  // 2. TẢI DỮ LIỆU
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (serviceApi) {
          const [s, c] = await Promise.all([serviceApi.getServices(true), serviceApi.getCategories()]);
          const activeCats = Array.isArray(c) ? c : [];
          setServices(Array.isArray(s) ? s : []);
          setCategories(activeCats);
          if (activeCats.length > 0) setActiveCat(activeCats[0].id);
        }
      } catch (e) { console.error("Lỗi tải dữ liệu"); }
      finally { setLoading(false); }
    };
    loadData();
  }, []);

  const scrollToCategory = (id) => {
    setActiveCat(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
  };

  if (loading) return (
    <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <Spin size="large" tip="Đang chuẩn bị không gian Elite..." />
    </div>
  );

  return (
    <ConfigProvider theme={{ token: { fontFamily: '"Source Serif 4", serif' } }}>
      <div style={{ minHeight: '100vh', background: THEME.WHITE }}>
        
        <section className="banner-section">
          <div className="banner-overlay"></div>
          <div className="banner-content">
            <Title className="banner-title">NGHỆ THUẬT <span style={{ color: THEME.GOLD }}>PHỤC VỤ</span></Title>
            <div className="search-container">
              <MagnifyingGlass size={20} color="white" />
              <Input placeholder="Tìm kiếm dịch vụ..." variant="borderless" onChange={e => setSearch(e.target.value)} style={{ color: 'white' }} />
            </div>
          </div>
        </section>

        <div className="main-container">
          <Row gutter={[40, 0]}>
            
            {/* SIDEBAR / MOBILE NAV */}
            <Col xs={24} md={6} lg={5}>
              <div className="sticky-sidebar">
                <div className="sidebar-header">
                  <Text strong style={{ letterSpacing: 2, color: '#94a3b8', fontSize: 11 }}>DANH MỤC DỊCH VỤ</Text>
                </div>
                <div className="category-list-wrapper">
                  {categories.map(cat => (
                    <div 
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className={`sidebar-item ${activeCat === cat.id ? 'active' : ''}`}
                    >
                      <span className="dot"></span>
                      <span className="cat-name">{cat.name.toUpperCase()}</span>
                      <CaretRight size={14} className="arrow" />
                    </div>
                  ))}
                </div>
              </div>
            </Col>

            {/* SERVICE LIST */}
            <Col xs={24} md={18} lg={19}>
              {categories.map((cat) => {
                const filtered = services.filter(s => s.categoryId === cat.id && s.name.toLowerCase().includes(search.toLowerCase()));
                if (filtered.length === 0) return null;

                return (
                  <div key={cat.id} id={`category-${cat.id}`} className="category-block">
                    <div className="category-title-row">
                      <Title level={3} className="category-name-text">{cat.name}</Title>
                      <div className="title-line"></div>
                      <Sparkle size={20} color={THEME.GOLD} weight="fill" />
                    </div>

                    <Row gutter={[24, 24]}>
                      {filtered.map(svc => (
                        <Col xs={24} sm={12} xl={8} key={svc.id}>
                          <div className="luxury-card">
                            <div className="card-inner">
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Tag className="elite-tag">EXCLUSIVE</Tag>
                                <ArrowUpRight size={18} className="card-arrow" />
                              </div>
                              <Title level={4} style={{ margin: '20px 0 10px', fontSize: 18 }}>{svc.name}</Title>
                              
                              {/* XỬ LÝ TABLE-TO-CARD TRONG CONTENT */}
                              <div className="service-description">
                                <Paragraph type="secondary">
                                  {svc.description ? svc.description.replace(/<[^>]*>/g, '').substring(0, 80) + '...' : 'Trải nghiệm cá nhân hóa đỉnh cao.'}
                                </Paragraph>
                              </div>

                              <Divider style={{ margin: '15px 0' }} />
                              <div style={{ display: 'flex', alignItems: 'baseline', gap: 5 }}>
                                <Text strong style={{ fontSize: 20, color: THEME.NAVY_DARK }}>{svc.price?.toLocaleString()}</Text>
                                <Text type="secondary" style={{ fontSize: 11 }}>VNĐ / {svc.unit || 'DV'}</Text>
                              </div>
                            </div>
                            <div className="card-hover-overlay">
                              <Crown size={32} weight="light" color={THEME.GOLD} />
                              <span style={{ color: 'white', marginTop: 10, letterSpacing: 2, fontSize: 11 }}>BOOKING NOW</span>
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
          /* 1. LAYOUT CHUNG & BANNER */
          .main-container { maxWidth: 1400px; margin: 0 auto; padding: 60px 20px; }
          .banner-section { height: 300px; background-image: url("https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070"); background-size: cover; background-position: center; position: relative; display: flex; alignItems: center; padding-top: 60px; }
          .banner-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(13,24,33,0.8) 0%, rgba(255,255,255,0) 100%); z-index: 1; }
          .banner-content { position: relative; z-index: 2; width: 100%; text-align: center; }
          .banner-title { color: white !important; font-size: clamp(20px, 5vw, 32px) !important; font-weight: 700 !important; letter-spacing: 2px !important; }
          .search-container { maxWidth: 400px; margin: 20px auto 0; border-bottom: 1px solid rgba(255,255,255,0.5); display: flex; align-items: center; padding: 5px 10px; }

          /* 2. RESPONSIVE SIDEBAR TO TOP NAV */
          .sticky-sidebar { position: sticky; top: 100px; padding-right: 20px; }
          
          @media (max-width: 768px) {
            .main-container { padding: 30px 15px; }
            .sticky-sidebar { 
                position: relative; top: 0; padding-right: 0; 
                margin-bottom: 30px; border-right: none; 
            }
            .sidebar-header { display: none; }
            .category-list-wrapper { 
                display: flex; overflow-x: auto; gap: 15px; padding-bottom: 10px;
                scrollbar-width: none; 
            }
            .category-list-wrapper::-webkit-scrollbar { display: none; }
            .sidebar-item { 
                flex: 0 0 auto; padding: 8px 16px !important; 
                background: #f1f5f9; border-radius: 20px; border: none !important;
            }
            .sidebar-item.active { background: ${THEME.NAVY_DARK}; color: ${THEME.GOLD} !important; }
            .sidebar-item .dot, .sidebar-item .arrow { display: none; }
            .cat-name { font-size: 11px; }
            
            /* Table to Card Responsive */
            .service-description table, .service-description tbody, .service-description tr, .service-description td {
                display: block; width: 100% !important;
            }
            .service-description tr { margin-bottom: 10px; border: 1px solid #eee; border-radius: 4px; padding: 8px; }
            .service-description td { border: none !important; display: flex; justify-content: space-between; }
          }

          /* 3. SIDEBAR ITEMS (DESKTOP) */
          .sidebar-item { padding: 15px 0; cursor: pointer; display: flex; align-items: center; gap: 12px; font-size: 13px; font-weight: 500; color: #64748b; transition: all 0.3s ease; }
          .sidebar-item .dot { width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; }
          .sidebar-item .arrow { opacity: 0; transform: translateX(-10px); transition: 0.3s; }
          .sidebar-item:hover, .sidebar-item.active { color: ${THEME.GOLD}; padding-left: 5px; }
          .sidebar-item.active .dot { background: ${THEME.GOLD}; box-shadow: 0 0 10px ${THEME.GOLD}; }
          .sidebar-item.active .arrow { opacity: 1; transform: translateX(0); }

          /* 4. LUXURY CARD */
          .luxury-card { background: #fff; border: 1px solid #f1f5f9; padding: 25px; position: relative; overflow: hidden; transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; height: 100%; }
          .luxury-card:hover { border-color: ${THEME.GOLD}; box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
          .elite-tag { border: none; background: #fefce8; color: ${THEME.GOLD}; font-size: 10px; font-weight: 700; border-radius: 0; }
          .card-hover-overlay { position: absolute; inset: 0; background: ${THEME.NAVY_DARK}; display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; transform: translateY(100%); transition: 0.4s ease; }
          .luxury-card:hover .card-hover-overlay { opacity: 1; transform: translateY(0); }
          .card-arrow { color: #cbd5e1; transition: 0.3s; }
          .luxury-card:hover .card-arrow { color: ${THEME.GOLD}; transform: translate(3px, -3px); }

          /* 5. UI ELEMENTS */
          .category-block { marginBottom: 80px; scroll-margin-top: 100px; }
          .category-title-row { marginBottom: 30px; display: flex; align-items: center; gap: 15px; }
          .title-line { flex: 1; height: 1px; background: #eee; }
          html { scroll-behavior: smooth; }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
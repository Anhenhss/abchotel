import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin, Tag, Input, ConfigProvider, Divider, List } from 'antd';
import { MagnifyingGlass, Crown, Sparkle, ArrowUpRight, CaretRight } from '@phosphor-icons/react';
import { serviceApi } from '../../api/serviceApi';

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

  // Hàm xử lý cuộn trang mượt mà khi bấm vào danh mục
  const scrollToCategory = (id) => {
    setActiveCat(id);
    const element = document.getElementById(`category-${id}`);
    if (element) {
      const offset = 100; // Khoảng cách trừ hao để không bị Header che
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
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
        
        {/* BANNER THU NHỎ - Để tập trung vào nội dung dịch vụ */}
        <section style={{
          height: '300px', 
          backgroundImage: 'url("https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=2070")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          paddingTop: '60px'
        }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(13,24,33,0.8) 0%, rgba(255,255,255,0) 100%)', zIndex: 1 }}></div>
          <div style={{ position: 'relative', zIndex: 2, width: '100%', textAlign: 'center' }}>
            <Title style={{ color: 'white', fontSize: 32, fontWeight: 700, letterSpacing: 2 }}>NGHỆ THUẬT <span style={{ color: THEME.GOLD }}>PHỤC VỤ</span></Title>
            <div style={{ maxWidth: 400, margin: '20px auto 0', borderBottom: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', padding: '5px 10px' }}>
              <MagnifyingGlass size={20} color="white" />
              <Input placeholder="Tìm kiếm dịch vụ..." variant="borderless" onChange={e => setSearch(e.target.value)} style={{ color: 'white' }} />
            </div>
          </div>
        </section>

        {/* CẤU TRÚC 2 CỘT: TRÁI (MENU) - PHẢI (SERVICES) */}
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: '60px 20px' }}>
          <Row gutter={40}>
            
            {/* CỘT TRÁI: DANH MỤC (STICKY SIDEBAR) */}
            <Col xs={0} md={6} lg={5}>
              <div style={{ position: 'sticky', top: '100px', paddingRight: '20px', borderRight: '1px solid #f0f0f0' }}>
                <div style={{ marginBottom: 30 }}>
                  <Text strong style={{ letterSpacing: 2, color: '#94a3b8', fontSize: 12 }}>DANH MỤC DỊCH VỤ</Text>
                </div>
                <List
                  dataSource={categories}
                  renderItem={cat => (
                    <div 
                      key={cat.id}
                      onClick={() => scrollToCategory(cat.id)}
                      className={`sidebar-item ${activeCat === cat.id ? 'active' : ''}`}
                    >
                      <span className="dot"></span>
                      {cat.name.toUpperCase()}
                      <CaretRight size={14} className="arrow" />
                    </div>
                  )}
                />
              </div>
            </Col>

            {/* CỘT PHẢI: DANH SÁCH CARD DỊCH VỤ */}
            <Col xs={24} md={18} lg={19}>
              {categories.map((cat) => {
                const filtered = services.filter(s => s.categoryId === cat.id && s.name.toLowerCase().includes(search.toLowerCase()));
                if (filtered.length === 0) return null;

                return (
                  <div key={cat.id} id={`category-${cat.id}`} style={{ marginBottom: 80, scrollMarginTop: '100px' }}>
                    <div style={{ marginBottom: 30, display: 'flex', alignItems: 'center', gap: 15 }}>
                      <Title level={3} style={{ margin: 0, color: THEME.NAVY_DARK, fontWeight: 700 }}>{cat.name}</Title>
                      <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
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
                              <Paragraph type="secondary" style={{ fontSize: 13, minHeight: 40 }}>
                                {svc.description ? svc.description.replace(/<[^>]*>/g, '').substring(0, 80) + '...' : 'Trải nghiệm cá nhân hóa đỉnh cao.'}
                              </Paragraph>
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

        {/* CSS STYLE */}
        <style>{`
          .sidebar-item {
            padding: 15px 0;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 13px;
            font-weight: 500;
            color: #64748b;
            transition: all 0.3s ease;
            border-bottom: 1px solid transparent;
          }
          .sidebar-item .dot {
            width: 6px; height: 6px; border-radius: 50%; background: #cbd5e1; transition: 0.3s;
          }
          .sidebar-item .arrow { opacity: 0; transform: translateX(-10px); transition: 0.3s; }
          
          .sidebar-item:hover, .sidebar-item.active {
            color: ${THEME.GOLD};
            padding-left: 5px;
          }
          .sidebar-item.active .dot { background: ${THEME.GOLD}; box-shadow: 0 0 10px ${THEME.GOLD}; }
          .sidebar-item.active .arrow { opacity: 1; transform: translateX(0); }

          .luxury-card {
            background: #fff;
            border: 1px solid #f1f5f9;
            padding: 25px;
            position: relative;
            overflow: hidden;
            transition: 0.4s cubic-bezier(0.4, 0, 0.2, 1);
            cursor: pointer;
            height: 100%;
          }
          .luxury-card:hover { border-color: ${THEME.GOLD}; box-shadow: 0 15px 30px rgba(0,0,0,0.05); }
          
          .elite-tag { border: none; background: #fefce8; color: ${THEME.GOLD}; font-size: 10px; font-weight: 700; border-radius: 0; }
          
          .card-hover-overlay {
            position: absolute; inset: 0; background: ${THEME.NAVY_DARK};
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            opacity: 0; transform: translateY(100%); transition: 0.4s ease;
          }
          .luxury-card:hover .card-hover-overlay { opacity: 1; transform: translateY(0); }
          
          .card-arrow { color: #cbd5e1; transition: 0.3s; }
          .luxury-card:hover .card-arrow { color: ${THEME.GOLD}; transform: translate(3px, -3px); }
        `}</style>
      </div>
    </ConfigProvider>
  );
}
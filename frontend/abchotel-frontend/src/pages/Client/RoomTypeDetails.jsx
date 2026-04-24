import React, { useEffect, useRef, useState } from 'react';
import { 
  Typography, Button, Row, Col, Space, Divider, Tag, Affix, Spin, Grid
} from 'antd';
import { 
  CaretLeft, CaretUp, Bed, Users, ArrowsOut, CheckCircle, MapPin
} from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import { roomTypeApi } from '../../api/roomTypeApi';

const { Title, Text, Paragraph } = Typography;
const { useBreakpoint } = Grid;

const THEME = {
  NAVY: '#0D1821',
  GOLD: '#D4AF37',
  DARK_RED: '#8A1538',
  GRAY_BG: '#F8FAFC',
  WHITE: '#FFFFFF',
  TEXT: '#334155',
  BORDER: '#E2E8F0'
};

export default function RoomTypeDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const screens = useBreakpoint();
  
  const roomRefs = useRef({});
  const [activeId, setActiveId] = useState(null);
  
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // 1. FETCH DỮ LIỆU PHÒNG TỪ API
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const res = await roomTypeApi.getRoomTypes(true); 
        let data = res?.data?.$values || res?.$values || res?.data || res || [];
        setRooms(data);
        
        if (data.length > 0) {
          setActiveId(data[0].id || data[0].Id);
        }
      } catch (error) {
        console.error("Lỗi khi tải danh sách phòng:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRooms();
  }, []);

  // 2. SCROLL ĐẾN PHÒNG ĐƯỢC CHỌN TỪ TRANG TRƯỚC
  useEffect(() => {
    if (rooms.length === 0) return;
    
    const targetId = location.state?.scrollToId; 
    const targetIndex = location.state?.roomIndex; 

    let targetElement = null;
    let mappedId = rooms[0]?.id || rooms[0]?.Id;

    if (targetId && roomRefs.current[targetId]) {
      targetElement = roomRefs.current[targetId];
      mappedId = targetId;
    } else if (targetIndex !== undefined && rooms[targetIndex]) {
      mappedId = rooms[targetIndex].id || rooms[targetIndex].Id;
      targetElement = roomRefs.current[mappedId];
    }

    if (targetElement) {
      setActiveId(mappedId);
      setTimeout(() => {
        // Đã tăng offset lên 160 để bù cho 2 thanh Header (Header chính + Thanh danh sách)
        const headerOffset = 160;
        const elementPosition = targetElement.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }, 500);
    }
  }, [location, rooms]);

  // 3. SCROLL SPY (ĐỔI MÀU MỤC LỤC KHI CUỘN)
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 250;
      let currentActiveId = activeId;

      rooms.forEach(room => {
        const rId = room.id || room.Id;
        const element = roomRefs.current[rId];
        if (element) {
          const offsetTop = element.offsetTop;
          const offsetHeight = element.offsetHeight;
          if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
            currentActiveId = rId;
          }
        }
      });
      if (currentActiveId !== activeId) setActiveId(currentActiveId);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [activeId, rooms]);

  const handleMenuClick = (id) => {
    const element = roomRefs.current[id];
    if (element) {
      // Đã tăng offset lên 160
      const headerOffset = 160;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleGoBack = () => navigate('/rooms');
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: THEME.GRAY_BG }}>
        <Spin size="large" tip="Đang chuẩn bị không gian phòng..." />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: THEME.GRAY_BG, minHeight: '100vh', paddingBottom: 50, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
      
      {/* THANH ĐIỀU HƯỚNG TRANG (Đã thêm top: 80px để nằm ngay dưới mép Header chính) */}
      <div style={{ position: 'sticky', top: 80, zIndex: 990, backgroundColor: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)', borderBottom: `1px solid ${THEME.BORDER}`, padding: '16px 0', marginBottom: screens.md ? 40 : 20 }}>
        <div style={{ maxWidth: 1400, margin: '0 auto', padding: screens.md ? '0 30px' : '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
          <Button type="text" icon={<CaretLeft size={22} weight="bold" />} onClick={handleGoBack} style={{ display: 'flex', alignItems: 'center', fontWeight: 600, color: THEME.NAVY, padding: '0', fontSize: screens.md ? 16 : 14 }}>
            <span>DANH SÁCH PHÒNG</span>
          </Button>
          <Title level={4} style={{ margin: 0, fontFamily: '"Source Serif 4", serif', color: THEME.GOLD, letterSpacing: screens.md ? 3 : 1, textTransform: 'uppercase', fontSize: screens.md ? 20 : 16 }}>
            <span>Bộ Sưu Tập Phòng & Suites</span>
          </Title>
          <div style={{ width: screens.md ? 150 : 0 }}></div>
        </div>
      </div>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: screens.md ? '0 30px' : '0 16px' }}>
        <Row gutter={60}>
          
          {/* MỤC LỤC BÊN TRÁI (Ẩn trên điện thoại) */}
          <Col xs={0} lg={6}>
            {/* Tăng offsetTop lên 160 để Mục lục không bị che bởi Thanh điều hướng */}
            <Affix offsetTop={160}>
              <div style={{ paddingRight: 20 }}>
                <Text strong style={{ fontSize: 13, color: THEME.TEXT, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 25, display: 'block', opacity: 0.7 }}>
                  <span>Chọn Hạng Phòng</span>
                </Text>
                <div style={{ borderLeft: `2px solid ${THEME.BORDER}`, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
                  {rooms.length === 0 ? <Text type="secondary"><span>Chưa có dữ liệu phòng.</span></Text> : rooms.map((room) => {
                    const rId = room.id || room.Id;
                    const rName = room.name || room.Name;
                    return (
                      <div 
                        key={rId}
                        onClick={() => handleMenuClick(rId)}
                        style={{
                          cursor: 'pointer', fontSize: 16, lineHeight: 1.4,
                          fontWeight: activeId === rId ? 700 : 500,
                          color: activeId === rId ? THEME.DARK_RED : THEME.TEXT,
                          transition: 'all 0.3s ease', position: 'relative'
                        }}
                      >
                        {activeId === rId && (
                          <div style={{ position: 'absolute', left: -26, top: 6, width: 10, height: 10, borderRadius: '50%', backgroundColor: THEME.DARK_RED, border: `2px solid ${THEME.WHITE}` }} />
                        )}
                        <span>{rName}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Affix>
          </Col>

          {/* CHI TIẾT TỪNG PHÒNG - BỐ CỤC ĐỒNG NHẤT, RESPONSIVE TỐT */}
          <Col xs={24} lg={18}>
            {rooms.length === 0 ? (
               <div style={{ textAlign: 'center', padding: '100px 0' }}>
                 <Bed size={64} color={THEME.BORDER} />
                 <Title level={4} style={{ color: THEME.TEXT, marginTop: 16 }}><span>Chưa có hạng phòng nào được thiết lập.</span></Title>
               </div>
            ) : rooms.map((room) => {
              
              const rId = room.id || room.Id;
              const rName = room.name || room.Name;
              const rPrice = room.basePrice || room.BasePrice;
              const rSize = room.sizeSqm || room.SizeSqm;
              const rAdults = room.capacityAdults || room.CapacityAdults;
              const rChildren = room.capacityChildren || room.CapacityChildren;
              const rBed = room.bedType || room.BedType;
              const rView = room.viewDirection || room.ViewDirection;
              const rDesc = room.description || room.Description || 'Khám phá không gian nghỉ dưỡng tuyệt vời.';
              
              const rawImages = room.images?.$values || room.images || room.Images?.$values || room.Images || [];
              const rawAmenities = room.amenities?.$values || room.amenities || room.Amenities?.$values || room.Amenities || [];
              
              const primaryImg = rawImages.find(i => i.isPrimary || i.IsPrimary)?.imageUrl 
                                 || rawImages[0]?.imageUrl 
                                 || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200';

              const priceStr = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(rPrice || 0);
              const capacityStr = `${rAdults} NL${rChildren > 0 ? `, ${rChildren} TE` : ''}`;

              return (
                <div key={rId} ref={el => roomRefs.current[rId] = el} style={{ marginBottom: screens.md ? 60 : 30 }}>
                  <div style={{ backgroundColor: THEME.WHITE, borderRadius: screens.md ? 24 : 16, overflow: 'hidden', border: `1px solid ${THEME.BORDER}`, boxShadow: '0 10px 30px rgba(0,0,0,0.03)' }}>
                    
                    {/* Phần Ảnh Cover */}
                    <div style={{ width: '100%', height: screens.md ? 450 : 250, position: 'relative' }}>
                      <img src={primaryImg} alt={rName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {rView && (
                        <div style={{ position: 'absolute', top: 16, left: 16, backgroundColor: 'rgba(13,24,33,0.7)', backdropFilter: 'blur(4px)', padding: '4px 12px', borderRadius: 20, color: THEME.WHITE, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <MapPin size={14} color={THEME.GOLD} />
                          <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase' }}>Tầm nhìn: {rView}</span>
                        </div>
                      )}
                    </div>

                    {/* Phần Nội Dung Card */}
                    <div style={{ padding: screens.md ? '40px 50px' : '20px' }}>
                      
                      {/* Tiêu đề & Giá */}
                      <div style={{ display: 'flex', flexDirection: screens.md ? 'row' : 'column', justifyContent: 'space-between', alignItems: screens.md ? 'flex-start' : 'stretch', gap: 16, marginBottom: 24 }}>
                        <Title level={2} style={{ margin: 0, fontFamily: '"Source Serif 4", serif', color: THEME.NAVY, fontSize: screens.md ? 32 : 22 }}>
                          <span>{rName}</span>
                        </Title>
                        <div style={{ textAlign: screens.md ? 'right' : 'left', backgroundColor: THEME.GRAY_BG, padding: '12px 20px', borderRadius: 12, border: `1px solid ${THEME.BORDER}` }}>
                          <Text style={{ display: 'block', fontSize: 12, color: THEME.TEXT, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>
                            <span>Giá mỗi đêm từ</span>
                          </Text>
                          <Text style={{ fontSize: screens.md ? 24 : 20, fontWeight: 700, color: THEME.DARK_RED, fontFamily: '"Source Serif 4", serif' }}>
                            <span>{priceStr}</span>
                          </Text>
                        </div>
                      </div>

                      {/* Thanh Thông Số */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: screens.md ? 24 : 16, paddingBottom: 24, borderBottom: `1px solid ${THEME.BORDER}`, marginBottom: 24 }}>
                        <Space style={{ color: THEME.NAVY }}>
                          <ArrowsOut size={20} color={THEME.GOLD} />
                          <Text strong style={{ fontSize: screens.md ? 15 : 14 }}><span>{rSize} m²</span></Text>
                        </Space>
                        <Space style={{ color: THEME.NAVY }}>
                          <Users size={20} color={THEME.GOLD} />
                          <Text strong style={{ fontSize: screens.md ? 15 : 14 }}><span>{capacityStr}</span></Text>
                        </Space>
                        <Space style={{ color: THEME.NAVY }}>
                          <Bed size={20} color={THEME.GOLD} />
                          <Text strong style={{ fontSize: screens.md ? 15 : 14 }}><span>{rBed}</span></Text>
                        </Space>
                      </div>

                      {/* Mô tả */}
                      <Paragraph style={{ fontSize: screens.md ? 16 : 14, color: '#475569', lineHeight: 1.8, marginBottom: 30, textAlign: 'justify' }}>
                        <span>{rDesc}</span>
                      </Paragraph>

                      {/* Tiện ích */}
                      {rawAmenities.length > 0 && (
                        <div>
                          <Text strong style={{ display: 'block', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontSize: 12, color: THEME.TEXT }}>
                            <span>Tiện ích nổi bật</span>
                          </Text>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {rawAmenities.map((am, i) => (
                              <Tag key={i} style={{ padding: '6px 12px', fontSize: screens.md ? 14 : 13, background: THEME.GRAY_BG, border: `1px solid ${THEME.BORDER}`, color: THEME.NAVY, borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <CheckCircle size={16} color={THEME.DARK_RED} weight="fill" />
                                <span>{am.name || am.Name}</span>
                              </Tag>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              );
            })}
          </Col>
        </Row>
      </div>

      <Affix style={{ position: 'fixed', bottom: 20, right: 20 }}>
        <Button 
          type="primary" shape="circle" icon={<CaretUp size={24} />} size="large" onClick={scrollToTop}
          style={{ width: screens.md ? 55 : 45, height: screens.md ? 55 : 45, backgroundColor: THEME.NAVY, border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}
        />
      </Affix>

    </div>
  );
}
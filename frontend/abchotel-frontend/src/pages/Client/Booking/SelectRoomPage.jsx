import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Typography, Button, Space, Tag, notification, Steps, Tooltip, Carousel, Divider } from 'antd';
import { 
  Users, Bed, ArrowsOut, ArrowRight, CalendarBlank, 
  Sparkle, ShieldCheck, SuitcaseRolling, Mountains, CaretLeft, CaretRight, CheckCircle, WarningCircle, Plus, Minus
} from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

import { bookingApi } from '../../../api/bookingApi';

const { Title, Text, Paragraph } = Typography;

// 🔥 BẢNG MÀU MỚI: SÁNG SỦA, TINH TẾ, CHỈ NHẤN MÀU Ở CHI TIẾT QUAN TRỌNG
const THEME = {
  NAVY_DARK: '#0A192F',      
  NAVY_LIGHT: '#172A45',     
  DARK_RED: '#9E2A2B',       
  GOLD: '#D4AF37',           
  WHITE: '#FFFFFF',
  GRAY_BG: '#F4F7F6',        
  BORDER: '#E2E8F0',
  TEXT_MUTED: '#64748B'
};

const CustomArrow = (props) => {
  const { className, style, onClick, type } = props;
  return (
    <div className={`carousel-arrow ${type}`} onClick={onClick}>
      {type === 'prev' ? <CaretLeft size={24} weight="bold" /> : <CaretRight size={24} weight="bold" />}
    </div>
  );
};

export default function SelectRoomPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [api, contextHolder] = notification.useNotification();

  const [loading, setLoading] = useState(true);
  const [availableRooms, setAvailableRooms] = useState([]);
  
  // 🔥 LOGIC MỚI: GIỎ HÀNG CHỨA SỐ LƯỢNG TỪNG LOẠI PHÒNG
  // Cấu trúc: { [roomTypeId]: { quantity: number, data: object } }
  const [cart, setCart] = useState({});

  const searchParams = useMemo(() => {
    return location.state || {
      checkIn: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      checkOut: dayjs().add(2, 'day').format('YYYY-MM-DD'),
      priceType: 'NIGHTLY', adults: 2, children: 0, requestedRooms: 1, preSelectedRoomTypeId: null
    };
  }, [location.state]);

  const duration = useMemo(() => {
    const start = dayjs(searchParams.checkIn);
    const end = dayjs(searchParams.checkOut);
    return searchParams.priceType === 'HOURLY' ? end.diff(start, 'hour') : end.diff(start, 'day');
  }, [searchParams]);

  const fetchAvailableRooms = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.searchRooms({
        ...searchParams,
        checkIn: dayjs(searchParams.checkIn).format('YYYY-MM-DDTHH:mm:ss'),
        checkOut: dayjs(searchParams.checkOut).format('YYYY-MM-DDTHH:mm:ss'),
      });
      const data = res?.data?.$values || res?.$values || res || [];
      setAvailableRooms(data);

      // 🔥 AUTO-SELECT (TRƯỜNG HỢP 2): NẾU CÓ TRUYỀN ID TỪ TRANG KHÁC SANG
      if (searchParams.preSelectedRoomTypeId) {
        const targetRoom = data.find(r => r.roomTypeId === searchParams.preSelectedRoomTypeId || r.id === searchParams.preSelectedRoomTypeId);
        if (targetRoom && targetRoom.remainingRooms > 0) {
            setCart({ [targetRoom.roomTypeId || targetRoom.id]: { quantity: 1, data: targetRoom } });
        }
      }
    } catch (error) {
      api.error({ message: 'Lỗi hệ thống', description: 'Không thể tải danh sách phòng.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAvailableRooms(); }, [searchParams]);

  // TÍNH TOÁN TỔNG SỐ LƯỢNG VÀ TỔNG TIỀN
  const totalSelectedRooms = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = Object.values(cart).reduce((sum, item) => sum + ((item.data.pricePerUnit || item.data.basePricePerNight || 0) * duration * item.quantity), 0);

  // HÀM THÊM/BỚT PHÒNG
  const handleUpdateCart = (room, change) => {
    const roomId = room.roomTypeId || room.id;
    const currentQty = cart[roomId]?.quantity || 0;
    const newQty = currentQty + change;

    if (change > 0) {
        if (totalSelectedRooms >= searchParams.requestedRooms) {
            return api.warning({ message: `Bạn chỉ cần chọn tối đa ${searchParams.requestedRooms} phòng.` });
        }
        if (newQty > room.remainingRooms) {
            return api.warning({ message: `Hạng phòng này chỉ còn ${room.remainingRooms} phòng trống.` });
        }
    }

    if (newQty <= 0) {
        const newCart = { ...cart };
        delete newCart[roomId];
        setCart(newCart);
    } else {
        setCart({ ...cart, [roomId]: { quantity: newQty, data: room } });
    }
  };

  const handleNextStep = () => {
    if (totalSelectedRooms < searchParams.requestedRooms) {
       return api.warning({ message: `Vui lòng chọn đủ ${searchParams.requestedRooms} phòng để tiếp tục.` });
    }
    // Chuyển format cart thành mảng để truyền sang trang sau
    const selectedRoomsArray = [];
    Object.values(cart).forEach(item => {
        for(let i=0; i < item.quantity; i++) selectedRoomsArray.push(item.data);
    });
    
    navigate('/booking/services', { state: { ...searchParams, selectedRooms: selectedRoomsArray } });
  };

  return (
    <div className="select-room-wrapper">
      {contextHolder}
      
      {/* THANH TIẾN TRÌNH */}
      <div className="booking-topbar">
        <div className="container-inner">
            <Steps current={0} className="luxury-steps" items={[
                { title: 'Chọn Hạng Phòng', icon: <Bed size={22}/> },
                { title: 'Dịch Vụ', icon: <SuitcaseRolling size={22}/> },
                { title: 'Thanh Toán', icon: <ShieldCheck size={22}/> }
            ]} />
        </div>
      </div>

      <div className="container-inner" style={{ marginTop: 40 }}>
        <Row gutter={[32, 32]}>
          
          {/* CỘT TRÁI: DANH SÁCH PHÒNG TRỐNG (ĐÃ MỞ RỘNG) */}
          <Col xs={24} xl={17}>
            <div className="section-header">
                <div>
                    <Title level={2} className="main-title">Lựa Chọn Hạng Phòng</Title>
                    <Space size="middle" className="search-summary-tags">
                        <Tag icon={<CalendarBlank/>} color="default" className="info-tag">
                            {dayjs(searchParams.checkIn).format('DD/MM')} - {dayjs(searchParams.checkOut).format('DD/MM')}
                        </Tag>
                        <Tag icon={<Users/>} color="default" className="info-tag">
                            {searchParams.adults} Lớn, {searchParams.children} Bé
                        </Tag>
                        <Tag icon={<Bed/>} color="default" className="info-tag">
                            Cần {searchParams.requestedRooms} Phòng
                        </Tag>
                    </Space>
                </div>
            </div>

            {loading ? (
                <div className="loading-box"><div className="loader"></div><Text>Đang tìm kiếm phòng trống...</Text></div>
            ) : availableRooms.length === 0 ? (
                <div className="empty-box">
                    <WarningCircle size={48} color={THEME.TEXT_MUTED} />
                    <Title level={4} style={{ color: THEME.NAVY_DARK, marginTop: 16 }}>Đã hết phòng phù hợp</Title>
                    <Text type="secondary">Rất tiếc, các hạng phòng đã được đặt hết trong khoảng thời gian này.</Text>
                    <Button type="primary" size="large" onClick={() => navigate('/')} className="btn-return">Tìm Ngày Khác</Button>
                </div>
            ) : (
                <div className="room-list">
                    {availableRooms.map((room, index) => {
                        const roomId = room.roomTypeId || room.id;
                        const qtyInCart = cart[roomId]?.quantity || 0;
                        const images = room.images?.$values || room.images || ['https://via.placeholder.com/600x400?text=No+Image'];
                        const amenities = room.amenities?.$values || room.amenities || [];
                        const displayPrice = searchParams.priceType === 'HOURLY' ? (room.basePricePerHour || 0) : (room.basePricePerNight || room.pricePerUnit || 0);

                        return (
                            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} key={roomId}>
                                <Card variant="borderless" className={`horizontal-room-card ${qtyInCart > 0 ? 'is-selected' : ''}`}>
                                    <div className="card-inner">
                                        
                                        {/* PHẦN 1: ẢNH (BÊN TRÁI - TỈ LỆ CHUẨN) */}
                                        <div className="room-image-section">
                                            <Carousel effect="fade" arrows prevArrow={<CustomArrow type="prev" />} nextArrow={<CustomArrow type="next" />} dots={false}>
                                                {images.map((img, i) => (
                                                    <div key={i} className="img-holder">
                                                        <img src={img} alt={room.roomTypeName} loading="lazy" />
                                                    </div>
                                                ))}
                                            </Carousel>
                                            {room.isUrgent && <div className="urgent-badge">Chỉ còn {room.remainingRooms} phòng</div>}
                                        </div>

                                        {/* PHẦN 2: THÔNG TIN (Ở GIỮA) */}
                                        <div className="room-details-section">
                                            <Title level={3} className="room-name">{room.roomTypeName || room.name}</Title>
                                            <Paragraph className="room-desc" ellipsis={{ rows: 2 }}>
                                                {room.description || 'Tận hưởng không gian nghỉ dưỡng tinh tế với thiết kế hiện đại, mang lại sự thoải mái tuyệt đối.'}
                                            </Paragraph>

                                            <div className="specs-row">
                                                <Space size="large" wrap>
                                                    <Space className="spec-item"><ArrowsOut size={16} color={THEME.TEXT_MUTED}/> <Text strong>{room.sizeSqm || 35} m²</Text></Space>
                                                    <Space className="spec-item"><Bed size={16} color={THEME.TEXT_MUTED}/> <Text strong>{room.bedType || 'King Bed'}</Text></Space>
                                                    <Space className="spec-item"><Mountains size={16} color={THEME.TEXT_MUTED}/> <Text strong>{room.viewDirection || 'Hướng Phố'}</Text></Space>
                                                </Space>
                                            </div>

                                            <div className="amenities-row">
                                                {amenities.slice(0, 4).map((a, i) => (
                                                    <span key={i} className="amenity-dot">{a}</span>
                                                ))}
                                                {amenities.length > 4 && <Tooltip title={amenities.slice(4).join(', ')}><span className="amenity-dot more">+{amenities.length - 4}</span></Tooltip>}
                                            </div>
                                        </div>

                                        {/* PHẦN 3: GIÁ & NÚT CHỌN (BÊN PHẢI) */}
                                        <div className="room-action-section">
                                            <div className="price-info">
                                                <Text className="price-label">Giá cho {duration} {searchParams.priceType === 'HOURLY' ? 'giờ' : 'đêm'}</Text>
                                                <div className="price-value">
                                                    {new Intl.NumberFormat('vi-VN').format(displayPrice * duration)}<span className="currency">VND</span>
                                                </div>
                                                <Text className="tax-info">Bao gồm thuế & phí</Text>
                                            </div>

                                            <div className="action-button-wrapper">
                                                {qtyInCart === 0 ? (
                                                    <Button type="primary" className="btn-book-now" onClick={() => handleUpdateCart(room, 1)}>
                                                        CHỌN PHÒNG
                                                    </Button>
                                                ) : (
                                                    <div className="quantity-selector">
                                                        <Button icon={<Minus/>} onClick={() => handleUpdateCart(room, -1)} className="qty-btn" />
                                                        <div className="qty-display">{qtyInCart}</div>
                                                        <Button icon={<Plus/>} onClick={() => handleUpdateCart(room, 1)} className="qty-btn" disabled={qtyInCart >= room.remainingRooms || totalSelectedRooms >= searchParams.requestedRooms}/>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </Card>
                            </motion.div>
                        );
                    })}
                </div>
            )}
          </Col>

          {/* CỘT PHẢI: HÓA ĐƠN TRẮNG SÁNG (STICKY) */}
          <Col xs={24} xl={7}>
            <div className="sticky-bill">
                <Card variant="borderless" className="white-bill-card">
                    <Title level={4} className="bill-title">Chi Tiết Đặt Phòng</Title>
                    
                    <div className="bill-date-box">
                        <div className="date-item">
                            <Text className="date-lbl">Nhận phòng</Text>
                            <Text className="date-val">{dayjs(searchParams.checkIn).format('DD/MM/YYYY')}</Text>
                        </div>
                        <div className="date-divider"><ArrowRight color={THEME.TEXT_MUTED}/></div>
                        <div className="date-item">
                            <Text className="date-lbl">Trả phòng</Text>
                            <Text className="date-val">{dayjs(searchParams.checkOut).format('DD/MM/YYYY')}</Text>
                        </div>
                    </div>

                    <Divider style={{ margin: '20px 0' }} />

                    <div className="cart-area">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                            <Text strong style={{ fontSize: 15, color: THEME.NAVY_DARK }}>Phòng đã chọn</Text>
                            <Text strong style={{ color: totalSelectedRooms === searchParams.requestedRooms ? '#52c41a' : THEME.DARK_RED }}>
                                {totalSelectedRooms} / {searchParams.requestedRooms}
                            </Text>
                        </div>
                        
                        <AnimatePresence>
                            {Object.keys(cart).length === 0 ? (
                                <div className="empty-cart-msg">Chưa có phòng nào được chọn</div>
                            ) : (
                                Object.values(cart).map(item => (
                                    <motion.div key={item.data.roomTypeId || item.data.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="cart-item-row">
                                        <div className="cart-item-info">
                                            <Text className="cart-item-name">{item.quantity}x {item.data.roomTypeName || item.data.name}</Text>
                                        </div>
                                        <Text className="cart-item-price">
                                            {new Intl.NumberFormat('vi-VN').format((item.data.basePricePerNight || item.data.pricePerUnit || 0) * duration * item.quantity)}₫
                                        </Text>
                                    </motion.div>
                                ))
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="total-area">
                        <Text className="total-label">Tổng cộng</Text>
                        <div className="total-amount">{new Intl.NumberFormat('vi-VN').format(totalPrice)}<span style={{ fontSize: 20, verticalAlign: 'top' }}>₫</span></div>
                    </div>

                    <Button block className="btn-proceed" onClick={handleNextStep} disabled={totalSelectedRooms === 0}>
                        BƯỚC TIẾP THEO
                    </Button>

                    <div className="guarantee-box">
                        <Space><ShieldCheck size={18} color={THEME.DARK_RED}/> <Text style={{fontSize: 12}}>Bảo mật thanh toán 100%</Text></Space>
                    </div>
                </Card>
            </div>
          </Col>

        </Row>
      </div>

      <style>{`
        .select-room-wrapper { background-color: ${THEME.GRAY_BG}; min-height: 100vh; padding-bottom: 80px; font-family: 'Inter', sans-serif; }
        .container-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; } /* ĐÃ MỞ RỘNG TỐI ĐA 1400px */
        
        /* HEADER & STEPS */
        .booking-topbar { background: #fff; border-bottom: 1px solid ${THEME.BORDER}; padding: 20px 0; position: sticky; top: 80px; z-index: 100; }
        .luxury-steps .ant-steps-item-process .ant-steps-item-icon { background: ${THEME.NAVY_DARK}; border-color: ${THEME.NAVY_DARK}; }
        .luxury-steps .ant-steps-item-finish .ant-steps-item-icon { border-color: ${THEME.DARK_RED}; }
        .luxury-steps .ant-steps-item-finish .ant-steps-icon { color: ${THEME.DARK_RED}; }

        /* TIEU DE & TAGS */
        .section-header { margin-bottom: 24px; }
        .main-title { color: ${THEME.NAVY_DARK} !important; font-family: '"Source Serif 4", serif'; font-size: 32px !important; margin-bottom: 12px !important; }
        .info-tag { padding: 6px 12px; font-size: 14px; border-radius: 8px; border: 1px solid ${THEME.BORDER}; background: #fff; color: ${THEME.NAVY_DARK}; display: inline-flex; align-items: center; gap: 6px; }

        /* HORIZONTAL ROOM CARD - THIẾT KẾ ĐẲNG CẤP MỚI */
        .room-list { display: flex; flex-direction: column; gap: 24px; }
        .horizontal-room-card { 
            background: #fff; border-radius: 16px; overflow: hidden; 
            border: 1px solid ${THEME.BORDER}; box-shadow: 0 4px 15px rgba(0,0,0,0.02);
            transition: all 0.3s ease; 
        }
        .horizontal-room-card:hover { box-shadow: 0 12px 30px rgba(0,0,0,0.08); transform: translateY(-2px); border-color: #cbd5e1; }
        .horizontal-room-card.is-selected { border: 2px solid ${THEME.DARK_RED}; box-shadow: 0 8px 25px rgba(158, 42, 43, 0.15); }
        
        .card-inner { display: flex; flex-direction: row; min-height: 240px; }

        /* 1. ẢNH BÊN TRÁI (KHÔNG BỊ BÓP MÉO) */
        .room-image-section { width: 320px; flex-shrink: 0; position: relative; background: #f1f5f9; }
        .img-holder { height: 240px; outline: none; }
        .img-holder img { width: 100%; height: 100%; object-fit: cover; }
        .carousel-arrow { position: absolute; top: 50%; transform: translateY(-50%); z-index: 10; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.7); color: ${THEME.NAVY_DARK}; border-radius: 50%; cursor: pointer; transition: all 0.2s; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .carousel-arrow:hover { background: ${THEME.WHITE}; color: ${THEME.DARK_RED}; }
        .carousel-arrow.prev { left: 12px; }
        .carousel-arrow.next { right: 12px; }
        .urgent-badge { position: absolute; top: 12px; left: 12px; background: ${THEME.DARK_RED}; color: #fff; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; z-index: 5; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }

        /* 2. THÔNG TIN Ở GIỮA (THOÁNG ĐÃNG) */
        .room-details-section { flex: 1; padding: 24px; display: flex; flex-direction: column; }
        .room-name { margin: 0 0 8px 0 !important; color: ${THEME.NAVY_DARK} !important; font-family: '"Source Serif 4", serif'; font-size: 22px !important; font-weight: 700 !important; }
        .room-desc { font-size: 13px; color: ${THEME.TEXT_MUTED}; margin-bottom: 16px !important; line-height: 1.5; }
        
        .specs-row { margin-bottom: 16px; }
        .spec-item { font-size: 13px; color: ${THEME.NAVY_DARK}; }
        
        .amenities-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: auto; }
        .amenity-dot { font-size: 12px; color: ${THEME.TEXT_MUTED}; background: ${THEME.GRAY_BG}; padding: 4px 10px; border-radius: 12px; border: 1px solid ${THEME.BORDER}; }
        .amenity-dot.more { cursor: pointer; color: ${THEME.NAVY_DARK}; font-weight: bold; }

        /* 3. GIÁ & NÚT BẤM BÊN PHẢI */
        .room-action-section { width: 260px; flex-shrink: 0; border-left: 1px solid ${THEME.BORDER}; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; background: #fafafa; }
        .price-info { text-align: right; }
        .price-label { display: block; font-size: 12px; color: ${THEME.TEXT_MUTED}; font-weight: 600; text-transform: uppercase; margin-bottom: 4px; }
        .price-value { font-size: 26px; font-weight: 800; color: ${THEME.NAVY_DARK}; line-height: 1; margin-bottom: 4px; }
        .currency { font-size: 14px; margin-left: 4px; vertical-align: top; color: ${THEME.TEXT_MUTED}; font-weight: 600; }
        .tax-info { font-size: 11px; color: #94a3b8; }

        /* BỘ CHỌN SỐ LƯỢNG MỚI (QUANTITY SELECTOR) */
        .action-button-wrapper { margin-top: 20px; }
        .btn-book-now { height: 44px; width: 100%; border-radius: 8px; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; background: ${THEME.DARK_RED}; border: none; box-shadow: 0 4px 12px rgba(158, 42, 43, 0.2); }
        .btn-book-now:hover { background: #7A1A21 !important; transform: translateY(-1px); }
        
        .quantity-selector { display: flex; align-items: center; justify-content: space-between; background: #fff; border: 1px solid ${THEME.DARK_RED}; border-radius: 8px; height: 44px; padding: 4px; box-shadow: 0 4px 12px rgba(158, 42, 43, 0.1); }
        .qty-btn { border: none !important; box-shadow: none !important; color: ${THEME.DARK_RED}; display: flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 6px; background: ${THEME.GRAY_BG}; }
        .qty-btn:hover { background: #fee2e2 !important; color: ${THEME.DARK_RED} !important; }
        .qty-display { font-size: 16px; font-weight: bold; color: ${THEME.NAVY_DARK}; width: 40px; text-align: center; }

        /* HÓA ĐƠN TRẮNG SÁNG BÊN PHẢI (WHITE STICKY BILL) */
        .sticky-bill { position: sticky; top: 180px; }
        .white-bill-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid ${THEME.BORDER}; }
        .bill-title { color: ${THEME.NAVY_DARK} !important; font-family: '"Source Serif 4", serif'; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 800 !important; }
        
        .bill-date-box { display: flex; align-items: center; justify-content: space-between; background: ${THEME.GRAY_BG}; padding: 16px; border-radius: 12px; border: 1px solid ${THEME.BORDER}; }
        .date-item { display: flex; flex-direction: column; }
        .date-lbl { font-size: 11px; color: ${THEME.TEXT_MUTED}; text-transform: uppercase; font-weight: 600; margin-bottom: 4px; }
        .date-val { font-size: 15px; font-weight: 700; color: ${THEME.NAVY_DARK}; }
        
        .empty-cart-msg { text-align: center; padding: 20px 0; color: #94a3b8; font-style: italic; font-size: 13px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; }
        .cart-item-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .cart-item-name { font-size: 14px; font-weight: 600; color: ${THEME.NAVY_DARK}; }
        .cart-item-price { font-size: 15px; font-weight: 700; color: ${THEME.DARK_RED}; }

        .total-area { text-align: right; margin-top: 24px; margin-bottom: 24px; }
        .total-label { font-size: 13px; text-transform: uppercase; color: ${THEME.TEXT_MUTED}; font-weight: 700; }
        .total-amount { font-size: 36px; font-weight: 900; color: ${THEME.NAVY_DARK}; line-height: 1; margin-top: 4px; }

        .btn-proceed { height: 56px; border-radius: 12px; font-size: 15px; font-weight: 800; letter-spacing: 1px; background: ${THEME.NAVY_DARK}; color: #fff; border: none; box-shadow: 0 8px 20px rgba(10,25,47,0.2); }
        .btn-proceed:not(:disabled):hover { background: ${THEME.NAVY_LIGHT} !important; color: #fff !important; transform: translateY(-2px); }

        .guarantee-box { margin-top: 16px; text-align: center; color: ${THEME.TEXT_MUTED}; }

        /* LOADING & EMPTY STATES */
        .loading-box { text-align: center; padding: 80px 0; display: flex; flex-direction: column; align-items: center; gap: 16px; }
        .loader { width: 40px; height: 40px; border: 4px solid ${THEME.BORDER}; border-top-color: ${THEME.DARK_RED}; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .empty-box { text-align: center; padding: 60px 20px; background: #fff; border-radius: 16px; border: 1px dashed #cbd5e1; }
        .btn-return { margin-top: 20px; background: white; color: ${THEME.NAVY_DARK}; border-color: ${THEME.NAVY_DARK}; font-weight: bold; }

        /* RESPONSIVE IPAD/MOBILE */
        @media (max-width: 1200px) {
            .card-inner { flex-direction: column; }
            .room-image-section { width: 100%; height: 260px; }
            .img-holder { height: 260px; }
            .room-action-section { width: 100%; border-left: none; border-top: 1px solid ${THEME.BORDER}; flex-direction: row; align-items: center; padding: 20px 24px; }
            .action-button-wrapper { margin-top: 0; width: 200px; }
            .price-info { text-align: left; }
        }
        @media (max-width: 992px) {
            .sticky-bill { position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; }
            .white-bill-card { border-radius: 24px 24px 0 0; padding: 20px; box-shadow: 0 -10px 40px rgba(0,0,0,0.1); }
            .bill-date-box, .cart-area, .guarantee-box { display: none; }
            .total-area { display: flex; justify-content: space-between; align-items: center; margin: 0 0 16px 0; text-align: left; }
            .total-amount { font-size: 28px; }
            .select-room-wrapper { padding-bottom: 160px; } 
        }
        @media (max-width: 576px) {
            .room-action-section { flex-direction: column; align-items: stretch; gap: 16px; }
            .action-button-wrapper { width: 100%; }
        }
      `}</style>
    </div>
  );
}
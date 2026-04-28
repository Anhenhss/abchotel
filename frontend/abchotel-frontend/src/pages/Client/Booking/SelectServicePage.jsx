import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Typography, Button, Space, Steps, Divider, Spin, notification, Empty } from 'antd';
import { 
  Bed, SuitcaseRolling, ShieldCheck, ArrowRight, Minus, Plus, WarningCircle, Sparkle
} from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

import { serviceApi } from '../../../api/serviceApi'; 
import { useSignalR } from '../../../hooks/useSignalR';

const { Title, Text } = Typography;

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

export default function SelectServicePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [api, contextHolder] = notification.useNotification();

  const bookingState = location.state;

  useEffect(() => {
    if (!bookingState || !bookingState.selectedRooms || bookingState.selectedRooms.length === 0) {
      notification.warning({ message: 'Thiếu dữ liệu', description: 'Vui lòng chọn phòng trước khi chọn dịch vụ.' });
      navigate('/booking/select-room');
    }
  }, [bookingState, navigate]);

  const duration = useMemo(() => {
    if (!bookingState) return 1;
    const start = dayjs(bookingState.checkIn);
    const end = dayjs(bookingState.checkOut);
    return bookingState.priceType === 'HOURLY' ? Math.max(1, end.diff(start, 'hour')) : Math.max(1, end.diff(start, 'day'));
  }, [bookingState]);

  const totalRoomPrice = useMemo(() => {
    if (!bookingState?.selectedRooms) return 0;
    return bookingState.selectedRooms.reduce((sum, room) => {
      const price = bookingState.priceType === 'HOURLY' ? (room.basePricePerHour || 0) : (room.basePricePerNight || room.pricePerUnit || 0);
      return sum + (price * duration);
    }, 0);
  }, [bookingState, duration]);

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [services, setServices] = useState([]);
  const [cart, setCart] = useState({});

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true);
        const [catRes, srvRes] = await Promise.all([
          serviceApi.getCategories(),
          serviceApi.getServices(true)
        ]);
        
        const catData = catRes?.data?.$values || catRes?.$values || catRes || [];
        const srvData = srvRes?.data?.$values || srvRes?.$values || srvRes || [];
        
        setCategories(catData);
        setServices(srvData);
      } catch (error) {
        api.error({ message: 'Lỗi', description: 'Không thể lấy dữ liệu dịch vụ. Vui lòng thử lại.' });
      } finally {
        setLoading(false);
      }
    };
    if (bookingState) fetchServices();
  }, [bookingState]);

  useSignalR((notif) => {
    if (notif.title?.toLowerCase().includes("dịch vụ")) {
      api.info({
        message: <Text strong style={{ color: THEME.DARK_RED }}><Sparkle weight="fill" color={THEME.GOLD}/> Dịch vụ HOT!</Text>,
        description: notif.content || 'Nhiều khách hàng đang quan tâm đến các dịch vụ của chúng tôi.',
        placement: 'bottomLeft',
      });
    }
  });

  const handleIncrease = (serviceId) => {
    setCart(prev => ({ ...prev, [serviceId]: (prev[serviceId] || 0) + 1 }));
  };

  const handleDecrease = (serviceId) => {
    setCart(prev => {
      const currentQty = prev[serviceId] || 0;
      if (currentQty <= 1) {
        const newCart = { ...prev };
        delete newCart[serviceId];
        return newCart;
      }
      return { ...prev, [serviceId]: currentQty - 1 };
    });
  };

  const totalServicePrice = useMemo(() => {
    return Object.entries(cart).reduce((sum, [srvId, qty]) => {
      const srv = services.find(s => s.id === parseInt(srvId));
      return sum + ((srv?.price || 0) * qty);
    }, 0);
  }, [cart, services]);

  const grandTotal = totalRoomPrice + totalServicePrice;

  const handleNextStep = () => {
    navigate('/booking/checkout', { 
      state: { 
        ...bookingState, 
        selectedServices: cart,
        totalRoomPrice,
        totalServicePrice,
        grandTotal
      } 
    });
  };

  if (!bookingState) return null;

  return (
    // 🔥 THUỘC TÍNH translate="no" BẢO VỆ GIAO DIỆN
    <div className="select-service-wrapper" translate="no">
      {contextHolder}
      
      <div className="booking-topbar">
        <div className="container-inner">
            <Steps current={1} className="luxury-steps" items={[
                { title: 'Chọn Hạng Phòng', icon: <Bed size={22}/> },
                { title: 'Dịch Vụ', icon: <SuitcaseRolling size={22}/> },
                { title: 'Thanh Toán', icon: <ShieldCheck size={22}/> }
            ]} />
        </div>
      </div>

      <div className="container-inner" style={{ marginTop: 40 }}>
        <Row gutter={[32, 32]}>
          
          <Col xs={24} xl={17}>
            <div className="section-header">
                <Title level={2} className="main-title">Dịch vụ mua thêm</Title>
                <Text style={{color: THEME.DARK_RED, background: '#fef2f2', padding: '6px 12px', borderRadius: 20, fontWeight: 600}}>
                   Tiết kiệm tới 10% khi đặt trước trực tuyến!
                </Text>
            </div>

            {loading ? (
                <div className="loading-box"><Spin size="large"/><Text>Đang tải danh sách dịch vụ...</Text></div>
            ) : services.length === 0 ? (
                <Empty description="Khách sạn hiện chưa cung cấp dịch vụ bổ sung nào." />
            ) : (
                <div className="services-container">
                    {categories.map(category => {
                        const categoryServices = services.filter(s => s.categoryId === category.id);
                        if (categoryServices.length === 0) return null;

                        return (
                            <div key={category.id} className="service-category-section">
                                <Title level={4} className="category-title">{category.name}</Title>
                                
                                <Row gutter={[16, 16]}>
                                    {categoryServices.map((service, index) => {
                                        const qty = cart[service.id] || 0;
                                        
                                        return (
                                            <Col xs={24} sm={12} md={8} key={service.id}>
                                                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} style={{ height: '100%' }}>
                                                    <Card hoverable className={`service-card-no-img ${qty > 0 ? 'selected' : ''}`}>
                                                        {qty > 0 && <div className="qty-badge-corner">{qty}</div>}
                                                        
                                                        <div className="service-info-text">
                                                            <Title level={5} className="service-name" ellipsis={{ rows: 2 }}>{service.name}</Title>
                                                            <Text className="service-price">
                                                                {new Intl.NumberFormat('vi-VN').format(service.price)}₫ <span className="service-unit">/ {service.unit}</span>
                                                            </Text>
                                                        </div>
                                                        
                                                        <div className="service-action-bottom">
                                                            {qty === 0 ? (
                                                                <Button block className="btn-add-service" onClick={() => handleIncrease(service.id)}>
                                                                    <Plus size={16} /> Thêm
                                                                </Button>
                                                            ) : (
                                                                <div className="qty-controls">
                                                                    <Button icon={<Minus size={14}/>} onClick={() => handleDecrease(service.id)} className="btn-ctrl" />
                                                                    <Text className="qty-text">{qty}</Text>
                                                                    <Button icon={<Plus size={14}/>} onClick={() => handleIncrease(service.id)} className="btn-ctrl" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </Card>
                                                </motion.div>
                                            </Col>
                                        )
                                    })}
                                </Row>
                            </div>
                        )
                    })}
                </div>
            )}
          </Col>

          <Col xs={24} xl={7}>
            <div className="sticky-bill">
                <Card variant="borderless" className="white-bill-card">
                    <Title level={4} className="bill-title">Chuyến đi của bạn</Title>
                    
                    <div className="bill-date-box">
                        <div className="date-item">
                            <Text className="date-lbl">Nhận phòng</Text>
                            <Text className="date-val">{dayjs(bookingState.checkIn).format('DD/MM/YYYY')}</Text>
                        </div>
                        <div className="date-divider"><ArrowRight color={THEME.TEXT_MUTED}/></div>
                        <div className="date-item" style={{textAlign: 'right'}}>
                            <Text className="date-lbl">Trả phòng</Text>
                            <Text className="date-val">{dayjs(bookingState.checkOut).format('DD/MM/YYYY')}</Text>
                        </div>
                    </div>
                    <div style={{ textAlign: 'center', marginTop: 8 }}>
                       <Text type="secondary" style={{fontSize: 12}}>Tổng: {duration} {bookingState.priceType === 'HOURLY' ? 'giờ' : 'đêm'}</Text>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="cart-area">
                        <Text strong style={{ fontSize: 14, color: THEME.NAVY_DARK, textTransform: 'uppercase' }}>1. Tiền Phòng</Text>
                        {bookingState.selectedRooms.map((room, idx) => {
                            const price = bookingState.priceType === 'HOURLY' ? (room.basePricePerHour || 0) : (room.basePricePerNight || room.pricePerUnit || 0);
                            return (
                                <div key={idx} className="cart-item-row">
                                    <div className="cart-item-info">
                                        <Text className="cart-item-name">P.{idx + 1}: {room.roomTypeName || room.name}</Text>
                                    </div>
                                    <Text className="cart-item-price">
                                        {new Intl.NumberFormat('vi-VN').format(price * duration)}₫
                                    </Text>
                                </div>
                            );
                        })}
                    </div>

                    <Divider style={{ margin: '16px 0' }} />
                    <div className="cart-area">
                        <Text strong style={{ fontSize: 14, color: THEME.NAVY_DARK, textTransform: 'uppercase' }}>2. Dịch Vụ Mua Thêm</Text>
                        <AnimatePresence>
                            {Object.keys(cart).length === 0 ? (
                                <div className="empty-cart-msg">Chưa có dịch vụ nào được chọn</div>
                            ) : (
                                Object.entries(cart).map(([srvId, qty]) => {
                                    const srv = services.find(s => s.id === parseInt(srvId));
                                    if (!srv) return null;
                                    return (
                                        <motion.div key={srvId} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, height: 0 }} className="cart-item-row">
                                            <div className="cart-item-info">
                                                <Text className="cart-item-name">{srv.name}</Text>
                                                <Text style={{ display: 'block', fontSize: 12, color: THEME.TEXT_MUTED }}>
                                                    {qty} x {new Intl.NumberFormat('vi-VN').format(srv.price)}₫
                                                </Text>
                                            </div>
                                            <Text className="cart-item-price">
                                                {new Intl.NumberFormat('vi-VN').format(srv.price * qty)}₫
                                            </Text>
                                        </motion.div>
                                    );
                                })
                            )}
                        </AnimatePresence>
                    </div>

                    <Divider style={{ margin: '16px 0' }} />

                    <div className="total-area">
                        <Text className="total-label">Tổng cộng</Text>
                        <div className="total-amount">{new Intl.NumberFormat('vi-VN').format(grandTotal)}<span style={{ fontSize: 20, verticalAlign: 'top' }}>₫</span></div>
                        <Text className="tax-info">(Đã bao gồm thuế/phí)</Text>
                    </div>

                    <Button block className="btn-proceed" onClick={handleNextStep}>
                        BƯỚC TIẾP THEO
                    </Button>

                    <Button type="link" block style={{ marginTop: 8, color: THEME.TEXT_MUTED }} onClick={() => navigate(-1)}>
                        Quay lại chọn phòng
                    </Button>
                </Card>
            </div>
          </Col>

        </Row>
      </div>

      <style>{`
        .select-service-wrapper { background-color: ${THEME.GRAY_BG}; min-height: 100vh; padding-bottom: 80px; font-family: 'Inter', sans-serif; }
        .container-inner { max-width: 1400px; margin: 0 auto; padding: 0 24px; } 
        
        .booking-topbar { background: #fff; border-bottom: 1px solid ${THEME.BORDER}; padding: 20px 0; position: sticky; top: 80px; z-index: 100; }
        .luxury-steps .ant-steps-item-process .ant-steps-item-icon { background: ${THEME.NAVY_DARK}; border-color: ${THEME.NAVY_DARK}; }
        .luxury-steps .ant-steps-item-finish .ant-steps-item-icon { border-color: ${THEME.DARK_RED}; }
        .luxury-steps .ant-steps-item-finish .ant-steps-icon { color: ${THEME.DARK_RED}; }

        .section-header { margin-bottom: 32px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
        .main-title { color: ${THEME.NAVY_DARK} !important; font-family: '"Source Serif 4", serif'; font-size: 28px !important; margin: 0 !important; }

        .service-category-section { margin-bottom: 40px; }
        .category-title { font-size: 18px !important; color: ${THEME.NAVY_DARK} !important; border-bottom: 2px solid ${THEME.BORDER}; padding-bottom: 8px; margin-bottom: 20px !important; }
        
        /* CARD DỊCH VỤ DẠNG TEXT */
        .service-card-no-img { border-radius: 12px; border: 1px solid ${THEME.BORDER}; transition: all 0.3s ease; background: #fff; position: relative; height: 100%; display: flex; flex-direction: column; }
        .service-card-no-img .ant-card-body { padding: 20px; display: flex; flex-direction: column; height: 100%; flex: 1; }
        .service-card-no-img.selected { border-color: ${THEME.DARK_RED}; box-shadow: 0 0 0 1px ${THEME.DARK_RED}; background: #fffcfc; }
        
        .qty-badge-corner { position: absolute; top: -10px; right: -10px; background: ${THEME.DARK_RED}; color: white; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.2); z-index: 10; }

        .service-info-text { flex: 1; margin-bottom: 24px; }
        .service-name { font-size: 16px !important; margin: 0 0 8px 0 !important; color: ${THEME.NAVY_DARK} !important; line-height: 1.4; font-weight: 600 !important; }
        .service-price { font-size: 18px; font-weight: 700; color: ${THEME.DARK_RED}; display: block; }
        .service-unit { font-size: 13px; font-weight: normal; color: ${THEME.TEXT_MUTED}; }

        /* 🔥 FIX NÚT ĐỂ CHỮ TỰ ĐỘNG GIÃN NẾU GG DỊCH LÀM DÀI CHỮ RA */
        .service-action-bottom { margin-top: auto; }
        .btn-add-service { min-height: 40px; height: auto; padding: 6px 12px; white-space: normal; word-break: break-word; border-radius: 8px; border-color: ${THEME.BORDER}; color: ${THEME.NAVY_DARK}; display: flex; align-items: center; justify-content: center; gap: 6px; font-weight: 600; }
        .btn-add-service:hover { border-color: ${THEME.NAVY_DARK}; color: ${THEME.NAVY_DARK}; background: #f8fafc; }
        
        .qty-controls { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 8px; border: 1px solid ${THEME.DARK_RED}; padding: 3px; min-height: 40px; }
        .btn-ctrl { border: none; background: transparent; box-shadow: none; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; color: ${THEME.DARK_RED}; }
        .btn-ctrl:hover { background: #fef2f2; }
        .qty-text { font-weight: bold; font-size: 16px; color: ${THEME.NAVY_DARK}; width: 30px; text-align: center; }

        /* HÓA ĐƠN STICKY */
        .sticky-bill { position: sticky; top: 180px; }
        .white-bill-card { background: #fff; border-radius: 16px; padding: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid ${THEME.BORDER}; }
        .bill-title { color: ${THEME.NAVY_DARK} !important; font-family: '"Source Serif 4", serif'; margin-top: 0; margin-bottom: 20px; font-size: 20px; font-weight: 800 !important; text-align: center; }
        
        .bill-date-box { display: flex; align-items: center; justify-content: space-between; background: ${THEME.GRAY_BG}; padding: 12px 16px; border-radius: 12px; border: 1px solid ${THEME.BORDER}; }
        .date-item { display: flex; flex-direction: column; }
        .date-lbl { font-size: 11px; color: ${THEME.TEXT_MUTED}; text-transform: uppercase; font-weight: 600; margin-bottom: 2px; }
        .date-val { font-size: 14px; font-weight: 700; color: ${THEME.NAVY_DARK}; }
        
        .empty-cart-msg { text-align: center; padding: 12px 0; color: #94a3b8; font-style: italic; font-size: 13px; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; margin-top: 8px; }
        .cart-item-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px dashed #f1f5f9; }
        .cart-item-row:last-child { border-bottom: none; }
        .cart-item-name { font-size: 13px; font-weight: 600; color: ${THEME.NAVY_DARK}; }
        .cart-item-price { font-size: 14px; font-weight: 700; color: ${THEME.NAVY_DARK}; }

        .total-area { text-align: right; margin-bottom: 20px; }
        .total-label { font-size: 13px; text-transform: uppercase; color: ${THEME.TEXT_MUTED}; font-weight: 700; }
        .total-amount { font-size: 32px; font-weight: 900; color: ${THEME.NAVY_DARK}; line-height: 1; margin-top: 4px; }
        .tax-info { font-size: 12px; color: #94a3b8; display: block; margin-top: 4px; }

        /* 🔥 FIX NÚT TIẾP THEO CHO CO GIÃN MƯỢT MÀ */
        .btn-proceed { min-height: 50px; height: auto; padding: 12px 16px; white-space: normal; word-break: break-word; border-radius: 12px; font-size: 15px; font-weight: 800; letter-spacing: 1px; background: ${THEME.NAVY_DARK}; color: #fff; border: none; box-shadow: 0 4px 15px rgba(10, 25, 47, 0.2); }
        .btn-proceed:hover { background: ${THEME.NAVY_LIGHT} !important; color: #fff !important; transform: translateY(-2px); }

        .loading-box { text-align: center; padding: 60px 0; display: flex; flex-direction: column; gap: 16px; color: ${THEME.TEXT_MUTED}; }

        /* RESPONSIVE */
        @media (max-width: 992px) {
            .sticky-bill { position: fixed; bottom: 0; left: 0; right: 0; z-index: 1000; }
            .white-bill-card { border-radius: 24px 24px 0 0; padding: 16px 20px; box-shadow: 0 -10px 40px rgba(0,0,0,0.1); }
            .bill-date-box, .cart-area, .bill-title { display: none; }
            .ant-divider { display: none; }
            .total-area { display: flex; justify-content: space-between; align-items: center; margin: 0 0 12px 0; text-align: left; }
            .total-amount { font-size: 24px; margin-top: 0; }
            .tax-info { display: none; }
            .select-service-wrapper { padding-bottom: 140px; } 
        }
      `}</style>
    </div>
  );
}
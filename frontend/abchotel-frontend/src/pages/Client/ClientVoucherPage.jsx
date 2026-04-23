import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin, Empty, Button, message, Tag, Space, Tabs, notification } from 'antd';
import { 
  Ticket, Copy, CheckCircle, Sparkle, Clock, Crown, ShieldCheck, 
  MapPin, ArrowRight, BellRinging
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

import { voucherApi } from '../../api/voucherApi';
import { useSignalR } from '../../hooks/useSignalR';

const { Title, Text, Paragraph } = Typography;

const THEME = {
  NAVY_DARK: '#0D1821',
  NAVY_LIGHT: '#1C2E4A',
  DARK_RED: '#8A1538',
  GOLD: '#D4AF37',
  BG_LIGHT: '#F8FAFC'
};

export default function ClientVoucherPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [activeTab, setActiveTab] = useState('ALL');
  const [api, contextHolder] = notification.useNotification();

  // 1. FETCH DỮ LIỆU
  const fetchVouchers = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await voucherApi.getAll(true); // true = Chỉ lấy mã Active
      
      // Sắp xếp mã ưu tiên hiển thị trước (Khách mới -> Giảm % -> Giảm tiền)
      const sorted = (res || []).sort((a, b) => {
        if (a.isForNewCustomer && !b.isForNewCustomer) return -1;
        if (!a.isForNewCustomer && b.isForNewCustomer) return 1;
        return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
      });

      setVouchers(sorted);
    } catch (error) {
      console.error("Lỗi lấy danh sách voucher", error);
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
    window.scrollTo(0, 0);
  }, []);

  // 2. SIGNALR: REALTIME TỰ ĐỘNG CẬP NHẬT MÃ MỚI
  useSignalR((newNotif) => {
    if (newNotif.permission === "MANAGE_VOUCHERS" || newNotif.type === "PROMOTION") {
      fetchVouchers(true);
      api.info({
        message: <Text strong style={{ color: THEME.DARK_RED }}>Ưu đãi mới vừa hạ cánh!</Text>,
        description: 'Chúng tôi vừa tung ra một mã giảm giá mới. Hãy kiểm tra ngay!',
        icon: <BellRinging color={THEME.GOLD} weight="fill" />,
        placement: 'bottomRight',
      });
    }
  });

  // 3. COPY MÃ VOUCHER
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    message.success({
      content: `Đã copy mã ${code} ! Sẵn sàng để thanh toán.`,
      icon: <CheckCircle weight="fill" color={THEME.SUCCESS} />
    });
    setTimeout(() => setCopiedCode(null), 3000);
  };

  // 4. LỌC DỮ LIỆU THEO TABS
  const filteredVouchers = vouchers.filter(v => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'NEW') return v.isForNewCustomer;
    if (activeTab === 'PERCENT') return v.discountType === 'PERCENT';
    if (activeTab === 'FIXED') return v.discountType === 'FIXED_AMOUNT';
    return true;
  });

  const tabItems = [
    { key: 'ALL', label: 'TẤT CẢ ƯU ĐÃI' },
    { key: 'NEW', label: 'DÀNH CHO KHÁCH MỚI' },
    { key: 'PERCENT', label: 'GIẢM THEO %' },
    { key: 'FIXED', label: 'GIẢM TIỀN MẶT' },
  ];

  return (
    <div style={{ backgroundColor: THEME.BG_LIGHT, minHeight: '100vh' }}>
      {contextHolder}

      {/* ================= HERO SECTION ================= */}
      <div style={{ 
        position: 'relative', height: '60vh', minHeight: 400,
        backgroundImage: 'url("https://i.pinimg.com/1200x/2c/16/33/2c1633b3d7f37db080958612ce2db2f9.jpg")', 
        backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to bottom, rgba(13, 24, 33, 0.6), ${THEME.NAVY_DARK})` }}></div>
        <motion.div 
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
          style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '0 20px', maxWidth: 800 }}
        >
          <Ticket size={56} color={THEME.GOLD} weight="duotone" style={{ marginBottom: 16 }} />
          <Title style={{ color: '#fff', fontSize: 48, fontFamily: '"Source Serif 4", serif', letterSpacing: 2, margin: '0 0 16px 0' }}>
            ƯU ĐÃI ĐỘC QUYỀN
          </Title>
          <Paragraph style={{ color: '#B4CDED', fontSize: 18, lineHeight: 1.6 }}>
            Nâng tầm kỳ nghỉ của bạn với những đặc quyền tài chính hấp dẫn nhất. Chúng tôi cam kết mang lại mức giá tốt nhất khi bạn đặt phòng trực tiếp.
          </Paragraph>
        </motion.div>
      </div>

      {/* ================= DANH SÁCH VOUCHER ================= */}
      <div style={{ maxWidth: 1200, margin: '-40px auto 80px', padding: '0 20px', position: 'relative', zIndex: 10 }}>
        
        {/* TABS LỌC MÃ LƠ LỬNG */}
        <div style={{ background: '#fff', padding: '16px 24px', borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.08)', marginBottom: 40 }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={tabItems} 
            centered
            tabBarStyle={{ marginBottom: 0, borderBottom: 'none' }}
            tabBarGutter={32}
            className="luxury-tabs"
          />
        </div>

        {/* LƯỚI CARD VOUCHER */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div>
        ) : filteredVouchers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', background: '#fff', borderRadius: 16 }}>
            <Empty description={<Text style={{ fontSize: 16, color: '#64748b' }}>Hiện chưa có mã ưu đãi nào cho danh mục này.</Text>} />
          </div>
        ) : (
          <motion.div layout>
            <AnimatePresence>
              <Row gutter={[32, 32]}>
                {filteredVouchers.map((v) => {
                  const isPercent = v.discountType === 'PERCENT';
                  const displayValue = isPercent ? `${v.discountValue}%` : `${new Intl.NumberFormat('vi-VN').format(v.discountValue)}đ`;
                  const isCopied = copiedCode === v.code;

                  return (
                    <Col xs={24} md={12} lg={12} key={v.id}>
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                        whileHover={{ y: -5, boxShadow: '0 15px 35px rgba(139, 0, 0, 0.15)' }}
                        style={{ 
                          display: 'flex', background: '#ffffff', borderRadius: 16, overflow: 'hidden', 
                          boxShadow: '0 6px 20px rgba(0,0,0,0.06)', border: `1px dashed ${THEME.GOLD}`,
                          transition: 'all 0.3s ease', position: 'relative'
                        }}
                      >
                        {/* THE TICKET LEFT (ĐỎ SẪM) */}
                        <div style={{ 
                          background: `linear-gradient(135deg, ${THEME.DARK_RED} 0%, #5c0000 100%)`, 
                          color: '#ffffff', padding: '30px 20px', display: 'flex', flexDirection: 'column', 
                          justifyContent: 'center', alignItems: 'center', minWidth: 140, position: 'relative' 
                        }}>
                          <span style={{ fontSize: 32, fontWeight: 900, lineHeight: 1 }}>{displayValue}</span>
                          <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.5, marginTop: 8, opacity: 0.9 }}>GIẢM GIÁ</span>
                          {/* Nửa vòng tròn đục lỗ */}
                          <div style={{ position: 'absolute', right: -12, top: '50%', transform: 'translateY(-50%)', width: 24, height: 24, background: THEME.BG_LIGHT, borderRadius: '50%', borderLeft: `1px dashed ${THEME.GOLD}`, zIndex: 2 }}></div>
                        </div>

                        {/* THE TICKET RIGHT (TRẮNG) */}
                        <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                          
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h4 style={{ margin: '0 0 4px 0', fontSize: 12, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>Mã Khuyến Mãi</h4>
                                <div style={{ fontSize: 26, fontWeight: 900, color: THEME.NAVY_DARK, letterSpacing: 2 }}>{v.code}</div>
                            </div>
                            {v.isForNewCustomer && (
                                <Tag color="gold" style={{ margin: 0, fontWeight: 700, borderRadius: 20, padding: '2px 10px' }}><Sparkle size={12} style={{marginRight:4}}/>Khách mới</Tag>
                            )}
                          </div>

                          <Paragraph style={{ margin: '0 0 16px 0', fontSize: 14, color: '#475569', lineHeight: 1.5, minHeight: 42 }} ellipsis={{ rows: 2 }}>
                            {v.description || 'Sử dụng mã này tại bước thanh toán để nhận ưu đãi đặc biệt.'}
                          </Paragraph>

                          {/* Thông tin phụ */}
                          <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: 8, marginBottom: 16 }}>
                            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                              {v.minBookingValue > 0 && (
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                  <Text type="secondary">Đơn tối thiểu:</Text>
                                  <Text strong>{new Intl.NumberFormat('vi-VN').format(v.minBookingValue)}đ</Text>
                                </div>
                              )}
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                                <Text type="secondary"><Clock size={14} style={{ verticalAlign: 'middle', marginRight: 4 }}/>Hạn sử dụng:</Text>
                                <Text strong>{v.validTo ? dayjs(v.validTo).format('DD/MM/YYYY') : 'Không thời hạn'}</Text>
                              </div>
                            </Space>
                          </div>

                          {/* Nút Copy */}
                          <Button 
                            type="primary" block size="large"
                            onClick={() => handleCopyCode(v.code)}
                            style={{ 
                              backgroundColor: isCopied ? THEME.NAVY_DARK : '#ffffff', 
                              color: isCopied ? '#ffffff' : THEME.DARK_RED, 
                              borderColor: THEME.DARK_RED,
                              fontWeight: 800, letterSpacing: 1, borderRadius: 8
                            }}
                            icon={isCopied ? <CheckCircle size={20} weight="fill" /> : <Copy size={20} />}
                          >
                            {isCopied ? 'ĐÃ SAO CHÉP MÃ' : 'COPY MÃ NGAY'}
                          </Button>
                        </div>
                      </motion.div>
                    </Col>
                  );
                })}
              </Row>
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* ================= SECTION ĐẶC QUYỀN ĐẶT PHÒNG TRỰC TIẾP ================= */}
      <div style={{ backgroundColor: THEME.NAVY_DARK, padding: '100px 20px', color: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <Title level={2} style={{ color: THEME.GOLD, fontFamily: '"Source Serif 4", serif' }}>ĐẶC QUYỀN THƯỢNG LƯU</Title>
            <Paragraph style={{ color: '#B4CDED', fontSize: 16 }}>Khi đặt phòng trực tiếp qua Website, bạn luôn nhận được nhiều hơn thế.</Paragraph>
          </div>

          <Row gutter={[40, 40]}>
            {[
              { icon: <ShieldCheck size={48} weight="duotone" color={THEME.GOLD}/>, title: 'Cam Kết Giá Tốt Nhất', desc: 'Chúng tôi đảm bảo mức giá hiển thị trên website luôn là mức giá cuối cùng và tốt nhất dành cho bạn.' },
              { icon: <Crown size={48} weight="duotone" color={THEME.GOLD}/>, title: 'Ưu Đãi Đặc Quyền', desc: 'Tận hưởng các mã giảm giá ẩn chỉ dành riêng cho khách hàng tạo tài khoản và đặt phòng trực tiếp.' },
              { icon: <Clock size={48} weight="duotone" color={THEME.GOLD}/>, title: 'Linh Hoạt Thời Gian', desc: 'Hỗ trợ nhận phòng sớm hoặc trả phòng trễ hoàn toàn miễn phí (Tùy thuộc vào tình trạng phòng trống).' }
            ].map((item, idx) => (
              <Col xs={24} md={8} key={idx}>
                <div style={{ textAlign: 'center', padding: '30px 20px', background: 'rgba(255,255,255,0.03)', borderRadius: 20, height: '100%', border: '1px solid rgba(212, 175, 55, 0.1)' }}>
                  <div style={{ marginBottom: 20 }}>{item.icon}</div>
                  <Title level={4} style={{ color: '#fff', marginBottom: 16 }}>{item.title}</Title>
                  <Text style={{ color: '#A0AABF', fontSize: 15, lineHeight: 1.6 }}>{item.desc}</Text>
                </div>
              </Col>
            ))}
          </Row>

          <div style={{ textAlign: 'center', marginTop: 60 }}>
             <Button size="large" type="primary" onClick={() => window.location.href='/rooms'} style={{ backgroundColor: THEME.DARK_RED, height: 50, padding: '0 40px', fontSize: 15, fontWeight: 'bold', letterSpacing: 1, borderRadius: 30 }}>
                XEM PHÒNG VÀ ÁP MÃ NGAY <ArrowRight size={20} style={{ marginLeft: 8 }} />
             </Button>
          </div>
        </div>
      </div>

      <style>{`
        /* Tùy chỉnh CSS cho Tabs để nó sang trọng hơn */
        .luxury-tabs .ant-tabs-nav::before { display: none; }
        .luxury-tabs .ant-tabs-tab { padding: 12px 0; font-weight: 700; color: #64748b; font-size: 14px; }
        .luxury-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${THEME.DARK_RED} !important; }
        .luxury-tabs .ant-tabs-ink-bar { background: ${THEME.DARK_RED}; height: 3px !important; border-radius: 3px; }
      `}</style>
    </div>
  );
}
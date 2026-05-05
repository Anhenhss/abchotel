import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin, Button, message, Modal, Tabs, InputNumber, Tag } from 'antd';
import { 
  Crown, Gift, MagicWand, Cards, Quotes,
  DiamondsFour, MusicNotes, HandWaving, LockKey, UserPlus, Percent, Coins, Ticket, Lock
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { voucherApi } from '../api/voucherApi';

const { Title, Text, Paragraph } = Typography;

const THEME = {
  NAVY_DARK: '#0D1821', 
  DARK_RED: '#8A1538',  
  GOLD: '#D4AF37',      
  BG_LIGHT: '#F8FAFC',
};

export default function ClientVoucherPage() {
  const [vouchers, setVouchers] = useState([]);
  const [myVouchers, setMyVouchers] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('NEW');
  
  // Logic kiểm tra khách hàng mới & VIP cho hệ thống abchotel
  const [isNewCustomer] = useState(true); 
  const [isVipUser] = useState(false); // Giả lập trạng thái VIP

  // States Modals
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [gridType, setGridType] = useState('BOX'); 
  const [isScratchModalOpen, setIsScratchModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  // States Games
  const [revealedVoucher, setRevealedVoucher] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const res = await voucherApi.getAll(true);
        setVouchers(res || []);

        const saved = localStorage.getItem('my_vouchers');
        if (saved) {
          setMyVouchers(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  const collectVoucher = (v) => {
    if (!v) return;
    const isCollected = myVouchers.some(item => item.id === v.id);
    
    if (!isCollected) {
      const updated = [v, ...myVouchers];
      setMyVouchers(updated);
      localStorage.setItem('my_vouchers', JSON.stringify(updated));
      message.success('Đã lưu ưu đãi vào kho của bạn!');
    }
    
    navigator.clipboard.writeText(v.code);
    setIsResultModalOpen(false);
  };

  const handleOpenGame = (type) => {
    // 1. CẢI THIỆN LOGIC GAME: Lọc voucher hợp lệ (Khách mới vs Khách cũ)
    const validVouchers = vouchers.filter(v => {
        // Nếu voucher chỉ dành cho khách mới, nhưng user không phải khách mới -> loại
        if (v.isForNewCustomer && !isNewCustomer) return false;
        return true;
    });

    if (validVouchers.length === 0) {
        message.warning("Hiện không có ưu đãi phù hợp với hạng phòng/thành viên của bạn.");
        return;
    }
    
    const rand = validVouchers[Math.floor(Math.random() * validVouchers.length)];
    setRevealedVoucher(rand);

    if (type === 'WHEEL') {
      setIsSpinning(true);
      setRotation(rotation + 1800 + Math.random() * 360);
      setTimeout(() => { setIsSpinning(false); setIsResultModalOpen(true); }, 3000);
    } else if (type === 'DICE') {
      setIsDiceRolling(true);
      setTimeout(() => { setIsDiceRolling(false); setIsResultModalOpen(true); }, 1500);
    } else if (type === 'BOX' || type === 'CARD') {
      setGridType(type); setIsGridModalOpen(true);
    } else if (type === 'SCRATCH') {
      setScratchProgress(0); setIsScratchModalOpen(true);
    } else if (type === 'MUSIC') {
      setIsMusicModalOpen(true);
    }
  };

  const renderGameCard = (title, story, icon, color, bgColor, btnLabel, type) => (
    <div className={`luxury-card ${color === THEME.DARK_RED ? 'br-red' : 'br-navy'}`}>
      <div className="visual-part" style={{ backgroundColor: bgColor }}>
        <div className="icon-main">{icon}</div>
        <Button 
          className={`btn-game ${color === THEME.DARK_RED ? 'btn-red' : 'btn-gold'}`} 
          onClick={() => handleOpenGame(type)}
          loading={type==='WHEEL' ? isSpinning : type==='DICE' ? isDiceRolling : false}
        >
          {btnLabel}
        </Button>
      </div>
      <div className="story-part">
        <Quotes size={24} color={THEME.GOLD} weight="fill" style={{ opacity: 0.2 }} />
        <Title level={4} style={{ fontFamily: '"Source Serif 4", serif', margin: '5px 0' }}>{title}</Title>
        <Paragraph style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', margin: 0 }}>{story}</Paragraph>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: THEME.BG_LIGHT, minHeight: '100vh', paddingBottom: 100 }}>
      <div className="luxury-hero">
        <div className="overlay-dark" />
        <div className="hero-content">
          <Crown size={60} color={THEME.GOLD} weight="fill" />
          <Title className="main-title">ƯU ĐÃI HẤP DẪN</Title>
          <Text className="sub-title">ABC HOTEL - ELEGANCE & LUXURY</Text>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '60px auto', padding: '0 20px' }}>
        <Title level={3} className="label-section red-label">ƯU ĐÃI THỊNH VƯỢNG</Title>
        <Row gutter={[32, 32]} style={{ marginBottom: 50 }}>
          <Col xs={24} lg={12}>{renderGameCard("Vòng Quay Di Sản", "Xoay trục thời gian nhận quà.", <div className="wheel-wrap"><div className="wheel-body" style={{ transform: `rotate(${rotation}deg)` }} /><div className="wheel-pin" /></div>, THEME.DARK_RED, "#fff5f5", "QUAY THƯỞNG", "WHEEL")}</Col>
          <Col xs={24} lg={12}>{renderGameCard("Hộp Quà Bí Mật", "Khám phá quà tri ân.", <Gift size={60} color={THEME.DARK_RED} weight="duotone" />, THEME.DARK_RED, "#fff5f5", "MỞ HỘP QUÀ", "BOX")}</Col>
          <Col xs={24}>{renderGameCard("Cào Thẻ May Mắn", "Cào lớp phủ nhận ưu đãi.", <HandWaving size={60} color={THEME.DARK_RED} weight="fill" />, THEME.DARK_RED, "#fff5f5", "CÀO THẺ NGAY", "SCRATCH")}</Col>
        </Row>

        <Title level={3} className="label-section navy-label">KHO TÀNG DI SẢN</Title>
        <Row gutter={[32, 32]} style={{ marginBottom: 80 }}>
          <Col xs={24} lg={12}>{renderGameCard("Thẻ Bài Quý Tộc", "Quân bài dẫn lối may mắn.", <Cards size={60} color={THEME.GOLD} weight="duotone" />, THEME.NAVY_DARK, THEME.NAVY_DARK, "LẬT THẺ BÀI", "CARD")}</Col>
          <Col xs={24} lg={12}>{renderGameCard("Xúc Xắc Tài Lộc", "Gieo vận may cùng súc xắc vàng.", <DiamondsFour size={60} color={THEME.GOLD} weight="fill" />, THEME.NAVY_DARK, THEME.NAVY_DARK, "GIEO XÚC XẮC", "DICE")}</Col>
          <Col xs={24}>{renderGameCard("Giai Điệu Di Sản", "Mở két sắt theo nhịp điệu.", <MusicNotes size={60} color={THEME.GOLD} weight="fill" />, THEME.NAVY_DARK, THEME.NAVY_DARK, "MỞ KÉT SẮT", "MUSIC")}</Col>
        </Row>

        {/* 5. BỔ SUNG EMPTY STATE CHO VOUCHER ĐẶC BIỆT (VIP) */}
        {!isVipUser && (
           <div className="locked-vip-section">
              <div className="locked-content">
                <Lock size={40} color={THEME.GOLD} weight="fill" />
                <Title level={4} style={{ color: '#fff', marginTop: 15 }}>ĐẶC QUYỀN VIP ĐANG KHÓA</Title>
                <Text style={{ color: '#aab' }}>Thăng hạng thành viên để mở khóa kho voucher cao cấp và ưu đãi sinh nhật.</Text>
                <Button className="btn-gold" style={{ marginTop: 15, width: 200 }}>NÂNG CẤP NGAY</Button>
              </div>
           </div>
        )}

        <div style={{ textAlign: 'center', marginBottom: 80, marginTop: 50 }}>
          <Title level={2} style={{ fontFamily: '"Source Serif 4", serif' }}>KHO VOUCHER</Title>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            centered 
            className="luxury-tabs"
            items={[
              { key: 'NEW', label: <span className="tab-flex"><UserPlus size={20}/> Khách Mới</span> },
              { key: 'PERCENT', label: <span className="tab-flex"><Percent size={20}/> Giảm %</span> },
              { key: 'FIXED', label: <span className="tab-flex"><Coins size={20}/> Tiền Mặt</span> },
            ]}
          />
          <Row gutter={[24, 24]} style={{ marginTop: 40 }}>
            {loading ? <Spin size="large" /> : vouchers
              .filter(v => {
                if (activeTab === 'NEW') return v.isForNewCustomer;
                if (activeTab === 'PERCENT') return v.discountType === 'PERCENT' && !v.isForNewCustomer;
                if (activeTab === 'FIXED') return (v.discountType === 'FIXED_AMOUNT' || v.discountType === 'FIXED') && !v.isForNewCustomer;
                return true;
              })
              .slice(0, 4) 
              .map(v => {
                const isCollected = myVouchers.some(mv => mv.id === v.id);
                return (
                  <Col xs={24} md={12} key={v.id}>
                    <div className="real-ticket-ui">
                      <div className="ticket-left-bg">
                        <span className="discount-text">{v.discountValue}{v.discountType === 'PERCENT' ? '%' : 'K'}</span>
                        <div className="cut-circle top"></div><div className="cut-circle bottom"></div>
                      </div>
                      <div className="ticket-right-bg">
                        <div style={{ flex: 1, textAlign: 'left' }}>
                          <Title level={4} style={{ margin: 0, color: THEME.NAVY_DARK }}>{v.code}</Title>
                          {/* 4. HIỂN THỊ ĐIỀU KIỆN VOUCHER */}
                          <Paragraph style={{ color: '#64748b', fontSize: 11, margin: 0 }}>
                            Đơn từ {v.minOrderValue?.toLocaleString()}đ • Giảm tối đa {v.maxDiscount?.toLocaleString() || '---'}đ
                          </Paragraph>
                          <Text type="secondary" style={{ fontSize: 10 }}>Hạn dùng: {v.expiryDate || 'Vô thời hạn'}</Text>
                        </div>
                        <Button 
                          className="btn-copy-ticket" 
                          onClick={() => collectVoucher(v)}
                          disabled={isCollected}
                          style={isCollected ? {borderColor: '#d9d9d9', color: '#8c8c8c'} : {}}
                        >
                          {isCollected ? "ĐÃ NHẬN" : "COPY"}
                        </Button>
                      </div>
                    </div>
                  </Col>
                )
              })}
          </Row>
        </div>

        <div style={{ padding: '40px 0', borderTop: '2px dashed #ddd' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 25 }}>
            <div style={{ background: THEME.DARK_RED, padding: 8, borderRadius: 10 }}><Ticket size={28} color="#fff" weight="fill" /></div>
            <Title level={3} style={{ margin: 0, fontFamily: '"Source Serif 4", serif' }}>VOUCHER CỦA TÔI ({myVouchers.length})</Title>
          </div>
          <div className="my-vouchers-scroll">
            {myVouchers.length > 0 ? myVouchers.map(v => (
               <div key={v.id} style={{ minWidth: 340 }}>
                  <div className="real-ticket-ui small-ticket">
                    <div className="ticket-left-bg"><span style={{fontSize: 18, fontWeight: 'bold'}}>{v.discountValue}{v.discountType === 'PERCENT' ? '%' : 'K'}</span></div>
                    <div className="ticket-right-bg">
                      <div style={{ flex: 1, textAlign: 'left' }}><Text strong style={{ fontSize: 13 }}>{v.code}</Text></div>
                      <Tag color="gold">SẴN SÀNG</Tag>
                    </div>
                  </div>
               </div>
            )) : <div className="empty-box">Chưa có voucher nào. Hãy tham gia trò chơi để nhận ngay!</div>}
          </div>
        </div>
      </div>

      <Modal open={isGridModalOpen} onCancel={() => setIsGridModalOpen(false)} footer={null} width={750} centered title={`CHỌN ${gridType === 'BOX' ? 'HỘP QUÀ' : 'THẺ BÀI'}`}>
        <div className="grid-15-layout">
          {[...Array(15)].map((_, i) => (
            <motion.div key={i} whileHover={{ scale: 1.05 }} className="card-15" style={{ background: gridType === 'BOX' ? '#fff' : THEME.NAVY_DARK }} onClick={() => { setIsGridModalOpen(false); setIsResultModalOpen(true); }}>
              {gridType === 'BOX' ? <Gift size={32} color={THEME.DARK_RED} /> : <Crown size={32} color={THEME.GOLD} />}
              <Text strong style={{ color: gridType === 'BOX' ? THEME.DARK_RED : THEME.GOLD }}>#{i + 1}</Text>
            </motion.div>
          ))}
        </div>
      </Modal>

      <Modal open={isScratchModalOpen} onCancel={() => setIsScratchModalOpen(false)} footer={null} centered>
        <div style={{ textAlign: 'center' }}>
          <Title level={4}>CÀO LỚP PHỦ VÀNG</Title>
          <div className="scratch-container" onMouseMove={() => setScratchProgress(p => Math.min(p + 2, 100))}>
            <div className="scratch-result">{revealedVoucher?.code}</div>
            <div className="scratch-cover" style={{ opacity: 1 - scratchProgress / 100 }}><HandWaving size={40} /></div>
          </div>
          {scratchProgress >= 100 && <Button type="primary" block className="btn-red" onClick={() => { setIsScratchModalOpen(false); setIsResultModalOpen(true); }}>NHẬN VOUCHER</Button>}
        </div>
      </Modal>

      <Modal open={isMusicModalOpen} onCancel={() => setIsMusicModalOpen(false)} footer={null} centered width={350}>
        <div style={{ textAlign: 'center', padding: 20 }}>
          <LockKey size={60} color={THEME.NAVY_DARK} />
          <Title level={4} style={{ margin: '20px 0' }}>MÃ KÉT SẮT</Title>
          <InputNumber min={0} max={99} defaultValue={Math.floor(Math.random() * 100)} size="large" style={{ width: 100, marginBottom: 20 }} />
          <Button type="primary" block className="btn-navy" onClick={() => { setIsMusicModalOpen(false); setIsResultModalOpen(true); }}>MỞ KÉT</Button>
        </div>
      </Modal>

      <Modal open={isResultModalOpen} onCancel={() => setIsResultModalOpen(false)} footer={null} centered>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <MagicWand size={64} color={THEME.GOLD} weight="fill" />
          <Title level={2}>XIN CHÚC MỪNG!</Title>
          <div className="result-box">{revealedVoucher?.code}</div>
          <Paragraph type="secondary">
            Đơn tối thiểu: {revealedVoucher?.minOrderValue?.toLocaleString()}đ | Giảm tối đa: {revealedVoucher?.maxDiscount?.toLocaleString()}đ
          </Paragraph>
          <Button type="primary" block onClick={() => collectVoucher(revealedVoucher)} className="btn-red" style={{height: 50}}>THU THẬP & SAO CHÉP</Button>
        </div>
      </Modal>

      <style>{`
        .luxury-hero { height: 380px; display: flex; align-items: center; justify-content: center; background: url("https://i.pinimg.com/1200x/2c/16/33/2c1633b3d7f37db080958612ce2db2f9.jpg") center/cover; position: relative; }
        .overlay-dark { position: absolute; inset: 0; background: rgba(13,24,33,0.85); }
        .hero-content { position: relative; color: #fff; text-align: center; }
        .main-title { color: #fff !important; font-size: 42px !important; font-family: "Source Serif 4", serif !important; letter-spacing: 4px; }
        .sub-title { color: ${THEME.GOLD}; font-weight: bold; letter-spacing: 2px; }

        .label-section { padding-left: 15px; margin-bottom: 25px !important; font-family: "Source Serif 4", serif !important; border-left: 5px solid; }
        .red-label { border-color: ${THEME.DARK_RED}; color: ${THEME.DARK_RED} !important; }
        .navy-label { border-color: ${THEME.NAVY_DARK}; color: ${THEME.NAVY_DARK} !important; }

        .luxury-card { background: #fff; border-radius: 24px; height: 260px; display: flex; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .br-red { border-bottom: 5px solid ${THEME.DARK_RED}; }
        .br-navy { border-bottom: 5px solid ${THEME.NAVY_DARK}; }
        .visual-part { width: 40%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 25px; border-right: 1px dashed #eee; }
        .story-part { width: 60%; padding: 25px; display: flex; flex-direction: column; justify-content: center; }

        .btn-game { border-radius: 12px; height: 42px; font-weight: 800; width: 100%; border: none; font-size: 11px; }
        .btn-red { background: ${THEME.DARK_RED} !important; color: #fff !important; }
        .btn-gold { background: ${THEME.GOLD} !important; color: ${THEME.NAVY_DARK} !important; }

        .real-ticket-ui { display: flex; height: 110px; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 10px rgba(0,0,0,0.08); margin-bottom: 10px; }
        .small-ticket { height: 80px; }
        .ticket-left-bg { width: 110px; background: ${THEME.DARK_RED}; color: #fff; display: flex; align-items: center; justify-content: center; position: relative; }
        .discount-text { font-size: 24px; font-weight: bold; }
        .ticket-right-bg { flex: 1; display: flex; align-items: center; padding: 0 20px; border-left: 2px dashed #f0f0f0; }
        .cut-circle { position: absolute; width: 20px; height: 20px; background: ${THEME.BG_LIGHT}; border-radius: 50%; right: -10px; }
        .cut-circle.top { top: -10px; } .cut-circle.bottom { bottom: -10px; }
        .btn-copy-ticket { border: 2px solid ${THEME.DARK_RED} !important; color: ${THEME.DARK_RED} !important; font-weight: bold; }

        /* RESPONSIVE CSS CHO GRID 15 */
        .grid-15-layout { display: grid; grid-template-columns: repeat(auto-fit, minmax(85px, 1fr)); gap: 12px; padding: 20px 0; }
        .card-15 { height: 90px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border: 2px solid ${THEME.GOLD}; }

        /* LOCKED VIP SECTION */
        .locked-vip-section { background: linear-gradient(rgba(13,24,33,0.9), rgba(13,24,33,0.9)), url('https://img.freepik.com/free-vector/abstract-dark-particles-background_23-2148385311.jpg'); border-radius: 30px; padding: 60px 20px; text-align: center; border: 1px solid ${THEME.GOLD}; position: relative; overflow: hidden; }
        .locked-content { position: relative; z-index: 2; }

        .my-vouchers-scroll { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 20px; scrollbar-width: none; }
        .my-vouchers-scroll::-webkit-scrollbar { display: none; }
        .empty-box { width: 100%; padding: 40px; background: #fff; border: 2px dashed #ddd; border-radius: 20px; text-align: center; color: #999; }

        .wheel-wrap { position: relative; width: 110px; height: 110px; }
        .wheel-body { width: 100%; height: 100%; border-radius: 50%; border: 3px solid ${THEME.GOLD}; background: conic-gradient(${THEME.NAVY_DARK} 0% 25%, ${THEME.DARK_RED} 25% 50%, ${THEME.NAVY_DARK} 50% 75%, ${THEME.DARK_RED} 75% 100%); transition: transform 3s cubic-bezier(0.1, 0, 0, 1); }
        .wheel-pin { position: absolute; top: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 12px solid ${THEME.GOLD}; }

        .scratch-container { position: relative; width: 300px; height: 150px; margin: 20px auto; background: ${THEME.NAVY_DARK}; border-radius: 15px; overflow: hidden; display: flex; align-items: center; justify-content: center; border: 3px solid ${THEME.GOLD}; }
        .scratch-result { color: ${THEME.GOLD}; font-size: 32px; font-weight: bold; }
        .scratch-cover { position: absolute; inset: 0; background: ${THEME.GOLD}; color: #fff; display: flex; align-items: center; justify-content: center; }
        
        .result-box { background: ${THEME.NAVY_DARK}; color: ${THEME.GOLD}; font-size: 36px; font-weight: bold; padding: 25px; border-radius: 20px; margin: 20px 0; }
        .tab-flex { display: flex; align-items: center; gap: 8px; font-weight: bold; }

        @media (max-width: 768px) {
          .luxury-card { flex-direction: column; height: auto; }
          .visual-part, .story-part { width: 100%; border-right: none; }
          .main-title { font-size: 28px !important; }
        }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin, Button, message, Modal, Tabs, InputNumber } from 'antd';
import { 
  Crown, Gift, MagicWand, Cards, Star, Quotes,
  DiamondsFour, MusicNotes, HandWaving, LockKey, UserPlus, Percent, Coins
} from '@phosphor-icons/react';
import { motion } from 'framer-motion';
import { voucherApi } from '../../api/voucherApi';

const { Title, Text, Paragraph } = Typography;

const THEME = {
  NAVY_DARK: '#0D1821', 
  DARK_RED: '#8A1538',  
  GOLD: '#D4AF37',      
  BG_LIGHT: '#F8FAFC',
};

export default function FinalFixVoucherPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('NEW');
  
  const [isGridModalOpen, setIsGridModalOpen] = useState(false);
  const [gridType, setGridType] = useState('BOX'); 
  const [isScratchModalOpen, setIsScratchModalOpen] = useState(false);
  const [isMusicModalOpen, setIsMusicModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);

  const [revealedVoucher, setRevealedVoucher] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [scratchProgress, setScratchProgress] = useState(0);

  useEffect(() => {
    const fetchVouchers = async () => {
      try {
        setLoading(true);
        const res = await voucherApi.getAll(true);
        setVouchers(res || []);
      } catch (error) { console.error(error); }
      finally { setLoading(false); }
    };
    fetchVouchers();
  }, []);

  const handleOpenGame = (type) => {
    setRevealedVoucher(vouchers[Math.floor(Math.random() * vouchers.length)]);
    if (type === 'WHEEL') {
        setIsSpinning(true); setRotation(rotation + 1800 + Math.random() * 360);
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
        <Button className={`btn-game ${color === THEME.DARK_RED ? 'btn-red' : 'btn-gold'}`} onClick={() => handleOpenGame(type)} loading={type==='WHEEL' ? isSpinning : type==='DICE' ? isDiceRolling : false}>
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
      {/* HERO SECTION */}
      <div className="luxury-hero">
        <div className="overlay-dark" />
        <div className="hero-content">
          <Crown size={60} color={THEME.GOLD} weight="fill" />
          <Title className="main-title">ƯU ĐÃI HẤP DẪN</Title>
          <div style={{ height: 2, width: 60, background: THEME.GOLD, margin: '10px auto' }} />
          <Text className="sub-title">ABC HOTEL</Text>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '80px auto 0', padding: '0 20px' }}>
        {/* HÀNG 1: ĐỎ ĐÔ */}
        <Title level={3} className="label-section red-label">ƯU ĐÃI THỊNH VƯỢNG</Title>
        <Row gutter={[32, 32]} style={{ marginBottom: 50 }}>
          <Col xs={24} lg={12}>
            {renderGameCard("Vòng Quay Di Sản", "Xoay trục thời gian để nhận về những ưu đãi mang đậm dấu ấn hoàng gia.", 
              <div className="wheel-wrap"><div className="wheel-body" style={{ transform: `rotate(${rotation}deg)` }} /><div className="wheel-pin" /></div>, 
              THEME.DARK_RED, "#fff5f5", "QUAY THƯỞNG", "WHEEL")}
          </Col>
          <Col xs={24} lg={12}>
            {renderGameCard("Hộp Quà Bí Mật", "Khám phá 15 lựa chọn ẩn chứa những món quà tri ân tinh tế nhất.", 
              <Gift size={60} color={THEME.DARK_RED} weight="duotone" />, THEME.DARK_RED, "#fff5f5", "MỞ HỘP QUÀ", "BOX")}
          </Col>
          <Col xs={24}>
            {renderGameCard("Cào Thẻ May Mắn", "Dùng đôi tay của bạn để 'gỡ bỏ' lớp phủ hoàng gia và lộ diện Voucher bí ẩn.", 
              <HandWaving size={60} color={THEME.DARK_RED} weight="fill" />, THEME.DARK_RED, "#fff5f5", "CÀO THẺ NGAY", "SCRATCH")}
          </Col>
        </Row>

        {/* HÀNG 2: XANH NAVY */}
        <Title level={3} className="label-section navy-label">KHO TÀNG DI SẢN</Title>
        <Row gutter={[32, 32]}>
          <Col xs={24} lg={12}>
            {renderGameCard("Thẻ Bài Quý Tộc", "Những quân bài định mệnh sẽ dẫn lối bạn đến với không gian nghỉ dưỡng lý tưởng.", 
              <Cards size={60} color={THEME.GOLD} weight="duotone" />, THEME.NAVY_DARK, THEME.NAVY_DARK, "LẬT THẺ BÀI", "CARD")}
          </Col>
          <Col xs={24} lg={12}>
            {renderGameCard("Xúc Xắc Tài Lộc", "Để vận may lên tiếng thông qua những nhịp đập của quân xúc xắc vàng.", 
              <DiamondsFour size={60} color={THEME.GOLD} weight="fill" />, THEME.NAVY_DARK, THEME.NAVY_DARK, "GIEO XÚC XẮC", "DICE")}
          </Col>
          <Col xs={24}>
            {renderGameCard("Giai Điệu Di Sản", "Xoay mã số két sắt theo nhịp điệu để mở ra kho tàng ưu đãi quý giá.", 
              <MusicNotes size={60} color={THEME.GOLD} weight="fill" />, THEME.NAVY_DARK, THEME.NAVY_DARK, "MỞ KÉT SẮT", "MUSIC")}
          </Col>
        </Row>

        {/* DANH SÁCH VOUCHER RĂNG CƯA MỚI */}
        <div style={{ marginTop: 100, textAlign: 'center' }}>
          <Title level={2} style={{ fontFamily: '"Source Serif 4", serif' }}>KHO VOUCHER</Title>
          <Tabs activeKey={activeTab} onChange={setActiveTab} centered className="luxury-tabs"
              items={[
                { key: 'NEW', label: <span className="tab-flex"><UserPlus size={20}/> Khách Mới</span> },
                { key: 'PERCENT', label: <span className="tab-flex"><Percent size={20}/> Giảm %</span> },
                { key: 'FIXED', label: <span className="tab-flex"><Coins size={20}/> Tiền Mặt</span> },
              ]}
            />
          <Row gutter={[24, 24]} style={{ marginTop: 40 }}>
            {vouchers.filter(v => (activeTab === 'NEW' ? v.isForNewCustomer : activeTab === 'PERCENT' ? v.discountType === 'PERCENT' : v.discountType === 'FIXED_AMOUNT')).map(v => (
              <Col xs={24} md={12} key={v.id}>
                <div className="real-ticket-ui">
                  <div className="ticket-left-bg">
                    <span className="discount-text">{v.discountValue}{v.discountType === 'PERCENT' ? '%' : 'K'}</span>
                    <div className="cut-circle top"></div>
                    <div className="cut-circle bottom"></div>
                  </div>
                  <div className="ticket-right-bg">
                    <div style={{ flex: 1 }}>
                      <Title level={4} style={{ margin: 0, color: THEME.NAVY_DARK }}>{v.code}</Title>
                      <Paragraph ellipsis={{ rows: 1 }} style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{v.description}</Paragraph>
                    </div>
                    <Button className="btn-copy-ticket" onClick={() => {navigator.clipboard.writeText(v.code); message.success('Đã copy mã!');}}>COPY</Button>
                    <div className="dashed-line"></div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </div>

      <style>{`
        .luxury-hero { position: relative; height: 380px; display: flex; align-items: center; justify-content: center; background-image: url("https://i.pinimg.com/1200x/2c/16/33/2c1633b3d7f37db080958612ce2db2f9.jpg"); background-size: cover; }
        .overlay-dark { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(13,24,33,0.9), ${THEME.NAVY_DARK}); }
        .hero-content { position: relative; text-align: center; z-index: 1; }
        .main-title { color: #fff !important; font-size: 42px !important; font-family: "Source Serif 4", serif !important; letter-spacing: 4px; }
        .sub-title { color: ${THEME.GOLD}; font-weight: 800; letter-spacing: 2px; font-size: 13px; }

        .label-section { padding-left: 15px; margin-bottom: 25px !important; font-family: "Source Serif 4", serif !important; }
        .red-label { border-left: 5px solid ${THEME.DARK_RED}; color: ${THEME.DARK_RED} !important; }
        .navy-label { border-left: 5px solid ${THEME.NAVY_DARK}; color: ${THEME.NAVY_DARK} !important; }

        .luxury-card { background: #fff; border-radius: 24px; height: 260px; display: flex; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
        .br-red { border-bottom: 5px solid ${THEME.DARK_RED}; }
        .br-navy { border-bottom: 5px solid ${THEME.NAVY_DARK}; }
        .visual-part { width: 40%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 25px; border-right: 1px dashed #eee; }
        .story-part { width: 60%; padding: 25px; display: flex; flex-direction: column; justify-content: center; }

        .btn-game { border-radius: 12px; height: 42px; font-weight: 800; width: 100%; border: none; font-size: 11px; }
        .btn-red { background: ${THEME.DARK_RED}; color: #fff; }
        .btn-gold { background: ${THEME.GOLD}; color: ${THEME.NAVY_DARK}; }

        /* TICKET UI MỚI: RĂNG CƯA KHOÉT SÂU */
        .real-ticket-ui { display: flex; height: 110px; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.08)); }
        .ticket-left-bg { width: 110px; background: ${THEME.DARK_RED}; color: #fff; display: flex; align-items: center; justify-content: center; position: relative; border-radius: 16px 0 0 16px; }
        .discount-text { font-size: 26px; font-weight: 900; z-index: 2; }
        
        .ticket-right-bg { flex: 1; background: #fff; border-radius: 0 16px 16px 0; display: flex; align-items: center; padding: 0 25px; position: relative; border-left: 2px dashed #f0f0f0; }
        
        /* Vết khoét tròn */
        .cut-circle { position: absolute; width: 24px; height: 24px; background: ${THEME.BG_LIGHT}; border-radius: 50%; right: -12px; z-index: 5; }
        .cut-circle.top { top: -12px; }
        .cut-circle.bottom { bottom: -12px; }
        
        .btn-copy-ticket { border: 2px solid ${THEME.DARK_RED}; color: ${THEME.DARK_RED}; font-weight: 800; border-radius: 8px; }

        .wheel-wrap { position: relative; width: 110px; height: 110px; }
        .wheel-body { width: 100%; height: 100%; border-radius: 50%; border: 3px solid ${THEME.GOLD}; background: conic-gradient(${THEME.NAVY_DARK} 0% 25%, ${THEME.DARK_RED} 25% 50%, ${THEME.NAVY_DARK} 50% 75%, ${THEME.DARK_RED} 75% 100%); transition: transform 3s cubic-bezier(0.1, 0, 0, 1); }
        .wheel-pin { position: absolute; top: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 12px solid ${THEME.GOLD}; z-index: 5; }

        .grid-15-layout { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; padding: 15px 0; }
        .card-15 { height: 100px; border-radius: 15px; display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; border: 2px solid ${THEME.GOLD}; transition: 0.2s; }
        .tab-flex { display: flex; align-items: center; gap: 8px; font-weight: bold; }
      `}</style>

      {/* MODAL 15 Ô: CHUẨN 5x3 */}
      <Modal title={`CHỌN ${gridType === 'BOX' ? 'HỘP QUÀ' : 'THẺ BÀI'} MAY MẮN`} open={isGridModalOpen} onCancel={() => setIsGridModalOpen(false)} footer={null} width={750} centered>
        <div className="grid-15-layout">
          {[...Array(15)].map((_, i) => (
            <div key={i} className="card-15" style={{ background: gridType === 'BOX' ? '#fff' : THEME.NAVY_DARK }} onClick={() => { setIsGridModalOpen(false); setIsResultModalOpen(true); }}>
              {gridType === 'BOX' ? <Gift size={28} color={THEME.DARK_RED} weight="duotone" /> : <Crown size={28} color={THEME.GOLD} weight="fill" />}
              <Text style={{ fontSize: 11, marginTop: 5, fontWeight: 'bold', color: gridType === 'BOX' ? THEME.NAVY_DARK : THEME.GOLD }}>#{i + 1}</Text>
            </div>
          ))}
        </div>
      </Modal>

      {/* MODAL CÀO THẺ: CÀO LÀ HIỆN */}
      <Modal open={isScratchModalOpen} onCancel={() => setIsScratchModalOpen(false)} footer={null} centered width={450}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Title level={4}>CÀO LỚP PHỦ VÀNG</Title>
          <div style={{ position: 'relative', width: '300px', height: '150px', margin: '30px auto', background: THEME.NAVY_DARK, borderRadius: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `3px solid ${THEME.GOLD}` }}>
            <div style={{ color: THEME.GOLD, fontSize: 32, fontWeight: 'bold' }}>{revealedVoucher?.code}</div>
            <motion.div onMouseMove={() => setScratchProgress(prev => Math.min(prev + 1.5, 100))}
              style={{ position: 'absolute', inset: 0, zIndex: 10, background: `linear-gradient(135deg, ${THEME.GOLD}, #B8860B)`, opacity: 1 - scratchProgress / 100, cursor: 'crosshair', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HandWaving size={40} color="#fff" />
            </motion.div>
          </div>
          {scratchProgress >= 100 && <Button type="primary" block style={{ background: THEME.DARK_RED }} onClick={() => { setIsScratchModalOpen(false); setIsResultModalOpen(true); }}>NHẬN VOUCHER</Button>}
        </div>
      </Modal>

      {/* MODAL KÉT SẮT */}
      <Modal open={isMusicModalOpen} onCancel={() => setIsMusicModalOpen(false)} footer={null} centered width={350}>
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <div style={{ background: '#f1f5f9', padding: '30px', borderRadius: '50%', width: '120px', height: '120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `4px solid ${THEME.NAVY_DARK}` }}>
            <LockKey size={60} color={THEME.NAVY_DARK} weight="fill" />
          </div>
          <Title level={4} style={{ margin: '20px 0' }}>MỞ KHÓA KÉT SẮT</Title>
          <InputNumber min={0} max={99} defaultValue={0} size="large" style={{ width: '100px', marginBottom: 20 }} />
          <Button type="primary" block style={{ background: THEME.NAVY_DARK, color: THEME.GOLD }} onClick={() => { setIsMusicModalOpen(false); setIsResultModalOpen(true); }}>XÁC NHẬN</Button>
        </div>
      </Modal>

      {/* MODAL KẾT QUẢ */}
      <Modal open={isResultModalOpen} onCancel={() => setIsResultModalOpen(false)} footer={null} centered>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <MagicWand size={64} color={THEME.GOLD} weight="fill" />
          <Title level={2} style={{ fontFamily: '"Source Serif 4", serif' }}>XIN CHÚC MỪNG!</Title>
          <div style={{ background: THEME.NAVY_DARK, color: THEME.GOLD, padding: '25px', borderRadius: 20, fontSize: 36, fontWeight: 'bold', margin: '20px 0' }}>{revealedVoucher?.code}</div>
          <Button type="primary" block onClick={() => { navigator.clipboard.writeText(revealedVoucher?.code); message.success('Đã copy!'); setIsResultModalOpen(false); }} style={{ background: THEME.DARK_RED, height: 50 }}>SAO CHÉP MÃ</Button>
        </div>
      </Modal>
    </div>
  );
}
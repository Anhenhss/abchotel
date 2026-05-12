import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, Spin, Button, message, Modal } from 'antd';
import { 
  Crown, Gift, MagicWand, Cards, Quotes,
  DiamondsFour, MusicNotes, HandWaving, Lock
} from '@phosphor-icons/react';
import { voucherApi } from '../../api/voucherApi';

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
  const [user, setUser] = useState(null);

  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [revealedVoucher, setRevealedVoucher] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isDiceRolling, setIsDiceRolling] = useState(false);

  // 1. CẬP NHẬT USER & ĐỒNG BỘ LOCALSTORAGE
  const updateUser = useCallback(() => {
    try {
      const savedUser = localStorage.getItem('user');
      if (savedUser && savedUser !== "undefined" && savedUser !== "null") {
        setUser(JSON.parse(savedUser));
      } else {
        setUser(null);
      }
    } catch (e) {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    updateUser();
    window.addEventListener('storage', updateUser);
    window.addEventListener('userLoginSuccess', updateUser);
    return () => {
      window.removeEventListener('storage', updateUser);
      window.removeEventListener('userLoginSuccess', updateUser);
    };
  }, [updateUser]);

  // 2. TẢI DỮ LIỆU BAN ĐẦU
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoading(true);
        const res = await voucherApi.getAll(true);
        setVouchers(res || []);
        
        const saved = localStorage.getItem('my_vouchers');
        if (saved) setMyVouchers(JSON.parse(saved));
      } catch (error) {
        console.error("Lỗi tải dữ liệu:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // 3. THU THẬP VOUCHER (SỬA LỖI KIỂM TRA ĐĂNG NHẬP)
  const collectVoucher = (v) => {
    if (!v) return;

    // KIỂM TRA TRỰC TIẾP TỪ LOCALSTORAGE ĐỂ TRÁNH LỖI STATE CHẬM
    const savedUserStr = localStorage.getItem('user');
    const isActuallyLoggedIn = savedUserStr && savedUserStr !== "null" && savedUserStr !== "undefined";

    if (!isActuallyLoggedIn) {
      message.error("Bạn cần đăng nhập để thực hiện thao tác này!");
      return;
    }

    const isCollected = myVouchers.some(item => item.id === v.id);
    if (!isCollected) {
      const updated = [v, ...myVouchers];
      setMyVouchers(updated);
      localStorage.setItem('my_vouchers', JSON.stringify(updated));
      message.success('Tuyệt vời! Mã ưu đãi đã được lưu vào kho của bạn.');
      
      // Nếu có API backend để lưu vĩnh viễn, gọi ở đây:
      // voucherApi.collect(v.id).catch(() => console.log("Lưu backend thất bại, đã lưu local"));
    } else {
      message.info("Bạn đã thu thập mã này trước đó rồi.");
    }

    if (v.code) navigator.clipboard.writeText(v.code);
    setIsResultModalOpen(false);
  };

  // 4. XỬ LÝ TRÒ CHƠI (SỬA LỖI KHÔNG CÓ VOUCHER PHÙ HỢP)
  const handleOpenGame = async (type) => {
    let currentVouchers = vouchers;

    // Nếu chưa có dữ liệu, thử tải lại ngay lập tức
    if (currentVouchers.length === 0) {
      const hide = message.loading("Đang kết nối kho dữ liệu...", 0);
      try {
        const res = await voucherApi.getAll(true);
        if (res && res.length > 0) {
          setVouchers(res);
          currentVouchers = res;
        }
      } catch (err) {
        console.error(err);
      } finally {
        hide();
      }
    }

    if (currentVouchers.length === 0) {
      message.warning("Hiện tại chưa có ưu đãi mới, vui lòng quay lại sau!");
      return;
    }

    processGame(type, currentVouchers);
  };

  const processGame = (type, list) => {
    const rand = list[Math.floor(Math.random() * list.length)];
    setRevealedVoucher(rand);

    if (type === 'WHEEL') {
      setIsSpinning(true);
      setRotation(prev => prev + 1800 + Math.random() * 360);
      setTimeout(() => { setIsSpinning(false); setIsResultModalOpen(true); }, 3000);
    } else if (type === 'DICE') {
      setIsDiceRolling(true);
      setTimeout(() => { setIsDiceRolling(false); setIsResultModalOpen(true); }, 1500);
    } else {
      setIsResultModalOpen(true);
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

  const isVipUser = !!(user?.membership?.tierName?.toUpperCase() === 'VIP' || user?.membership_id === 5);

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

        {!user ? (
          <div className="locked-vip-section">
            <div className="locked-content">
              <Lock size={40} color={THEME.GOLD} weight="fill" />
              <Title level={4} style={{ color: '#fff', marginTop: 15 }}>KHÁM PHÁ ĐẶC QUYỀN</Title>
              <Text style={{ color: '#aab' }}>Hãy đăng nhập để tham gia trò chơi và lưu giữ các mã giảm giá vào tài khoản cá nhân.</Text>
            </div>
          </div>
        ) : !isVipUser ? (
          <div className="locked-vip-section" style={{ background: 'linear-gradient(rgba(20, 30, 48, 0.9), rgba(36, 59, 85, 0.9))' }}>
            <div className="locked-content">
              <Crown size={40} color="#C0C0C0" weight="fill" />
              <Title level={4} style={{ color: '#fff', marginTop: 15 }}>ĐẶC QUYỀN VIP Đang Khóa</Title>
              <Text style={{ color: '#aab' }}>Xin chào {user.full_name}, nâng cấp thẻ hội viên để mở khóa các phần quà giá trị cao hơn.</Text>
            </div>
          </div>
        ) : (
          <div style={{ padding: '40px 30px', background: `linear-gradient(135deg, ${THEME.NAVY_DARK} 0%, #1a2a3a 100%)`, borderRadius: '24px', border: `2px solid ${THEME.GOLD}`, marginBottom: 50, textAlign: 'center', boxShadow: `0 10px 30px rgba(212, 175, 55, 0.2)` }}>
            <Crown size={50} color={THEME.GOLD} weight="fill" />
            <Title level={3} style={{ color: THEME.GOLD, marginTop: 10, fontFamily: '"Source Serif 4", serif' }}>THÀNH VIÊN KIM CƯƠNG</Title>
            <Text style={{ color: '#fff', fontSize: 16 }}>Chúc mừng bạn! Toàn bộ kho ưu đãi cao cấp nhất đã sẵn sàng dành cho bạn.</Text>
          </div>
        )}
      </div>

      <Modal open={isResultModalOpen} onCancel={() => setIsResultModalOpen(false)} footer={null} centered>
        <div style={{ textAlign: 'center', padding: 40 }}>
          <MagicWand size={64} color={THEME.GOLD} weight="fill" />
          <Title level={2}>XIN CHÚC MỪNG!</Title>
          <div className="result-box">{revealedVoucher?.code}</div>
          <Button type="primary" block onClick={() => collectVoucher(revealedVoucher)} className="btn-red" style={{height: 50}}>NHẬN NGAY</Button>
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
        .locked-vip-section { background: linear-gradient(rgba(13,24,33,0.9), rgba(13,24,33,0.9)), url('https://img.freepik.com/free-vector/abstract-dark-particles-background_23-2148385311.jpg'); border-radius: 30px; padding: 60px 20px; text-align: center; border: 1px solid ${THEME.GOLD}; position: relative; overflow: hidden; }
        .wheel-wrap { position: relative; width: 110px; height: 110px; }
        .wheel-body { width: 100%; height: 100%; border-radius: 50%; border: 3px solid ${THEME.GOLD}; background: conic-gradient(${THEME.NAVY_DARK} 0% 25%, ${THEME.DARK_RED} 25% 50%, ${THEME.NAVY_DARK} 50% 75%, ${THEME.DARK_RED} 75% 100%); transition: transform 3s cubic-bezier(0.1, 0, 0, 1); }
        .wheel-pin { position: absolute; top: -5px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 12px solid ${THEME.GOLD}; z-index: 2; }
        .result-box { background: ${THEME.NAVY_DARK} !important; color: ${THEME.GOLD} !important; font-size: 36px; font-weight: bold; padding: 25px; border-radius: 20px; margin: 20px 0; }
      `}</style>
    </div>
  );
}
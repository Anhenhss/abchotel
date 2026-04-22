import React, { useState, useEffect, useMemo } from 'react';
import { notification, Spin, Empty, Tabs } from 'antd';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useSignalR } from '../hooks/useSignalR';

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Montserrat:wght@400;600;700&display=swap');

  :root {
    --bg-deep: #050b18;
    --card-blue: #0a1f44;
    --card-red: #4a0e0e;
    --border-blue: #1e3a8a;
    --border-red: #7f1d1d;
    --neon-blue: #3b82f6;
    --neon-red: #ef4444;
    --gold: #c9a227;
  }

  .page-container { 
    background: var(--bg-deep); 
    min-height: 100vh; 
    padding: 40px 20px;
    color: white;
    font-family: 'Montserrat', sans-serif;
  }

  /* Header */
  .header-section { text-align: center; margin-bottom: 40px; }
  .header-title { 
    font-family: 'Playfair Display', serif; 
    font-size: 3.5rem; 
    font-weight: 900; 
    letter-spacing: 2px;
    text-transform: uppercase;
    background: linear-gradient(to bottom, #ffffff, #a1a1a1);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 20px rgba(255,255,255,0.2);
  }

  /* Tabs */
  .ant-tabs-nav { border: none !important; margin-bottom: 40px !important; }
  .ant-tabs-tab { background: rgba(255,255,255,0.05) !important; border-radius: 30px !important; padding: 8px 25px !important; margin: 0 10px !important; border: 1px solid rgba(255,255,255,0.1) !important; }
  .ant-tabs-tab-active { background: rgba(255,255,255,0.15) !important; border-color: var(--gold) !important; }
  .ant-tabs-tab-btn { color: #888 !important; font-weight: 600; text-transform: uppercase; font-size: 0.8rem; }
  .ant-tabs-tab-active .ant-tabs-tab-btn { color: white !important; }
  .ant-tabs-ink-bar { display: none !important; }

  /* Grid */
  .voucher-grid { 
    display: grid; 
    grid-template-columns: repeat(3, 1fr); 
    gap: 25px; 
    max-width: 1400px; 
    margin: 0 auto; 
  }

  /* Card Base */
  .v-card {
    position: relative;
    border-radius: 20px;
    padding: 25px;
    height: 100%;
    border: 2px solid transparent;
    transition: all 0.3s ease;
    overflow: hidden;
    cursor: pointer;
    display: flex;
    flex-direction: column;
  }

  /* Blue Theme */
  .v-card.blue {
    background: linear-gradient(145deg, #0a1f44, #050d1a);
    border-color: var(--border-blue);
  }
  .v-card.blue:hover { box-shadow: 0 0 25px var(--neon-blue); border-color: var(--neon-blue); }

  /* Red Theme */
  .v-card.red {
    background: linear-gradient(145deg, #2d0808, #120404);
    border-color: var(--border-red);
  }
  .v-card.red:hover { box-shadow: 0 0 25px var(--neon-red); border-color: var(--neon-red); }

  /* Badge Circle */
  .v-badge-circle {
    position: absolute;
    top: 20px; left: 20px;
    width: 70px; height: 70px;
    border-radius: 50%;
    background: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: black;
    box-shadow: 0 0 15px rgba(255,255,255,0.3);
    z-index: 2;
  }
  .v-badge-circle span:first-child { font-size: 0.6rem; font-weight: 800; line-height: 1; }
  .v-badge-circle span:last-child { font-size: 0.9rem; font-weight: 900; }

  /* Content */
  .v-header-content { margin-left: 90px; text-align: left; min-height: 80px; }
  .v-title { font-family: 'Playfair Display', serif; font-size: 1.6rem; font-weight: 700; color: #f4d06f; line-height: 1.2; text-transform: uppercase; }
  
  .v-middle-content { display: flex; align-items: flex-end; justify-content: space-between; margin-top: 15px; }
  .v-discount-large { font-family: 'Playfair Display', serif; font-size: 4.5rem; font-weight: 900; line-height: 1; }
  .v-discount-unit { font-size: 1.5rem; vertical-align: super; }

  .v-info-text { flex: 1; margin-left: 20px; font-size: 0.85rem; color: #ccc; line-height: 1.4; }

  /* Code Section */
  .v-code-row {
    background: rgba(0,0,0,0.3);
    border-radius: 10px;
    padding: 10px 15px;
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border: 1px solid rgba(255,255,255,0.1);
  }
  .v-code-label { font-size: 0.7rem; color: #888; font-weight: 700; }
  .v-code-value { color: var(--neon-blue); font-weight: 800; font-family: monospace; font-size: 1.1rem; }
  .v-card.red .v-code-value { color: var(--neon-red); }

  /* Watermark */
  .v-watermark {
    position: absolute;
    bottom: -20px; right: -10px;
    font-family: 'Playfair Display', serif;
    font-size: 9rem;
    font-weight: 900;
    opacity: 0.05;
    pointer-events: none;
  }

  .v-footer-info { margin-top: 15px; font-size: 0.75rem; color: #666; display: flex; gap: 15px; }

  @media (max-width: 1100px) { .voucher-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 768px) { .voucher-grid { grid-template-columns: 1fr; } }
`;

const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default function ClientVoucherPage() {
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const signalR = useSignalR() || {};

  useEffect(() => {
    fetchVouchers();
    if (signalR.connection) {
      signalR.connection.on("ReceiveNewVoucher", (v) => setVouchers(p => [v, ...p]));
      return () => signalR.connection.off("ReceiveNewVoucher");
    }
  }, [signalR.connection]);

  const fetchVouchers = async () => {
    try {
      const res = await axios.get('http://localhost:5035/api/Vouchers', { withCredentials: true });
      setVouchers(Array.isArray(res.data) ? res.data : []);
    } catch (err) { setVouchers([]); }
    finally { setLoading(false); }
  };

  const filteredVouchers = useMemo(() => {
    if (activeTab === 'ALL') return vouchers;
    if (activeTab === 'PERCENT') return vouchers.filter(v => v.discountType === 'PERCENT');
    if (activeTab === 'CASH') return vouchers.filter(v => v.discountType !== 'PERCENT');
    return vouchers.filter(v => v.minBookingValue >= 2000000);
  }, [vouchers, activeTab]);

  return (
    <div className="page-container">
      <header className="header-section">
        <h1 className="header-title">Ưu đãi đặc biệt</h1>
      </header>

      <Tabs 
        centered 
        onChange={(key) => setActiveTab(key)}
        items={[
          { label: 'TẤT CẢ', key: 'ALL' },
          { label: '% GIẢM GIÁ', key: 'PERCENT' },
          { label: 'TIỀN MẶT', key: 'CASH' },
          { label: 'HẠNG VIP', key: 'VIP' },
        ]}
      />

      <section className="voucher-section">
        {loading ? <Spin size="large" style={{display:'block', margin:'50px auto'}}/> : (
          <div className="voucher-grid">
            <AnimatePresence mode='popLayout'>
              {filteredVouchers.map((v, index) => {
                const isBlue = index % 2 === 0;
                const isPercent = v.discountType === 'PERCENT';
                
                return (
                  <motion.div 
                    layout
                    key={v.id || index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`v-card ${isBlue ? 'blue' : 'red'}`}
                  >
                    <div className="v-badge-circle">
                      <span>{isBlue ? 'FLASH' : 'VIP'}</span>
                      <span>{isBlue ? 'SALE' : 'LIMIT'}</span>
                    </div>

                    <div className="v-watermark">{isPercent ? v.discountValue : 'V'}</div>

                    <div className="v-header-content">
                      <div className="v-title">Giảm {isPercent ? `${v.discountValue}%` : `${(v.discountValue/1000)}k`} cho {isBlue ? 'Kỳ nghỉ' : 'Dịch vụ'}</div>
                    </div>

                    <div className="v-middle-content">
                      <div className="v-discount-large">
                        {isPercent ? v.discountValue : (v.discountValue/1000)}
                        <span className="v-discount-unit">{isPercent ? '%' : 'k'}</span>
                      </div>
                      <div className="v-info-text">
                        Đặt từ {v.minBookingValue?.toLocaleString()}đ. <br/>
                        Áp dụng cho mọi hạng phòng {isBlue ? 'Suite' : 'Deluxe'}.
                      </div>
                    </div>

                    <div className="v-code-row">
                      <span className="v-code-label">MÃ VOUCHER</span>
                      <span className="v-code-value">{v.code}</span>
                      <button 
                        style={{background:'none', border:'none', color:'white', cursor:'pointer'}}
                        onClick={() => {
                          navigator.clipboard.writeText(v.code);
                          notification.success({ message: 'Đã sao chép mã!' });
                        }}
                      >
                        <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                      </button>
                    </div>

                    <div className="v-footer-info">
                      <span>HSD: {v.validTo ? new Date(v.validTo).toLocaleDateString() : 'Vô hạn'}</span>
                      <span>•</span>
                      <span>{isBlue ? 'Đã dùng 80%' : 'Chỉ còn 5 mã'}</span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </section>
    </div>
  );
}
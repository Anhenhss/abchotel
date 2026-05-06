import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Typography, Button, Space, Steps, Divider, Spin, notification, Result, Tag } from 'antd';
import { 
  CheckCircle, WarningCircle, ArrowRight, ShieldCheck, DownloadSimple, Wallet, CreditCard, ArrowLeft, Check
} from '@phosphor-icons/react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import html2canvas from 'html2canvas';

import { invoiceApi } from '../../../api/invoiceApi';
import { useSignalR } from '../../../hooks/useSignalR';

const { Title, Text } = Typography;

// Đồng bộ màu sắc 5 sao với các trang trước
const THEME = {
  NAVY_DARK: '#0A192F',      
  NAVY_LIGHT: '#172A45',     
  DARK_RED: '#9E2A2B',       
  GOLD: '#D4AF37',           
  GRAY_BG: '#F4F7F6',        
  BORDER: '#E2E8F0',
  TEXT_MUTED: '#64748B',
  SUCCESS: '#10b981'
};

export default function PaymentPage() {
  const { bookingCode } = useParams(); // URL dạng: /payment/BK-20260409111213
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  
  // States
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('PENDING'); // PENDING | SUCCESS | FAILED
  const [isPolling, setIsPolling] = useState(false);
  const [loadingGateway, setLoadingGateway] = useState(null);
  
  const receiptRef = useRef(null); // Ref để chụp ảnh bill

  // 1. Fetch dữ liệu hóa đơn dựa trên Booking Code (API lấy trực tiếp từ C#)
  const fetchInvoiceData = async () => {
    try {
      // Gọi API GetInvoiceByBookingCodeAsync đã viết trong C#
      const res = await invoiceApi.getByBookingCode(bookingCode);
      if (res) {
        setInvoice(res);
        if (res.status === 'Paid') {
          setPaymentStatus('SUCCESS');
          setIsPolling(false);
        }
      } else {
        api.error({ message: 'Lỗi', description: 'Không tìm thấy thông tin đơn hàng.' });
        setPaymentStatus('FAILED');
      }
    } catch (error) {
      console.error(error);
      api.error({ message: 'Lỗi', description: 'Có lỗi xảy ra khi tải hóa đơn.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (bookingCode) fetchInvoiceData();
  }, [bookingCode]);

  // Lắng nghe SignalR để cập nhật realtime (Nếu Lễ tân thu tiền mặt hộ)
  useSignalR((notif) => {
    if (notif.title?.includes("Thanh toán mới") && notif.content?.includes(bookingCode)) {
       fetchInvoiceData(); // Load lại data nếu có người thanh toán
    }
  });

  // 2. Thuật toán Polling (Chạy ngầm kiểm tra thanh toán)
  // Vì API C# trả về HTML tự tắt Tab (window.close), trang này cần tự check xem khách thanh toán xong chưa
  useEffect(() => {
    let interval;
    if (isPolling && paymentStatus === 'PENDING') {
      interval = setInterval(async () => {
        try {
          const res = await invoiceApi.getByBookingCode(bookingCode);
          if (res && res.status === 'Paid') {
            setIsPolling(false);
            setPaymentStatus('SUCCESS');
            setInvoice(res);
            api.success({
                message: 'Thanh toán thành công',
                description: 'Hệ thống đã ghi nhận thanh toán của quý khách.',
                icon: <CheckCircle color={THEME.SUCCESS} weight="fill" />
            });
          }
        } catch (e) { console.error("Polling error", e); }
      }, 3000); // Cứ 3 giây hỏi API 1 lần
    }
    return () => clearInterval(interval);
  }, [isPolling, paymentStatus, bookingCode, api]);

  // 3. Hàm gọi Cổng Thanh Toán
  const handlePayment = async (gateway) => {
    if (!invoice) return;
    try {
      setLoadingGateway(gateway);
      let res;
      if (gateway === 'VNPAY') {
        res = await invoiceApi.createVnPayUrl(invoice.id);
      } else if (gateway === 'MOMO') {
        res = await invoiceApi.createMoMoUrl(invoice.id);
      }

      if (res && res.url) {
        // Mở popup chứa cổng thanh toán, hiển thị mã QR của VNPay/MoMo
        const width = 600; const height = 700;
        const left = (window.innerWidth - width) / 2;
        const top = (window.innerHeight - height) / 2;
        window.open(res.url, 'PaymentGateway', `width=${width},height=${height},top=${top},left=${left}`);
        
        // Bật chế độ lắng nghe tự động
        setIsPolling(true);
      }
    } catch (error) {
      api.error({ message: 'Lỗi kết nối', description: error.response?.data?.message || 'Không thể mở cổng thanh toán.' });
    } finally {
      setLoadingGateway(null);
    }
  };

  // 4. Tính năng: Chụp ảnh Bill tải về (Rất chuyên nghiệp cho khách sạn)
  const handleDownloadBill = async () => {
    if (!receiptRef.current) return;
    try {
      // Sử dụng html2canvas để biến thẻ DIV thành Ảnh PNG chất lượng cao
      const canvas = await html2canvas(receiptRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const image = canvas.toDataURL('image/png');
      
      const link = document.createElement('a');
      link.href = image;
      link.download = `ABC_Hotel_Bill_${bookingCode}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      api.success({ message: 'Đã tải xuống', description: 'Hóa đơn đã được lưu dưới dạng ảnh thành công.' });
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Không thể tải ảnh hóa đơn lúc này.' });
    }
  };

  if (loading) {
    return (
      <div className="payment-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" /> <Text style={{ marginLeft: 16 }}>Đang xử lý dữ liệu...</Text>
      </div>
    );
  }

  if (paymentStatus === 'FAILED' || !invoice) {
    return (
      <div className="payment-wrapper">
        <div className="container-inner" style={{ paddingTop: 60, textAlign: 'center' }}>
          <Result status="error" title="Không tìm thấy đơn hàng" subTitle={`Mã Booking: ${bookingCode} không hợp lệ hoặc đã bị hủy.`}
            extra={<Button type="primary" onClick={() => navigate('/')}>Về trang chủ</Button>}
          />
        </div>
      </div>
    );
  }

  // Tiền cần thanh toán (FinalTotal trừ đi số đã cọc nếu có)
  const amountToPay = (invoice.finalTotal || 0) - (invoice.amountPaid || 0);

  return (
    <div className="payment-wrapper" translate="no">
      {contextHolder}

      {/* THANH TIẾN TRÌNH */}
      <div className="booking-topbar hide-on-print">
        <div className="container-inner">
            <Steps current={paymentStatus === 'SUCCESS' ? 3 : 2} className="luxury-steps" items={[
                { title: 'Chọn Hạng Phòng' },
                { title: 'Dịch Vụ' },
                { title: 'Thanh Toán' }
            ]} />
        </div>
      </div>

      <div className="container-inner" style={{ marginTop: 40 }}>
        {paymentStatus === 'PENDING' ? (
          /* ======================================================== */
          /* MÀN HÌNH CHỌN CỔNG THANH TOÁN (KHI ĐANG CHỜ THANH TOÁN)    */
          /* ======================================================== */
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="payment-methods-section">
            <Row justify="center">
              <Col xs={24} md={16} lg={12}>
                <Card className="checkout-card" bordered={false}>
                  
                  {isPolling ? (
                    // Đang chờ khách quét mã bên cửa sổ kia
                    <div className="polling-state">
                      <div className="radar-spinner"></div>
                      <Title level={3} style={{ color: THEME.NAVY_DARK, marginTop: 24 }}>Đang chờ thanh toán...</Title>
                      <Text type="secondary" style={{ fontSize: 16 }}>
                        Vui lòng quét mã QR trên cửa sổ thanh toán vừa mở.<br/>Hệ thống sẽ tự động chuyển hướng khi giao dịch hoàn tất.
                      </Text>
                      <Button style={{ marginTop: 24 }} onClick={() => setIsPolling(false)}>Hủy giao dịch / Chọn cổng khác</Button>
                    </div>
                  ) : (
                    // Chưa chọn cổng, hiển thị nút VNPay và MoMo
                    <>
                      <div className="header-text-center">
                        <Title level={2} style={{ color: THEME.NAVY_DARK, margin: 0 }}>Thanh Toán Trực Tuyến</Title>
                        <Text type="secondary">Mã đặt phòng: <Text strong style={{ color: THEME.DARK_RED, fontSize: 16 }}>{invoice.bookingCode}</Text></Text>
                      </div>

                      <div className="amount-display box-glow">
                        <Text className="label">Tổng tiền cần thanh toán</Text>
                        <div className="amount">
                          {new Intl.NumberFormat('vi-VN').format(amountToPay)}<span className="currency">₫</span>
                        </div>
                      </div>

                      <Divider style={{ margin: '32px 0 24px 0' }}><Text type="secondary">Chọn phương thức thanh toán</Text></Divider>

                      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                        {/* NÚT VNPAY */}
                        <Button 
                          className="payment-btn vnpay-btn" 
                          block 
                          loading={loadingGateway === 'VNPAY'}
                          onClick={() => handlePayment('VNPAY')}
                        >
                          <div className="btn-content">
                            <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418189687.png" alt="VNPay" height={28} />
                            <span className="btn-text">Thanh toán bằng thẻ ATM / VNPay QR</span>
                          </div>
                          <ArrowRight size={20} className="arrow-icon" />
                        </Button>

                        {/* NÚT MOMO */}
                        <Button 
                          className="payment-btn momo-btn" 
                          block 
                          loading={loadingGateway === 'MOMO'}
                          onClick={() => handlePayment('MOMO')}
                        >
                          <div className="btn-content">
                            <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" height={28} />
                            <span className="btn-text">Thanh toán bằng Ví MoMo</span>
                          </div>
                          <ArrowRight size={20} className="arrow-icon" />
                        </Button>
                      </Space>

                      <div className="security-badge">
                        <ShieldCheck size={20} color={THEME.SUCCESS}/> 
                        <Text style={{ fontSize: 13, color: THEME.TEXT_MUTED }}>Thông tin thanh toán được mã hóa và bảo mật 100%.</Text>
                      </div>
                    </>
                  )}
                </Card>
              </Col>
            </Row>
          </motion.div>
        ) : (
          /* ======================================================== */
          /* MÀN HÌNH THÀNH CÔNG VÀ HIỂN THỊ BILL CHUẨN 5 SAO          */
          /* ======================================================== */
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="receipt-section">
            <Row justify="center" gutter={[32, 32]}>
              <Col xs={24} lg={12}>
                {/* Khu vực Action Button */}
                <div className="action-bar hide-on-print">
                  <Button type="text" icon={<ArrowLeft size={18}/>} onClick={() => navigate('/')}>Về trang chủ</Button>
                  <Button type="primary" className="btn-download" icon={<DownloadSimple size={20} />} onClick={handleDownloadBill}>
                    Tải Ảnh Hóa Đơn
                  </Button>
                </div>

                {/* THIẾT KẾ BILL KHÁCH SẠN */}
                <div className="receipt-container" ref={receiptRef}>
                  
                  {/* WATERMARK BẢN QUYỀN */}
                  <div className="receipt-watermark">PAID</div>

                  <div className="receipt-header">
                    <div className="logo-area">
                       {/* Thay bằng Logo thật của bạn nếu có */}
                       <div className="mock-logo">ABC HOTEL</div> 
                       <Text className="hotel-slogan">Nơi đẳng cấp hội tụ</Text>
                    </div>
                    <div className="receipt-title">
                      <Title level={3} style={{ margin: 0, color: THEME.NAVY_DARK }}>HÓA ĐƠN ĐIỆN TỬ</Title>
                      <Text type="secondary" style={{ fontSize: 12 }}>E-RECEIPT</Text>
                    </div>
                  </div>

                  <Divider style={{ borderBlockStart: '2px dashed #e2e8f0', margin: '20px 0' }} />

                  {/* THÔNG TIN CHUNG */}
                  <Row gutter={16} className="receipt-info-grid">
                    <Col span={12}>
                      <Text className="info-label">Khách hàng / Guest:</Text>
                      <Text className="info-value">{invoice.guestName || 'Khách hàng'}</Text>
                    </Col>
                    <Col span={12} style={{ textAlign: 'right' }}>
                      <Text className="info-label">Mã Booking / Booking No:</Text>
                      <Text className="info-value highlight-code">{invoice.bookingCode}</Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 12 }}>
                      <Text className="info-label">Mã hóa đơn / Invoice No:</Text>
                      <Text className="info-value">INV-{invoice.id.toString().padStart(6, '0')}</Text>
                    </Col>
                    <Col span={12} style={{ marginTop: 12, textAlign: 'right' }}>
                      <Text className="info-label">Ngày tạo / Date:</Text>
                      <Text className="info-value">{dayjs(invoice.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                    </Col>
                  </Row>

                  <Divider style={{ margin: '20px 0' }} />

                  {/* CHI TIẾT DỊCH VỤ DỰA TRÊN API C# TRẢ VỀ */}
                  <div className="receipt-details">
                    <Text strong style={{ fontSize: 14, color: THEME.NAVY_DARK, textTransform: 'uppercase' }}>1. Chi tiết phòng (Room Details)</Text>
                    {invoice.roomDetails && invoice.roomDetails.length > 0 ? (
                      invoice.roomDetails.map((room, idx) => (
                        <div className="receipt-row" key={idx}>
                          <div className="item-name">
                            <Text strong>{room.roomTypeName}</Text>
                            <Text className="sub-text">{dayjs(room.checkIn).format('DD/MM/YY')} - {dayjs(room.checkOut).format('DD/MM/YY')} ({room.duration} ngày/giờ)</Text>
                          </div>
                          <div className="item-price">{new Intl.NumberFormat('vi-VN').format(room.subTotal)}₫</div>
                        </div>
                      ))
                    ) : (
                      <div className="receipt-row"><div className="item-name"><Text>Tiền phòng (Tổng hợp)</Text></div><div className="item-price">{new Intl.NumberFormat('vi-VN').format(invoice.totalRoomAmount)}₫</div></div>
                    )}

                    {invoice.totalServiceAmount > 0 && (
                      <div style={{ marginTop: 16 }}>
                        <Text strong style={{ fontSize: 14, color: THEME.NAVY_DARK, textTransform: 'uppercase' }}>2. Dịch vụ phát sinh (Extra Services)</Text>
                        <div className="receipt-row">
                          <div className="item-name"><Text>Tổng dịch vụ đi kèm</Text></div>
                          <div className="item-price">{new Intl.NumberFormat('vi-VN').format(invoice.totalServiceAmount)}₫</div>
                        </div>
                      </div>
                    )}
                  </div>

                  <Divider style={{ margin: '20px 0' }} />

                  {/* TỔNG KẾT TIỀN */}
                  <div className="receipt-summary">
                    <div className="summary-row">
                      <Text>Cộng tiền hàng (Subtotal):</Text>
                      <Text strong>{new Intl.NumberFormat('vi-VN').format((invoice.totalRoomAmount || 0) + (invoice.totalServiceAmount || 0))}₫</Text>
                    </div>
                    
                    {invoice.discountAmount > 0 && (
                      <div className="summary-row discount">
                        <Text>Giảm giá khuyến mãi (Discount):</Text>
                        <Text strong>-{new Intl.NumberFormat('vi-VN').format(invoice.discountAmount)}₫</Text>
                      </div>
                    )}
                    
                    <div className="summary-row">
                      <Text>Thuế VAT 10% (Tax):</Text>
                      <Text strong>{new Intl.NumberFormat('vi-VN').format(invoice.taxAmount || 0)}₫</Text>
                    </div>
                    
                    <Divider style={{ margin: '12px 0' }} />
                    
                    <div className="summary-row final-total">
                      <Text>TỔNG CỘNG (GRAND TOTAL):</Text>
                      <Text>{new Intl.NumberFormat('vi-VN').format(invoice.finalTotal)}₫</Text>
                    </div>
                  </div>

                  {/* FOOTER CỦA BILL */}
                  <div className="receipt-footer">
                    <div className="paid-stamp">
                      <Check size={24} weight="bold" /> ĐÃ THANH TOÁN
                    </div>
                    <Text className="footer-note">Quý khách vui lòng lưu lại ảnh hóa đơn này để xuất trình khi Check-in tại quầy Lễ tân.</Text>
                    <Text className="footer-thanks">Chân thành cảm ơn quý khách đã chọn ABC Hotel!</Text>
                  </div>

                </div>
              </Col>
            </Row>
          </motion.div>
        )}
      </div>

      <style>{`
        .payment-wrapper { 
          background-color: ${THEME.GRAY_BG}; 
          min-height: 100vh; 
          padding-bottom: 80px; 
          font-family: 'Inter', sans-serif;
        }
        .container-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; } 

        .booking-topbar { 
          background: #fff; border-bottom: 1px solid ${THEME.BORDER}; padding: 20px 0; 
        }
        .luxury-steps .ant-steps-item-process .ant-steps-item-icon, 
        .luxury-steps .ant-steps-item-finish .ant-steps-item-icon { 
          background: ${THEME.NAVY_DARK} !important; border-color: ${THEME.NAVY_DARK} !important; 
        }

        /* --- STYLES CHO MÀN HÌNH CHỌN CỔNG THANH TOÁN --- */
        .checkout-card {
          border-radius: 20px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.06);
          padding: 10px;
        }
        .header-text-center { text-align: center; margin-bottom: 30px; }
        
        .box-glow {
          background: linear-gradient(135deg, ${THEME.NAVY_DARK} 0%, ${THEME.NAVY_LIGHT} 100%);
          border-radius: 16px;
          padding: 24px;
          text-align: center;
          box-shadow: 0 10px 20px rgba(10, 25, 47, 0.2);
          color: white;
        }
        .box-glow .label { display: block; color: rgba(255,255,255,0.8); font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px; }
        .box-glow .amount { font-size: 40px; font-weight: 900; line-height: 1; font-family: '"Source Serif 4", serif'; }
        .box-glow .currency { font-size: 20px; font-weight: 600; vertical-align: top; margin-left: 4px; }

        .payment-btn {
          height: 64px;
          border-radius: 12px;
          border: 2px solid ${THEME.BORDER};
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          transition: all 0.3s;
        }
        .payment-btn .btn-content { display: flex; align-items: center; gap: 16px; }
        .payment-btn .btn-text { font-size: 16px; font-weight: 600; color: ${THEME.NAVY_DARK}; }
        .payment-btn .arrow-icon { color: ${THEME.TEXT_MUTED}; transition: all 0.3s; }
        
        .payment-btn.vnpay-btn:hover { border-color: #005baa; background: #f0f7ff; }
        .payment-btn.vnpay-btn:hover .arrow-icon { color: #005baa; transform: translateX(5px); }
        .payment-btn.momo-btn:hover { border-color: #A50064; background: #fff0f9; }
        .payment-btn.momo-btn:hover .arrow-icon { color: #A50064; transform: translateX(5px); }

        .security-badge { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 32px; background: #ecfdf5; padding: 12px; border-radius: 8px; border: 1px dashed #6ee7b7; }

        /* Hiệu ứng radar loading khi chờ quét mã */
        .polling-state { text-align: center; padding: 40px 0; }
        .radar-spinner {
          width: 80px; height: 80px; margin: 0 auto;
          border-radius: 50%;
          border: 4px solid transparent;
          border-top-color: ${THEME.DARK_RED};
          border-bottom-color: ${THEME.NAVY_DARK};
          animation: spin 1.5s linear infinite;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* --- STYLES CHO HÓA ĐƠN (BILL) 5 SAO --- */
        .action-bar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-download { background: ${THEME.DARK_RED}; border: none; height: 44px; border-radius: 8px; font-weight: bold; }
        .btn-download:hover { background: #7A1A21 !important; }

        .receipt-container {
          background: #ffffff;
          padding: 40px;
          border-radius: 12px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
          /* Họa tiết răng cưa ở viền giống hóa đơn in */
          background-image: radial-gradient(circle at 10px 0, transparent 10px, #ffffff 11px), radial-gradient(circle at 10px 100%, transparent 10px, #ffffff 11px);
          background-size: 20px 10px;
          background-repeat: repeat-x;
          background-position: top, bottom;
          border: 1px solid #e2e8f0;
        }

        .receipt-watermark {
          position: absolute;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 120px;
          font-weight: 900;
          color: rgba(16, 185, 129, 0.04);
          pointer-events: none;
          z-index: 0;
          letter-spacing: 10px;
        }

        .receipt-header { display: flex; justify-content: space-between; align-items: flex-end; position: relative; z-index: 1; }
        .mock-logo { font-family: '"Source Serif 4", serif'; font-size: 28px; font-weight: 900; color: ${THEME.GOLD}; letter-spacing: 2px; line-height: 1; }
        .hotel-slogan { font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: ${THEME.TEXT_MUTED}; }
        .receipt-title { text-align: right; }

        .info-label { display: block; font-size: 11px; color: ${THEME.TEXT_MUTED}; text-transform: uppercase; margin-bottom: 4px; }
        .info-value { font-size: 15px; font-weight: 600; color: ${THEME.NAVY_DARK}; display: block; }
        .highlight-code { color: ${THEME.DARK_RED}; font-size: 18px; font-weight: 800; font-family: monospace; letter-spacing: 1px; }

        .receipt-details, .receipt-summary { position: relative; z-index: 1; }
        .receipt-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #f1f5f9; }
        .receipt-row:last-child { border-bottom: none; }
        .item-name { display: flex; flex-direction: column; }
        .sub-text { font-size: 12px; color: ${THEME.TEXT_MUTED}; margin-top: 4px; }
        .item-price { font-weight: 600; color: ${THEME.NAVY_DARK}; font-size: 15px; }

        .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
        .summary-row.discount { color: ${THEME.DARK_RED}; }
        .summary-row.final-total { font-size: 20px; font-weight: 900; color: ${THEME.NAVY_DARK}; align-items: center; }
        .summary-row.final-total Text:last-child { font-size: 28px; color: ${THEME.DARK_RED}; }

        .receipt-footer { margin-top: 40px; text-align: center; position: relative; z-index: 1; }
        .paid-stamp {
          display: inline-flex; align-items: center; gap: 8px;
          color: ${THEME.SUCCESS}; border: 3px solid ${THEME.SUCCESS};
          padding: 8px 24px; border-radius: 8px;
          font-weight: 900; font-size: 20px; letter-spacing: 2px;
          transform: rotate(-5deg); margin-bottom: 24px;
        }
        .footer-note { display: block; font-size: 12px; color: ${THEME.NAVY_DARK}; margin-bottom: 8px; font-style: italic; }
        .footer-thanks { display: block; font-size: 13px; font-weight: bold; color: ${THEME.TEXT_MUTED}; text-transform: uppercase; }

        @media print {
          body * { visibility: hidden; }
          .receipt-container, .receipt-container * { visibility: visible; }
          .receipt-container { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none; border: none; }
          .hide-on-print { display: none !important; }
        }
        
        @media (max-width: 768px) {
          .receipt-container { padding: 20px; }
          .receipt-header { flex-direction: column; align-items: flex-start; gap: 16px; }
          .receipt-title { text-align: left; }
          .box-glow .amount { font-size: 32px; }
        }
      `}</style>
    </div>
  );
}
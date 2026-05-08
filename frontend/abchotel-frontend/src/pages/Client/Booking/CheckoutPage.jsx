import React, { useState, useEffect, useMemo } from 'react';
import { Row, Col, Card, Typography, Button, Space, Steps, Divider, Form, Input, Radio, notification, Tag, Alert, Modal, Statistic } from 'antd';
import { 
  Bed, SuitcaseRolling, ShieldCheck, ArrowRight, UserCircle, CreditCard, Ticket, CheckCircle, Info, Clock, Check
} from '@phosphor-icons/react';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { motion, AnimatePresence } from 'framer-motion';

import { voucherApi } from '../../../api/voucherApi'; 
import { useSignalR } from '../../../hooks/useSignalR';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Countdown } = Statistic;

const THEME = {
  NAVY_DARK: '#0A192F',      
  DARK_RED: '#9E2A2B',       
  GRAY_BG: '#F4F7F6',        
  BORDER: '#E2E8F0',
  TEXT_MUTED: '#64748B'
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [api, contextHolder] = notification.useNotification();
  const [form] = Form.useForm();

  const bookingState = location.state;

  useEffect(() => {
    if (!bookingState || !bookingState.selectedRooms) {
      navigate('/booking/select-room');
    }
  }, [bookingState, navigate]);

  const duration = useMemo(() => {
    if (!bookingState) return 1;
    const start = dayjs(bookingState.checkIn);
    const end = dayjs(bookingState.checkOut);
    return bookingState.priceType === 'HOURLY' ? Math.max(1, end.diff(start, 'hour')) : Math.max(1, end.diff(start, 'day'));
  }, [bookingState]);

  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState(null); 
  const [isApplying, setIsApplying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('VNPAY');

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [bookingResponse, setBookingResponse] = useState(null); 

  const totalRoomPrice = bookingState?.totalRoomPrice || 0;
  const totalServicePrice = bookingState?.totalServicePrice || 0;
  const subTotal = totalRoomPrice + totalServicePrice; 
  const discountAmount = appliedVoucher ? appliedVoucher.discountAmount : 0;
  const finalTotal = subTotal - discountAmount;

  useSignalR((notif) => {
    if (notif.title?.toLowerCase().includes("khuyến mãi") || notif.title?.toLowerCase().includes("phòng")) {
      api.info({
        message: <Text strong style={{ color: THEME.DARK_RED }}>Thông báo từ hệ thống</Text>,
        description: notif.content,
        placement: 'bottomLeft',
      });
    }
  });

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) {
      api.warning({ message: 'Thông báo', description: 'Vui lòng nhập mã giảm giá.' });
      return;
    }
    try {
      setIsApplying(true);
      const res = await voucherApi.apply({
        code: voucherCode,
        totalBookingValue: subTotal,
        roomTypeId: bookingState.selectedRooms[0]?.roomTypeId || bookingState.selectedRooms[0]?.id
      });
      
      if (res && res.isValid) {
        setAppliedVoucher(res);
        api.success({ message: 'Thành công', description: res.message || 'Mã giảm giá đã được áp dụng.' });
      } else {
        setAppliedVoucher(null);
        api.error({ message: 'Thất bại', description: res?.message || 'Mã không hợp lệ.' });
      }
    } catch (error) {
      setAppliedVoucher(null);
      api.error({ message: 'Lỗi', description: error.response?.data?.message || 'Không thể kiểm tra mã.' });
    } finally {
      setIsApplying(false);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherCode('');
  };

  const onFinish = async (values) => {
    try {
      setIsSubmitting(true);
      
      const bookingPayload = {
        guestName: values.fullName,
        guestPhone: values.phone,
        guestEmail: values.email,
        identityNumber: values.identityNumber, 
        specialRequests: values.notes,
        voucherCode: appliedVoucher ? voucherCode : null,
        rooms: bookingState.selectedRooms.map(r => ({
          roomId: null, 
          roomTypeId: r.roomTypeId || r.id, 
          checkInDate: dayjs(bookingState.checkIn).format('YYYY-MM-DDTHH:mm:ss'),
          checkOutDate: dayjs(bookingState.checkOut).format('YYYY-MM-DDTHH:mm:ss'),
          priceType: bookingState.priceType,
          quantity: 1
        }))
      };

      const mockBackendResponse = {
        bookingId: 999,
        bookingCode: "BK-" + dayjs().format('YYYYMMDDHHmmss'), 
        totalAmount: finalTotal,
        expireAt: dayjs().add(15, 'minute').valueOf(), 
        message: "Giữ chỗ thành công. Vui lòng thanh toán trong 15 phút."
      };

      setTimeout(() => {
        setIsSubmitting(false);
        setBookingResponse(mockBackendResponse);
        setIsModalVisible(true); 
      }, 1500);

    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Có lỗi xảy ra khi tạo yêu cầu đặt phòng.' });
      setIsSubmitting(false);
    }
  };

  const handleProceedPayment = async () => {
     api.info({ message: 'Chuyển hướng', description: `Đang chuyển qua cổng ${paymentMethod}...` });
  };

  const handlePayLater = () => {
     setIsModalVisible(false);
     api.info({ 
       message: 'Đã lưu đơn hàng', 
       description: 'Thông tin đặt phòng của bạn đã được ghi nhận. Vui lòng bấm "Tiếp tục thanh toán" trước khi hết thời gian giữ chỗ nhé!' 
     });
  };

  if (!bookingState) return null;

  return (
    // 🔥 THÊM TRANSLATE="NO" ĐỂ CHỐNG LỖI "THANH THÂN" CỦA GOOGLE
    <div className="checkout-wrapper" translate="no">
      {contextHolder}
      
      <div className="booking-topbar">
        <div className="container-inner">
            {/* 🔥 TẠO LOGIC ICON BỊ BÔI ĐEN KHI ĐANG Ở BƯỚC THANH TOÁN (CURRENT = 2) */}
            <Steps current={2} className="luxury-steps" items={[
                { title: 'Chọn Hạng Phòng', icon: <Bed size={22} color={THEME.NAVY_DARK} /> },
                { title: 'Dịch Vụ', icon: <SuitcaseRolling size={22} color={THEME.NAVY_DARK} /> },
                { 
                  title: 'Thanh Toán', 
                  icon: (
                    <div className="active-step-circle">
                      <ShieldCheck size={18} color="#fff" weight="fill"/>
                    </div>
                  ) 
                }
            ]} />
        </div>
      </div>

      <div className="container-inner" style={{ marginTop: 40 }}>
        <Form form={form} layout="vertical" onFinish={onFinish} disabled={!!bookingResponse}>
          <Row gutter={[32, 32]}>
            
            <Col xs={24} xl={16}>
              <Title level={2} className="main-title">Thông tin thanh toán</Title>
              
              <Card className="form-card" bordered={false}>
                <Space style={{ marginBottom: 16 }}>
                  <UserCircle size={28} color={THEME.DARK_RED} weight="fill"/>
                  <Title level={4} style={{ margin: 0, color: THEME.NAVY_DARK }}>Thông tin liên hệ</Title>
                </Space>
                
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="fullName" label="Họ và tên khách hàng" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}>
                      <Input size="large" placeholder="Nguyễn Văn A" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="phone" label="Số điện thoại" rules={[{ required: true, message: 'Vui lòng nhập số điện thoại' }]}>
                      <Input size="large" placeholder="090xxxxxxx" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="email" label="Email nhận mã đặt phòng" rules={[{ required: true, type: 'email', message: 'Vui lòng nhập email hợp lệ' }]}>
                      <Input size="large" placeholder="example@gmail.com" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="identityNumber" label="Số CMND/CCCD/Passport" rules={[{ required: true, message: 'Vui lòng nhập số CCCD' }]}>
                      <Input size="large" placeholder="Nhập số CCCD/Passport" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item name="notes" label="Ghi chú thêm">
                      <TextArea rows={3} placeholder="Ví dụ: Tôi muốn nhận phòng sớm..." />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card className="form-card" bordered={false} style={{ marginTop: 24 }}>
                <Space style={{ marginBottom: 16 }}>
                  <CreditCard size={28} color={THEME.DARK_RED} weight="fill"/>
                  <Title level={4} style={{ margin: 0, color: THEME.NAVY_DARK }}>Phương thức thanh toán điện tử</Title>
                </Space>

                <Alert 
                  message="Lưu ý quan trọng" 
                  description="Sau khi bấm xác nhận, hệ thống sẽ giữ chỗ cho bạn trong 15 phút. Vui lòng hoàn tất thanh toán VNPay/MoMo trong thời gian này để không bị hủy mã Booking." 
                  type="info" showIcon icon={<Info size={20}/>} style={{ marginBottom: 20 }}
                />

                <Radio.Group onChange={(e) => setPaymentMethod(e.target.value)} value={paymentMethod} style={{ width: '100%' }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    
                    <div className={`payment-method-item ${paymentMethod === 'VNPAY' ? 'active' : ''}`} onClick={!bookingResponse ? () => setPaymentMethod('VNPAY') : undefined}>
                      <Radio value="VNPAY">
                        <Space align="center">
                          <img src="https://vnpay.vn/s1/statics.vnpay.vn/2023/9/06ncktiwd6dc1694418189687.png" alt="VNPay" height={24} />
                          <Text strong>Thanh toán qua cổng VNPAY</Text>
                        </Space>
                      </Radio>
                    </div>

                    <div className={`payment-method-item ${paymentMethod === 'MOMO' ? 'active' : ''}`} onClick={!bookingResponse ? () => setPaymentMethod('MOMO') : undefined}>
                      <Radio value="MOMO">
                        <Space align="center">
                          <img src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png" alt="MoMo" height={24} />
                          <Text strong>Thanh toán qua Ví điện tử MoMo</Text>
                        </Space>
                      </Radio>
                    </div>

                  </Space>
                </Radio.Group>
              </Card>
            </Col>

            <Col xs={24} xl={8}>
              <div className="sticky-bill">
                  <Card variant="borderless" className="white-bill-card">
                      <Title level={4} className="bill-title">Tóm tắt hóa đơn</Title>
                      
                      <div className="bill-date-box">
                          <div className="date-item">
                              <Text className="date-lbl">Nhận phòng</Text>
                              <Text className="date-val">{dayjs(bookingState.checkIn).format('DD/MM/YYYY')}</Text>
                          </div>
                          <div className="date-divider"><ArrowRight/></div>
                          <div className="date-item" style={{textAlign: 'right'}}>
                              <Text className="date-lbl">Trả phòng</Text>
                              <Text className="date-val">{dayjs(bookingState.checkOut).format('DD/MM/YYYY')}</Text>
                          </div>
                      </div>

                      <Divider style={{ margin: '16px 0' }} className="mobile-hide"/>

                      <div className="summary-row mobile-hide">
                          <Text>Tiền phòng</Text>
                          <Text strong>{new Intl.NumberFormat('vi-VN').format(totalRoomPrice)}₫</Text>
                      </div>
                      <div className="summary-row mobile-hide">
                          <Text>Dịch vụ thêm</Text>
                          <Text strong>{new Intl.NumberFormat('vi-VN').format(totalServicePrice)}₫</Text>
                      </div>

                      <div className="voucher-section mobile-hide">
                        <Text strong style={{ fontSize: 13, display: 'block', marginBottom: 8 }}><Ticket size={16}/> Voucher giảm giá</Text>
                        <Space.Compact style={{ width: '100%' }}>
                          <Input 
                            placeholder="Nhập mã ưu đãi..." 
                            value={voucherCode} 
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            disabled={!!appliedVoucher || !!bookingResponse}
                          />
                          {appliedVoucher ? (
                            <Button danger onClick={handleRemoveVoucher} disabled={!!bookingResponse}>Hủy</Button>
                          ) : (
                            <Button style={{ background: THEME.NAVY_DARK, color: '#fff' }} onClick={handleApplyVoucher} loading={isApplying} disabled={!!bookingResponse}>Áp dụng</Button>
                          )}
                        </Space.Compact>
                        {appliedVoucher && (
                           <div style={{ marginTop: 8 }}><Tag color="success">Đã giảm {new Intl.NumberFormat('vi-VN').format(discountAmount)}₫</Tag></div>
                        )}
                      </div>

                      <Divider style={{ margin: '16px 0' }} className="mobile-hide"/>

                      <div className="total-area">
                          <Text className="total-label">Tổng thanh toán</Text>
                          <div className="total-amount">
                            {new Intl.NumberFormat('vi-VN').format(finalTotal)}<span style={{ fontSize: 18, verticalAlign: 'top' }}>₫</span>
                          </div>
                      </div>

                      <Button block className="btn-proceed" htmlType={bookingResponse ? "button" : "submit"} onClick={bookingResponse ? () => setIsModalVisible(true) : undefined} loading={isSubmitting}>
                          {bookingResponse ? 'TIẾP TỤC THANH TOÁN' : 'XÁC NHẬN GIỮ CHỖ'}
                      </Button>

                      {!bookingResponse && (
                          <Button type="link" block style={{ marginTop: 12, color: THEME.TEXT_MUTED }} onClick={() => navigate(-1)}>
                              Quay lại chỉnh sửa
                          </Button>
                      )}
                  </Card>
              </div>
            </Col>

          </Row>
        </Form>
      </div>

      <Modal
        open={isModalVisible}
        footer={null}
        closable={false}
        maskClosable={false}
        centered
        width={450}
      >
        <div style={{ textAlign: 'center', padding: '10px 0' }}>
            <div className="success-icon-wrapper">
                <Check size={40} color="#fff" weight="bold" />
            </div>
            
            <Title level={3} style={{ color: THEME.NAVY_DARK, marginTop: 16 }}>Giữ phòng thành công!</Title>
            <Text style={{ fontSize: 15, color: THEME.TEXT_MUTED }}>
                Mã đặt phòng của bạn là:
            </Text>
            
            <div className="booking-code-box">
                {bookingResponse?.bookingCode}
            </div>

            <div className="countdown-box">
               <Text strong style={{ color: THEME.DARK_RED, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 15 }}>
                  <Clock size={20} /> Vui lòng thanh toán trong:
               </Text>
               <Countdown 
                  value={bookingResponse?.expireAt} 
                  format="mm:ss" 
                  onFinish={() => {
                     api.error({ message: 'Hết giờ', description: 'Đơn đặt phòng đã bị hủy do quá thời gian thanh toán.' });
                     setIsModalVisible(false);
                     navigate('/'); 
                  }}
                  valueStyle={{ color: THEME.DARK_RED, fontSize: 32, fontWeight: 'bold' }} 
               />
            </div>

            <Button block size="large" className="btn-proceed" style={{ marginTop: 24, height: 50 }} onClick={handleProceedPayment}>
                THANH TOÁN QUA {paymentMethod} NGAY
            </Button>
            
            <Button type="link" onClick={handlePayLater} style={{ marginTop: 12, color: THEME.TEXT_MUTED }}>
                Tôi muốn thanh toán sau
            </Button>
        </div>
      </Modal>

      <style>{`
        .checkout-wrapper { 
          background-color: ${THEME.GRAY_BG}; 
          min-height: 100vh; 
          padding-bottom: 80px; 
        }

        .container-inner { 
          max-width: 1200px; 
          margin: 0 auto; 
          padding: 0 20px; 
        }

        .booking-topbar { 
          background: #fff; 
          border-bottom: 1px solid ${THEME.BORDER}; 
          padding: 15px 0; 
          position: sticky; 
          top: 0; 
          z-index: 100; 
        }

        /* 🔥 CSS XỬ LÝ LÀM ĐẸP THANH STEPS GIỐNG Y HỆT ẢNH */
        .luxury-steps .ant-steps-item-icon { 
          background: transparent !important; 
          border: none !important; 
          display: flex !important;
          align-items: center;
          justify-content: center;
        }

        .active-step-circle { 
          width: 32px; 
          height: 32px; 
          background-color: ${THEME.NAVY_DARK}; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
        }

        .luxury-steps .ant-steps-item-title {
          color: ${THEME.NAVY_DARK} !important;
          font-weight: 600 !important;
          line-height: 32px !important;
        }

        .luxury-steps .ant-steps-item-process .ant-steps-item-title {
          font-weight: 800 !important;
        }
        /* ======================================================= */

        .main-title { 
          color: ${THEME.NAVY_DARK} !important; 
          margin-bottom: 24px !important; 
          font-size: 26px !important; 
        }

        .form-card { 
          border-radius: 12px; 
          box-shadow: 0 2px 10px rgba(0,0,0,0.05); 
        }

        .payment-method-item { 
          border: 1px solid ${THEME.BORDER}; 
          border-radius: 8px; 
          padding: 15px; 
          margin-bottom: 12px; 
          cursor: pointer; 
          background: #fff; 
        }

        .payment-method-item.active { 
          border-color: ${THEME.DARK_RED}; 
          background: #fff9f9; 
        }

        .white-bill-card { 
          border-radius: 12px; 
          padding: 20px; 
          box-shadow: 0 4px 20px rgba(0,0,0,0.08); 
          border: 1px solid ${THEME.BORDER}; 
        }

        .bill-date-box { 
          display: flex; 
          align-items: center; 
          justify-content: space-between; 
          background: #f8fafc; 
          padding: 10px 15px; 
          border-radius: 8px; 
        }

        .summary-row { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 10px; 
        }

        .voucher-section { 
          margin-top: 15px; 
          padding: 15px; 
          background: #f0f4f8; 
          border-radius: 8px; 
        }

        .total-area { 
          text-align: right; 
          margin-bottom: 20px; 
        }

        .total-amount { 
          font-size: 30px; 
          font-weight: 800; 
          color: ${THEME.NAVY_DARK}; 
        }

        /* 🔥 ĐÃ FIX CHỐNG LỖI CẮT CHỮ CHO NÚT BẤM DÀI */
        .btn-proceed { 
          min-height: 50px; 
          height: auto; 
          padding: 12px 16px;
          white-space: normal;
          word-break: break-word;
          line-height: 1.4;
          border-radius: 8px; 
          font-weight: 700; 
          background: ${THEME.DARK_RED}; 
          color: #fff; 
          border: none; 
        }

        /* Modal Styles */
        .success-icon-wrapper { 
          width: 80px; 
          height: 80px; 
          background: #10b981; 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          margin: 0 auto; 
          box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3); 
        }

        .booking-code-box { 
          background: #f1f5f9; 
          border: 2px dashed ${THEME.NAVY_DARK}; 
          padding: 12px 24px; 
          font-size: 24px; 
          font-weight: 900; 
          letter-spacing: 2px; 
          color: ${THEME.NAVY_DARK}; 
          border-radius: 12px; 
          margin: 16px auto; 
          display: inline-block; 
        }

        .countdown-box { 
          background: #fef2f2; 
          border-radius: 12px; 
          padding: 16px; 
          margin-top: 16px; 
          border: 1px solid #fecaca; 
        }

        /* 🔥 MOBILE RESPONSIVE BOTTOM SHEET */
        @media (max-width: 992px) {
          .sticky-bill { 
            position: fixed; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            z-index: 1000; 
            box-shadow: 0 -10px 20px rgba(0,0,0,0.1); 
          }

          .white-bill-card { 
            border-radius: 20px 20px 0 0; 
            padding: 16px 20px; 
            border-bottom: none; 
          }

          .mobile-hide, 
          .bill-title, 
          .bill-date-box { 
            display: none; 
          }

          .total-area { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin: 0 0 12px 0; 
            text-align: left; 
          }

          .total-amount { 
            font-size: 24px; 
            margin-top: 0; 
          }

          .checkout-wrapper { 
            padding-bottom: 140px; 
          }
        }
      `}</style>
    </div>
  );
}
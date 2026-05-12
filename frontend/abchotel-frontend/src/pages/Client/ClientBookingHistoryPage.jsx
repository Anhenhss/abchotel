import React, { useState, useEffect } from 'react';
import { 
  Typography, Row, Col, Spin, Empty, Button, Space, Tabs, 
  notification, Drawer, Divider, Modal, Input, Rate, Card, Grid
} from 'antd';
import { 
  Receipt, Bed, Clock, CheckCircle, XCircle, Star, SuitcaseRolling, Key, Printer
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

import { bookingApi } from '../../api/bookingApi';
import { invoiceApi } from '../../api/invoiceApi';
import { reviewApi } from '../../api/reviewApi'; 
import { useSignalR } from '../../hooks/useSignalR';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { useBreakpoint } = Grid;

const THEME = {
  NAVY_DARK: '#0B132B',
  NAVY_LIGHT: '#1C2541',
  GOLD: '#C4A45D',
  BG_LIGHT: '#F8FAFC',
  BORDER: '#E2E8F0',
  TEXT_MAIN: '#334155',
  TEXT_MUTED: '#94A3B8'
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'Pending': return { text: 'Chờ xác nhận', color: '#B48600', bg: '#FFFBE6', border: '#FFE58F', icon: <Clock weight="fill"/> };
    case 'Confirmed': return { text: 'Đã xác nhận', color: '#0284C7', bg: '#E0F2FE', border: '#BAE6FD', icon: <CheckCircle weight="fill"/> };
    case 'CheckedIn': return { text: 'Đang lưu trú', color: '#4F46E5', bg: '#E0E7FF', border: '#C7D2FE', icon: <Key weight="fill"/> };
    case 'Completed': 
    case 'CheckedOut': return { text: 'Đã hoàn tất', color: '#166534', bg: '#DCFCE7', border: '#BBF7D0', icon: <CheckCircle weight="fill"/> };
    case 'Cancelled': return { text: 'Đã hủy', color: '#E11D48', bg: '#FFE4E6', border: '#FECDD3', icon: <XCircle weight="fill"/> };
    default: return { text: status, color: '#64748B', bg: '#F1F5F9', border: '#E2E8F0', icon: <Clock weight="fill"/> };
  }
};

export default function ClientBookingHistoryPage() {
  const screens = useBreakpoint();
  const [api, contextHolder] = notification.useNotification();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBookingToCancel, setSelectedBookingToCancel] = useState(null);
  const [cancelReason, setCancelReason] = useState('');

  const [invoiceDrawerOpen, setInvoiceDrawerOpen] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchMyBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingApi.getMyBookings();
      setBookings(res?.data?.$values || res?.$values || res || []);
    } catch (error) {
      api.error({ message: 'Lỗi tải dữ liệu', description: 'Không thể lấy lịch sử đặt phòng.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMyBookings(); }, []);

  useSignalR((notificationData) => {
    if (notificationData.title?.includes("Đơn đặt phòng")) fetchMyBookings();
  });

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'Completed' && (b.status === 'Completed' || b.status === 'CheckedOut')) return true;
    return b.status === activeTab;
  });

  const handleOpenCancelModal = (booking) => {
    setSelectedBookingToCancel(booking);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      api.warning({ message: 'Thiếu thông tin', description: 'Vui lòng nhập lý do hủy phòng.' });
      return;
    }
    try {
      setLoading(true);
      await bookingApi.updateStatus(selectedBookingToCancel.id, 'Cancelled', cancelReason);
      api.success({ message: 'Thành công', description: 'Đã gửi yêu cầu hủy phòng.' });
      setCancelModalOpen(false);
      fetchMyBookings();
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Không thể hủy phòng lúc này.' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = async (bookingCode) => {
    try {
      setLoadingInvoice(true);
      const res = await invoiceApi.getByBookingCode(bookingCode);
      setSelectedInvoiceData(res.data || res);
      setInvoiceDrawerOpen(true);
    } catch (error) {
      api.info({ message: 'Chưa có hóa đơn', description: 'Đơn đặt phòng này chưa phát sinh hóa đơn hoàn chỉnh.' });
    } finally {
      setLoadingInvoice(false);
    }
  };

  const handleOpenReviewModal = (booking) => {
    setSelectedBookingForReview(booking);
    setRating(5);
    setComment('');
    setReviewModalOpen(true);
  };

  const handleSendReview = async () => {
    if (!comment.trim()) {
      api.warning({ message: 'Thiếu thông tin', description: 'Vui lòng nhập vài dòng chia sẻ.' });
      return;
    }
    try {
      setLoading(true);
      await reviewApi.createReview({
        bookingId: selectedBookingForReview.id,
        rating: rating,
        comment: comment
      });
      api.success({ message: 'Cảm ơn bạn!', description: 'Đánh giá của bạn đã được ghi nhận.' });
      setReviewModalOpen(false);
    } catch (error) {
      api.error({ message: 'Lỗi', description: error.response?.data?.message || 'Có lỗi xảy ra.' });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 THUẬT TOÁN IN ẨN MỚI: HOÀN HẢO VÀ CHUYÊN NGHIỆP
  const handlePrint = () => {
    if (!selectedInvoiceData) return;

    // Mở một cửa sổ ẩn tạm thời
    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      api.warning({ message: 'Bị chặn', description: 'Trình duyệt đang chặn Pop-up. Vui lòng cho phép mở tab mới để in.' });
      return;
    }

    const {
      id, bookingCode, guestName, createdAt, status,
      totalRoomAmount, totalServiceAmount, discountAmount, taxAmount, finalTotal, amountPaid,
      roomDetails, services
    } = selectedInvoiceData;

    const formatMoney = (num) => new Intl.NumberFormat('vi-VN').format(num || 0) + 'đ';

    // Tạo nội dung HTML chuẩn giấy A4
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="utf-8">
          <title>Hóa Đơn - ${bookingCode}</title>
          <style>
              body { font-family: 'Arial', sans-serif; color: #333; margin: 0; padding: 40px; }
              .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0B132B; padding-bottom: 20px; margin-bottom: 30px; }
              .hotel-info h1 { margin: 0; color: #0B132B; font-size: 28px; letter-spacing: 2px; }
              .hotel-info p { margin: 5px 0; color: #555; font-size: 14px; }
              .invoice-info { text-align: right; }
              .invoice-info h2 { margin: 0; color: #0B132B; font-size: 24px; text-transform: uppercase; }
              .invoice-info p { margin: 5px 0; font-size: 14px; color: #555; }
              
              .guest-box { background: #f8fafc; padding: 20px; border-radius: 8px; display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
              .guest-box div p { margin: 5px 0; }
              
              .section-title { font-size: 16px; font-weight: bold; color: #0B132B; border-bottom: 1px solid #ccc; padding-bottom: 8px; margin-bottom: 15px; text-transform: uppercase; }
              
              table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
              th { background: #0B132B; color: white; padding: 10px; text-align: center; }
              th:first-child { text-align: left; }
              th:last-child { text-align: right; }
              td { border-bottom: 1px solid #eee; padding: 12px 10px; text-align: center; }
              td:first-child { text-align: left; }
              td:last-child { text-align: right; font-weight: bold; }
              
              .summary-box { width: 350px; margin-left: auto; font-size: 14px; }
              .summary-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #eee; }
              .summary-row.total { font-size: 20px; font-weight: bold; color: #0B132B; border-bottom: none; border-top: 2px solid #0B132B; padding-top: 15px; margin-top: 5px; }
              
              .footer { margin-top: 60px; text-align: center; font-size: 13px; color: #666; }
              .signature-area { display: flex; justify-content: space-between; margin-top: 50px; padding: 0 50px; }
              .signature-box { text-align: center; }
              .signature-line { margin-top: 80px; border-top: 1px solid #000; width: 150px; padding-top: 5px; }
          </style>
      </head>
      <body>
          <div class="header">
              <div class="hotel-info">
                  <h1>ABC HOTEL</h1>
                  <p>123 Đường Nguyễn Văn Cừ, Biên Hòa, Đồng Nai</p>
                  <p>SĐT: 0901 234 567 | Email: contact@abchotel.vn</p>
              </div>
              <div class="invoice-info">
                  <h2>BIÊN LAI LƯU TRÚ</h2>
                  <p><strong>Mã HĐ:</strong> #${id}</p>
                  <p><strong>Ngày in:</strong> ${dayjs().format('DD/MM/YYYY HH:mm')}</p>
              </div>
          </div>

          <div class="guest-box">
              <div>
                  <p><strong>Khách hàng (Guest):</strong> ${guestName}</p>
                  <p><strong>Mã đặt phòng (Booking Code):</strong> ${bookingCode}</p>
              </div>
              <div style="text-align: right;">
                  <p><strong>Ngày lập (Issue Date):</strong> ${dayjs(createdAt).format('DD/MM/YYYY')}</p>
                  <p><strong>Trạng thái (Status):</strong> ${status === 'Paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}</p>
              </div>
          </div>

          <div class="section-title">Tiền Phòng (Room Charges)</div>
          <table>
              <thead>
                  <tr>
                      <th>Loại phòng</th>
                      <th>Lịch trình</th>
                      <th>Đơn giá</th>
                      <th>Số lượng (Đêm/Giờ)</th>
                      <th>Thành tiền</th>
                  </tr>
              </thead>
              <tbody>
                  ${roomDetails?.$values?.map(room => `
                      <tr>
                          <td>${room.roomTypeName} <br/><span style="font-size: 12px; color: #666;">(Phòng: ${room.roomNumber})</span></td>
                          <td>${dayjs(room.checkIn).format('DD/MM')} - ${dayjs(room.checkOut).format('DD/MM')}</td>
                          <td>${formatMoney(room.price)}</td>
                          <td>${room.duration}</td>
                          <td>${formatMoney(room.subTotal)}</td>
                      </tr>
                  `).join('') || '<tr><td colspan="5" style="text-align: center;">Không có dữ liệu</td></tr>'}
              </tbody>
          </table>

          ${services?.$values?.length > 0 ? `
              <div class="section-title">Dịch Vụ Phát Sinh (Additional Services)</div>
              <table>
                  <thead>
                      <tr>
                          <th>Tên dịch vụ</th>
                          <th>Ngày sử dụng</th>
                          <th>Số lượng</th>
                          <th>Thành tiền</th>
                      </tr>
                  </thead>
                  <tbody>
                      ${services.$values.map(srv => `
                          <tr>
                              <td>${srv.serviceName}</td>
                              <td>${dayjs(srv.date).format('DD/MM/YYYY')}</td>
                              <td>${srv.quantity}</td>
                              <td>${formatMoney(srv.totalAmount)}</td>
                          </tr>
                      `).join('')}
                  </tbody>
              </table>
          ` : ''}

          <div class="summary-box">
              <div class="summary-row">
                  <span>Tổng tiền phòng:</span>
                  <span>${formatMoney(totalRoomAmount)}</span>
              </div>
              <div class="summary-row">
                  <span>Dịch vụ bổ sung:</span>
                  <span>${formatMoney(totalServiceAmount)}</span>
              </div>
              ${discountAmount > 0 ? `
              <div class="summary-row" style="color: #166534;">
                  <span>Giảm giá Voucher:</span>
                  <span>-${formatMoney(discountAmount)}</span>
              </div>` : ''}
              <div class="summary-row">
                  <span>Thuế VAT (10%):</span>
                  <span>${formatMoney(taxAmount)}</span>
              </div>
              <div class="summary-row total">
                  <span>TỔNG CỘNG:</span>
                  <span>${formatMoney(finalTotal)}</span>
              </div>
              <div class="summary-row" style="margin-top: 10px; font-weight: bold; color: ${status === 'Paid' ? '#166534' : '#E11D48'};">
                  <span>Khách đã trả:</span>
                  <span>${formatMoney(amountPaid)}</span>
              </div>
          </div>

          <div class="signature-area">
              <div class="signature-box">
                  <p><strong>Khách hàng</strong></p>
                  <p style="font-size: 12px; color: #666;">(Ký, ghi rõ họ tên)</p>
                  <div class="signature-line"></div>
              </div>
              <div class="signature-box">
                  <p><strong>Nhân viên Lễ tân</strong></p>
                  <p style="font-size: 12px; color: #666;">(Ký, ghi rõ họ tên)</p>
                  <div class="signature-line"></div>
              </div>
          </div>

          <div class="footer">
              <p>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của ABC Hotel.</p>
          </div>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Chờ 0.5s để trình duyệt render xong HTML mới gọi lệnh in
    setTimeout(() => {
      printWindow.print();
      // Đóng cửa sổ ẩn sau khi in xong
      printWindow.close();
    }, 500);
  };

  return (
    <div className="client-history-wrapper" translate="no">
      {contextHolder}

      <div className="history-hero">
        <div className="container-inner">
          <Title level={2} className="hero-title">ABC Hotel</Title>
          <Text className="hero-subtitle">Cảm ơn bạn đã tin tưởng lựa chọn và trải nghiệm dịch vụ tại ABC Hotel.</Text>
        </div>
      </div>

      <div className="container-inner" style={{ marginTop: -30 }}>
        
        <Card variant="borderless" className="tabs-card">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            className="vip-pill-tabs"
            items={[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'Pending', label: 'Chờ xác nhận' },
              { key: 'Confirmed', label: 'Đã xác nhận' },
              { key: 'CheckedIn', label: 'Đang lưu trú' },
              { key: 'Completed', label: 'Đã hoàn tất' },
              { key: 'Cancelled', label: 'Đã hủy' }
            ]} 
          />
        </Card>

        <div className="booking-list-container">
          {loading && bookings.length === 0 ? (
            <div className="loading-state">
              <Spin size="large" />
              <Text style={{ display: 'block', marginTop: 16, color: THEME.TEXT_MUTED }}>Đang tải danh sách đặt phòng...</Text>
            </div>
          ) : filteredBookings.length === 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="empty-state-vip">
              <SuitcaseRolling size={64} color={THEME.BORDER} weight="duotone" />
              <Title level={4} style={{ color: THEME.NAVY_DARK, marginTop: 16 }}>Chưa có kỳ nghỉ nào</Title>
              <Text type="secondary">Bạn chưa có đơn đặt phòng nào trong danh mục này.</Text>
            </motion.div>
          ) : (
            <AnimatePresence>
              {filteredBookings.map((booking, index) => {
                const conf = getStatusConfig(booking.status);
                const inD = booking.expectedCheckIn || booking.actualCheckIn;
                const outD = booking.expectedCheckOut || booking.actualCheckOut;
                
                const showCancel = booking.status === 'Pending';
                const showInvoice = ['Completed', 'CheckedOut', 'Confirmed', 'CheckedIn'].includes(booking.status);
                const showReview = booking.status === 'Completed' || booking.status === 'CheckedOut';

                return (
                  <motion.div 
                    key={booking.id} 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card variant="borderless" className="vip-booking-card">
                      <Row align="middle">
                        
                        <Col xs={24} md={16} className="col-info">
                           <div className="status-badge" style={{ backgroundColor: conf.bg, color: conf.color, borderColor: conf.border }}>
                              {conf.icon} <span className="status-text">{conf.text}</span>
                           </div>
                           
                           <div style={{ marginBottom: 24 }}>
                              <Text className="booking-code-label">MÃ ĐẶT PHÒNG</Text>
                              <Title level={3} className="booking-code-value">{booking.bookingCode}</Title>
                              <Text className="booking-date">Ngày tạo đơn: {dayjs(booking.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
                           </div>

                           <div className="schedule-box">
                              <div className="date-block">
                                  <Text className="date-label">NHẬN PHÒNG</Text>
                                  <Title level={4} className="date-day">{dayjs(inD).format('DD/MM/YYYY')}</Title>
                                  <Text className="date-time">{dayjs(inD).format('HH:mm')}</Text>
                              </div>

                              <div className="timeline-divider">
                                  <div className="line"></div>
                                  <Bed size={24} color={THEME.GOLD} weight="duotone"/>
                                  <div className="line"></div>
                              </div>

                              <div className="date-block text-right">
                                  <Text className="date-label">TRẢ PHÒNG</Text>
                                  <Title level={4} className="date-day">{dayjs(outD).format('DD/MM/YYYY')}</Title>
                                  <Text className="date-time">{dayjs(outD).format('HH:mm')}</Text>
                              </div>
                           </div>
                        </Col>

                        <Col xs={24} md={8} className="col-actions">
                           <div className="action-wrapper">
                              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                                 {showInvoice && (
                                   <Button block className="btn-vip btn-outline" icon={<Receipt size={18}/>} onClick={() => handleViewInvoice(booking.bookingCode)} loading={loadingInvoice}>
                                     Chi tiết & Biên lai
                                   </Button>
                                 )}
                                 {showReview && (
                                   <Button block className="btn-vip btn-gold" icon={<Star size={18} weight="fill"/>} onClick={() => handleOpenReviewModal(booking)}>
                                     Đánh giá kỳ nghỉ
                                   </Button>
                                 )}
                                 {showCancel && (
                                   <Button block className="btn-vip btn-danger" icon={<XCircle size={18}/>} onClick={() => handleOpenCancelModal(booking)}>
                                     Hủy đặt phòng
                                   </Button>
                                 )}
                                 {!showInvoice && !showCancel && !showReview && (
                                   <Button block type="dashed" className="btn-vip" icon={<CheckCircle size={18}/>} disabled>
                                     Không có thao tác
                                   </Button>
                                 )}
                              </Space>
                           </div>
                        </Col>

                      </Row>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      <Modal 
        title={<><XCircle size={22} color="#e11d48" style={{verticalAlign: 'middle', marginRight: 8}}/> Yêu cầu hủy đặt phòng</>}
        open={cancelModalOpen} onCancel={() => setCancelModalOpen(false)}
        onOk={handleConfirmCancel} okText="XÁC NHẬN HỦY" okButtonProps={{ danger: true, size: 'large', style: { borderRadius: 8, fontWeight: 'bold' } }}
        cancelButtonProps={{ size: 'large', style: { borderRadius: 8 } }}
        centered
      >
        <div style={{ padding: '16px 0' }}>
           <Paragraph style={{ fontSize: 15 }}>
             Bạn đang yêu cầu hủy mã phòng <Text strong style={{ color: THEME.NAVY_DARK }}>{selectedBookingToCancel?.bookingCode}</Text>. Hành động này không thể hoàn tác.
           </Paragraph>
           <Text strong style={{ display: 'block', marginBottom: 8, color: THEME.NAVY_DARK }}>Lý do hủy phòng của bạn:</Text>
           <TextArea rows={4} placeholder="Ví dụ: Tôi có việc đột xuất, Tôi muốn đổi ngày..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} style={{ borderRadius: 8, padding: 12 }}/>
        </div>
      </Modal>

      <Modal 
        title={<><Star size={22} color={THEME.GOLD} weight="fill" style={{verticalAlign: 'middle', marginRight: 8}}/> Đánh giá trải nghiệm</>}
        open={reviewModalOpen} onCancel={() => setReviewModalOpen(false)}
        onOk={handleSendReview} okText="GỬI ĐÁNH GIÁ" 
        okButtonProps={{ size: 'large', style: { background: THEME.NAVY_DARK, borderRadius: 8, fontWeight: 'bold' }, loading: loading }}
        cancelButtonProps={{ size: 'large', style: { borderRadius: 8 } }}
        centered
      >
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <Text strong style={{ display: 'block', marginBottom: 16, fontSize: 16, color: THEME.NAVY_DARK }}>Bạn cảm thấy thế nào về khách sạn của chúng tôi?</Text>
          <Rate value={rating} onChange={setRating} style={{ color: THEME.GOLD, fontSize: 36, marginBottom: 24 }} />
          <TextArea rows={5} placeholder="Chia sẻ những điều bạn hài lòng hoặc cần góp ý để khách sạn phục vụ tốt hơn..." value={comment} onChange={e => setComment(e.target.value)} style={{ borderRadius: 8, padding: 12 }}/>
        </div>
      </Modal>

      {/* DRAWER HIỂN THỊ HÓA ĐƠN TRÊN MÀN HÌNH (Giao diện in ấn đã được tách riêng vào hàm handlePrint) */}
      <Drawer
        title={<Title level={4} style={{ margin: 0, fontFamily: '"Source Serif 4", serif', color: THEME.NAVY_DARK }}>Biên lai lưu trú</Title>}
        placement="right" width={screens?.md ? 550 : '100%'}
        onClose={() => setInvoiceDrawerOpen(false)} open={invoiceDrawerOpen}
        headerStyle={{ borderBottom: `1px solid ${THEME.BORDER}`, padding: '20px 24px' }}
      >
        {selectedInvoiceData ? (
          <div className="vip-receipt-screen">
            <Row style={{ marginBottom: 12 }}>
              <Col span={12}><Text className="receipt-text-muted">Mã đặt phòng:</Text></Col>
              <Col span={12} style={{ textAlign: 'right' }}><Text strong>{selectedInvoiceData.bookingCode}</Text></Col>
            </Row>
            <Row style={{ marginBottom: 12 }}>
              <Col span={12}><Text className="receipt-text-muted">Tổng tiền phòng:</Text></Col>
              <Col span={12} style={{ textAlign: 'right' }}><Text strong>{new Intl.NumberFormat('vi-VN').format(selectedInvoiceData.totalRoomAmount)}đ</Text></Col>
            </Row>
            <Row style={{ marginBottom: 12 }}>
              <Col span={12}><Text className="receipt-text-muted">Dịch vụ phát sinh:</Text></Col>
              <Col span={12} style={{ textAlign: 'right' }}><Text strong>{new Intl.NumberFormat('vi-VN').format(selectedInvoiceData.totalServiceAmount)}đ</Text></Col>
            </Row>
            {selectedInvoiceData.discountAmount > 0 && (
              <Row style={{ marginBottom: 12 }}>
                <Col span={12}><Text strong style={{color: '#10b981'}}>Giảm giá Voucher:</Text></Col>
                <Col span={12} style={{ textAlign: 'right' }}><Text strong style={{color: '#10b981'}}>-{new Intl.NumberFormat('vi-VN').format(selectedInvoiceData.discountAmount)}đ</Text></Col>
              </Row>
            )}
            <Row style={{ marginBottom: 12 }}>
              <Col span={12}><Text className="receipt-text-muted">Thuế & Phí (10%):</Text></Col>
              <Col span={12} style={{ textAlign: 'right' }}><Text strong>{new Intl.NumberFormat('vi-VN').format(selectedInvoiceData.taxAmount)}đ</Text></Col>
            </Row>

            <Divider style={{ margin: '16px 0', borderColor: '#e2e8f0' }} dashed/>
            
            <Row align="middle">
              <Col span={10}><Text strong style={{ fontSize: 16, textTransform: 'uppercase' }}>TỔNG CỘNG</Text></Col>
              <Col span={14} style={{ textAlign: 'right' }}>
                <Title level={2} style={{ margin: 0, color: THEME.NAVY_DARK }}>{new Intl.NumberFormat('vi-VN').format(selectedInvoiceData.finalTotal)}đ</Title>
              </Col>
            </Row>
            <Row align="middle" style={{ marginTop: 8 }}>
              <Col span={10}><Text className="receipt-text-muted">Trạng thái:</Text></Col>
              <Col span={14} style={{ textAlign: 'right' }}>
                <Text strong style={{ color: selectedInvoiceData.status === 'Paid' ? '#166534' : '#E11D48' }}>
                   {selectedInvoiceData.status === 'Paid' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                </Text>
              </Col>
            </Row>

            <div style={{ marginTop: 40, textAlign: 'center' }}>
               <Button type="primary" size="large" icon={<Printer size={20} />} onClick={handlePrint} style={{ background: THEME.NAVY_DARK, borderRadius: 8, width: '100%' }}>
                 In Biên Lai (Bản Đẹp)
               </Button>
            </div>
          </div>
        ) : <Empty description="Không có dữ liệu hóa đơn" />}
      </Drawer>

      <style>{`
        .client-history-wrapper { background-color: ${THEME.BG_LIGHT}; min-height: 100vh; padding-bottom: 80px; font-family: 'Inter', sans-serif; }
        .container-inner { max-width: 900px; margin: 0 auto; padding: 0 24px; position: relative; z-index: 10; } 
        
        .history-hero { background: ${THEME.NAVY_DARK}; padding: 60px 24px 80px 24px; text-align: center; }
        .hero-title { color: ${THEME.GOLD} !important; font-family: '"Source Serif 4", serif'; font-size: 32px !important; margin-bottom: 8px !important; }
        .hero-subtitle { color: #cbd5e1; font-size: 15px; }

        .tabs-card { border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); padding: 4px 8px; margin-bottom: 32px; background: #fff; border: 1px solid ${THEME.BORDER}; }
        
        .vip-pill-tabs .ant-tabs-nav::before { display: none !important; }
        .vip-pill-tabs .ant-tabs-tab { padding: 8px 20px; margin: 0 4px; border-radius: 20px; transition: all 0.3s; color: ${THEME.TEXT_MUTED}; font-weight: 500; }
        .vip-pill-tabs .ant-tabs-tab:hover { color: ${THEME.NAVY_DARK}; background: #f1f5f9; }
        .vip-pill-tabs .ant-tabs-tab-active { background: ${THEME.NAVY_DARK} !important; }
        .vip-pill-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: #fff !important; }
        .vip-pill-tabs .ant-tabs-ink-bar { display: none !important; }

        .booking-list-container { display: flex; flex-direction: column; gap: 20px; }

        .vip-booking-card { 
            border-radius: 16px; background: #fff; overflow: hidden;
            border: 1px solid ${THEME.BORDER}; box-shadow: 0 2px 10px rgba(0,0,0,0.02);
            transition: all 0.3s ease; 
        }
        .vip-booking-card:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.06); border-color: #cbd5e1; }
        .vip-booking-card .ant-card-body { padding: 0; }

        .col-info { padding: 24px 32px !important; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: 700; border: 1px solid; margin-bottom: 16px; }
        .booking-code-label { display: block; font-size: 11px; color: ${THEME.TEXT_MUTED}; font-weight: 700; letter-spacing: 1px; margin-bottom: 2px; }
        .booking-code-value { margin: 0 0 4px 0 !important; font-family: '"Source Serif 4", serif'; font-size: 22px !important; color: ${THEME.NAVY_DARK}; }
        .booking-date { font-size: 13px; color: ${THEME.TEXT_MUTED}; }

        .schedule-box { display: flex; align-items: center; justify-content: space-between; margin-top: 24px; padding-top: 24px; border-top: 1px solid ${THEME.BORDER}; }
        
        .date-block { display: flex; flex-direction: column; }
        .date-block.text-right { text-align: right; }
        .date-label { font-size: 11px; font-weight: 700; color: ${THEME.TEXT_MUTED}; letter-spacing: 1px; margin-bottom: 4px; }
        .date-day { margin: 0 !important; font-size: 18px !important; color: ${THEME.NAVY_DARK} !important; font-weight: 700 !important; }
        .date-time { font-size: 13px; color: ${THEME.TEXT_MUTED}; margin-top: 2px; }

        .timeline-divider { display: flex; align-items: center; flex: 1; padding: 0 24px; gap: 12px; }
        .timeline-divider .line { flex: 1; height: 1px; background: #e2e8f0; }

        .col-actions { padding: 24px !important; background: ${THEME.BG_LIGHT}; border-left: 1px solid ${THEME.BORDER}; display: flex; flex-direction: column; justify-content: center; height: 100%; }
        
        .btn-vip { height: 40px; border-radius: 8px; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; transition: all 0.2s; box-shadow: none; }
        
        .btn-outline { background: #fff; border: 1px solid ${THEME.NAVY_DARK}; color: ${THEME.NAVY_DARK}; }
        .btn-outline:hover { background: ${THEME.NAVY_DARK} !important; color: #fff !important; }
        
        .btn-gold { background: ${THEME.GOLD}; border-color: ${THEME.GOLD}; color: #fff; }
        .btn-gold:hover { background: #B3924B !important; border-color: #B3924B !important; color: #fff !important; }
        
        .btn-danger { background: #fff; border-color: #e11d48; color: #e11d48; }
        .btn-danger:hover { background: #e11d48 !important; color: #fff !important; }

        .vip-receipt-screen { padding: 8px; }
        .receipt-text-muted { color: #64748B; }

        .loading-state { text-align: center; padding: 80px 0; }
        .empty-state-vip { text-align: center; padding: 80px 24px; background: #fff; border-radius: 12px; border: 1px dashed #cbd5e1; }

        @media (max-width: 768px) {
            .col-info { padding: 20px !important; }
            .col-actions { border-left: none; border-top: 1px solid ${THEME.BORDER}; padding: 20px !important; }
            .schedule-box { flex-direction: column; align-items: flex-start; gap: 16px; }
            .timeline-divider { display: none; }
            .date-block.text-right { text-align: left; }
        }
      `}</style>
    </div>
  );
}
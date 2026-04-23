import React, { useState, useEffect } from 'react';
import { 
  Typography, Row, Col, Spin, Empty, Button, Tag, Space, Tabs, 
  notification, Drawer, Divider, Timeline, Modal, Input, Rate, message 
} from 'antd';
import { 
  CalendarBlank, Receipt, ArrowRight, Bed, Clock, 
  CheckCircle, XCircle, AirplaneTilt, BellRinging, Key, Star, ChatCenteredText
} from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import dayjs from 'dayjs';

import { bookingApi } from '../../api/bookingApi';
import { invoiceApi } from '../../api/invoiceApi';
import { reviewApi } from '../../api/reviewApi'; // Import API Review
import { useSignalR } from '../../hooks/useSignalR';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const THEME = {
  NAVY_DARK: '#0D1821',
  NAVY_LIGHT: '#1C2E4A',
  DARK_RED: '#8A1538',
  GOLD: '#D4AF37',
  BG_LIGHT: '#F8FAFC'
};

const getStatusConfig = (status) => {
  switch (status) {
    case 'Pending': return { text: 'Chờ xác nhận', color: 'orange', bg: '#fffbe6', border: '#ffe58f' };
    case 'Confirmed': return { text: 'Đã xác nhận', color: 'blue', bg: '#e6f4ff', border: '#91caff' };
    case 'CheckedIn': return { text: 'Đang lưu trú', color: 'purple', bg: '#f9f0ff', border: '#d3adf7' };
    case 'CheckedOut': return { text: 'Đã hoàn thành', color: 'green', bg: '#f6ffed', border: '#b7eb8f' };
    case 'Cancelled': return { text: 'Đã hủy', color: 'red', bg: '#fff1f0', border: '#ffa39e' };
    default: return { text: 'Không xác định', color: 'default', bg: '#fafafa', border: '#d9d9d9' };
  }
};

export default function ClientBookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
  const [api, contextHolder] = notification.useNotification();

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [invoiceDetail, setInvoiceDetail] = useState(null);
  const [loadingInvoice, setLoadingInvoice] = useState(false);

  // States cho Hủy phòng
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  
  // States cho Đánh giá
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const fetchBookings = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await bookingApi.getMyBookings(); 
      setBookings((res || []).sort((a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf()));
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Không thể tải lịch sử.' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    window.scrollTo(0, 0);
  }, []);

  useSignalR((newNotif) => {
    if (newNotif.type === "UPDATE_BOOKING_STATUS") {
      fetchBookings(true);
      api.info({
        message: <Text strong>Thông báo hành trình</Text>,
        description: newNotif.content,
        icon: <BellRinging color={THEME.GOLD} weight="fill" />,
      });
    }
  });

  const handleOpenDetails = async (booking) => {
    setSelectedBooking(booking);
    setDrawerVisible(true);
    setInvoiceDetail(null);
    try {
      setLoadingInvoice(true);
      const res = await invoiceApi.getByBookingCode(booking.bookingCode);
      setInvoiceDetail(res);
    } catch (error) {} finally { setLoadingInvoice(false); }
  };

  // 🔥 XỬ LÝ HỦY PHÒNG
  const handleCancelBooking = async () => {
    if (!cancelReason.trim()) return message.warning("Vui lòng nhập lý do hủy phòng.");
    try {
      setLoading(true);
      await bookingApi.updateStatus(selectedBooking.id, 'Cancelled', cancelReason);
      api.success({ message: 'Đã hủy đơn thành công', description: 'Hy vọng sớm được phục vụ bạn lần sau.' });
      setCancelModalOpen(false);
      setCancelReason('');
      setDrawerVisible(false);
      fetchBookings();
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Không thể hủy đơn lúc này.' });
    } finally { setLoading(false); }
  };

  // 🔥 XỬ LÝ VIẾT ĐÁNH GIÁ
  const handleSendReview = async () => {
    if (!comment.trim()) return message.warning("Hãy chia sẻ vài cảm nhận về kỳ nghỉ của bạn nhé!");
    try {
      setLoading(true);
      // Lấy id của RoomType đầu tiên trong đơn để review (giả định đơn 1 loại phòng)
      // Nếu đơn nhiều phòng, bạn có thể loop hoặc chọn 1 đại diện
      const payload = {
        bookingId: selectedBooking.id,
        rating: rating,
        comment: comment
      };
      await reviewApi.createReview(payload);
      api.success({ message: 'Cảm ơn bạn!', description: 'Đánh giá của bạn giúp ABCHotel hoàn thiện hơn.' });
      setReviewModalOpen(false);
      setComment('');
      setDrawerVisible(false);
      fetchBookings();
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Bạn đã đánh giá đơn này rồi hoặc hệ thống gặp lỗi.' });
    } finally { setLoading(false); }
  };

  const filteredBookings = bookings.filter(b => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'UPCOMING') return ['Pending', 'Confirmed'].includes(b.status);
    if (activeTab === 'ACTIVE') return b.status === 'CheckedIn';
    if (activeTab === 'COMPLETED') return b.status === 'CheckedOut';
    if (activeTab === 'CANCELLED') return b.status === 'Cancelled';
    return true;
  });

  const tabItems = [
    { key: 'ALL', label: 'TẤT CẢ' },
    { key: 'UPCOMING', label: 'CHỜ NHẬN PHÒNG' },
    { key: 'ACTIVE', label: 'ĐANG LƯU TRÚ' },
    { key: 'COMPLETED', label: 'ĐÃ HOÀN THÀNH' },
    { key: 'CANCELLED', label: 'ĐÃ HỦY' },
  ];

  return (
    <div style={{ backgroundColor: THEME.BG_LIGHT, minHeight: '100vh', paddingBottom: 80 }}>
      {contextHolder}

      <div style={{ position: 'relative', height: 300, backgroundImage: 'url("https://i.pinimg.com/1200x/57/3e/13/573e1340bad4682fe32bc436ec3152b7.jpg")', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(to top, ${THEME.BG_LIGHT} 0%, rgba(13, 24, 33, 0.7) 100%)` }}></div>
        <div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center' }}>
          <Bed size={48} color={THEME.DARK_RED} weight="duotone" />
          <Title style={{ color: THEME.NAVY_DARK, fontSize: 36, fontFamily: '"Source Serif 4", serif', margin: 0 }}>Kỳ Nghỉ Của Bạn</Title>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '-20px auto 0', padding: '0 20px', position: 'relative' }}>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} centered className="luxury-history-tabs" />

        {loading ? <div style={{ textAlign: 'center', padding: '100px 0' }}><Spin size="large" /></div> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 24 }}>
            {filteredBookings.length === 0 ? <Empty description="Bạn chưa có kỳ nghỉ nào trong mục này." /> : 
              filteredBookings.map((b) => (
                <motion.div 
                  whileHover={{ y: -4 }} key={b.id} onClick={() => handleOpenDetails(b)}
                  style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', display: 'flex', overflow: 'hidden', cursor: 'pointer' }}
                >
                  <div style={{ background: getStatusConfig(b.status).bg, padding: 20, minWidth: 120, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                     <Text strong style={{ fontSize: 12, color: '#64748b' }}>{dayjs(b.expectedCheckIn).format('MMM YYYY')}</Text>
                     <Title level={2} style={{ margin: 0 }}>{dayjs(b.expectedCheckIn).format('DD')}</Title>
                  </div>
                  <div style={{ padding: 20, flex: 1 }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text strong style={{ fontSize: 16 }}>{b.bookingCode}</Text>
                        <Tag color={getStatusConfig(b.status).color}>{getStatusConfig(b.status).text}</Tag>
                     </div>
                     <Space split={<Divider type="vertical" />} style={{ color: '#64748b', fontSize: 13 }}>
                        <span><Clock size={14}/> {dayjs(b.expectedCheckIn).format('HH:mm')} - {dayjs(b.expectedCheckOut).format('HH:mm')}</span>
                        <span>Check-out: {dayjs(b.expectedCheckOut).format('DD/MM')}</span>
                     </Space>
                  </div>
                  <div style={{ padding: 20, background: '#fafafa', display: 'flex', alignItems: 'center' }}><ArrowRight size={20} color="#cbd5e1" /></div>
                </motion.div>
              ))
            }
          </div>
        )}
      </div>

      <Drawer
        title={<Text strong style={{ fontSize: 18 }}>Chi tiết đặt phòng</Text>}
        open={drawerVisible} onClose={() => setDrawerVisible(false)} width={500}
      >
        {selectedBooking && (
          <div style={{ paddingBottom: 40 }}>
            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 12, textAlign: 'center', marginBottom: 24 }}>
               <Text type="secondary">MÃ ĐẶT PHÒNG</Text>
               <Title level={3} style={{ margin: '4px 0' }}>{selectedBooking.bookingCode}</Title>
               <Tag color={getStatusConfig(selectedBooking.status).color} style={{ borderRadius: 20, padding: '2px 12px' }}>{getStatusConfig(selectedBooking.status).text}</Tag>
            </div>

            {/* 🔥 KHU VỰC ACTION (NÚT HỦY & REVIEW) 🔥 */}
            <div style={{ marginBottom: 30 }}>
              {['Pending', 'Confirmed'].includes(selectedBooking.status) && (
                <Button block danger size="large" icon={<XCircle size={20} />} onClick={() => setCancelModalOpen(true)}>HỦY ĐẶT PHÒNG NÀY</Button>
              )}
              {selectedBooking.status === 'CheckedOut' && (
                <Button block type="primary" size="large" icon={<Star size={20} weight="fill" />} style={{ backgroundColor: THEME.GOLD, borderColor: THEME.GOLD }} onClick={() => setReviewModalOpen(true)}>VIẾT ĐÁNH GIÁ CHUYẾN ĐI</Button>
              )}
            </div>

            <Title level={5}><Clock style={{verticalAlign:'middle', marginRight:8}}/> Thời gian dự kiến</Title>
            <Timeline items={[
              { color: 'green', children: <>Check-in: {dayjs(selectedBooking.expectedCheckIn).format('HH:mm - DD/MM/YYYY')}</> },
              { color: 'red', children: <>Check-out: {dayjs(selectedBooking.expectedCheckOut).format('HH:mm - DD/MM/YYYY')}</> }
            ]} />

            <Divider />
            <Title level={5}><Receipt style={{verticalAlign:'middle', marginRight:8}}/> Hóa đơn thanh toán</Title>
            {invoiceDetail ? (
              <div style={{ background: '#fff', border: `1px solid ${THEME.GOLD}`, padding: 16, borderRadius: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Text strong style={{ fontSize: 16 }}>TỔNG CỘNG:</Text>
                  <Title level={4} style={{ margin: 0, color: THEME.DARK_RED }}>{new Intl.NumberFormat('vi-VN').format(invoiceDetail.finalTotal)}đ</Title>
                </div>
                <Text type="secondary" style={{ fontSize: 12 }}>Trạng thái: {invoiceDetail.balanceDue > 0 ? 'Còn nợ' : 'Đã tất toán'}</Text>
              </div>
            ) : <Text type="secondary">Đang cập nhật hóa đơn...</Text>}
          </div>
        )}
      </Drawer>

      {/* MODAL HỦY PHÒNG */}
      <Modal 
        title={<><XCircle size={20} color="red" weight="fill" /> Xác nhận hủy đặt phòng</>}
        open={cancelModalOpen} onCancel={() => setCancelModalOpen(false)}
        onOk={handleCancelBooking} okText="HỦY PHÒNG NGAY" okButtonProps={{ danger: true, loading: loading }}
      >
        <Paragraph>Lưu ý: Hành động này không thể hoàn tác. Vui lòng cho khách sạn biết lý do bạn muốn hủy:</Paragraph>
        <TextArea rows={4} placeholder="Ví dụ: Tôi có việc đột xuất, Tôi muốn đổi ngày..." value={cancelReason} onChange={e => setCancelReason(e.target.value)} />
      </Modal>

      {/* MODAL ĐÁNH GIÁ */}
      <Modal 
        title={<><Star size={20} color={THEME.GOLD} weight="fill" /> Đánh giá kỳ nghỉ của bạn</>}
        open={reviewModalOpen} onCancel={() => setReviewModalOpen(false)}
        onOk={handleSendReview} okText="GỬI ĐÁNH GIÁ" okButtonProps={{ style: { background: THEME.NAVY_DARK }, loading: loading }}
      >
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <Text strong style={{ display: 'block', marginBottom: 10 }}>Bạn cảm thấy thế nào về trải nghiệm lần này?</Text>
          <Rate value={rating} onChange={setRating} style={{ color: THEME.GOLD, fontSize: 32 }} />
        </div>
        <TextArea rows={5} placeholder="Chia sẻ những điều bạn hài lòng hoặc cần góp ý để khách sạn phục vụ tốt hơn..." value={comment} onChange={e => setComment(e.target.value)} />
      </Modal>

      <style>{`
        .luxury-history-tabs .ant-tabs-nav::before { display: none; }
        .luxury-history-tabs .ant-tabs-ink-bar { background: ${THEME.DARK_RED}; height: 3px !important; }
        .luxury-history-tabs .ant-tabs-tab-active .ant-tabs-tab-btn { color: ${THEME.DARK_RED} !important; }
      `}</style>
    </div>
  );
}
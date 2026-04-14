import React, { useState, useEffect } from 'react';
import { Drawer, Descriptions, Table, Tag, Button, Space, Typography, Divider, Spin, notification, Popconfirm, Tabs, Collapse, Modal, Form, Select, InputNumber } from 'antd';
import { Printer, XCircle, CreditCard, CheckCircle, ClockCounterClockwise, User, Door, ShoppingCart, WarningCircle, Calculator, Money, QrCode } from '@phosphor-icons/react';
import dayjs from 'dayjs';

import { bookingApi } from '../api/bookingApi';
import { invoiceApi } from '../api/invoiceApi'; // 🔥 Phải import invoiceApi
import { COLORS } from '../constants/theme';

const { Title, Text } = Typography;

const LUXURY_COLORS = {
    DARKEST: '#0D1821', NAVY: '#344966', MUTED_BLUE: '#7D92AD', 
    LIGHT_BLUE: '#B4CDED', LIGHTEST: '#E9F0F8', GOLD: '#D4AF37', ACCENT_RED: '#8A1538'
};

export default function BookingDetailDrawer({ isOpen, onClose, bookingCode }) {
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  
  // 🔥 Thêm State chứa dữ liệu Hóa Đơn và Modal Thu Tiền
  const [invoiceData, setInvoiceData] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm] = Form.useForm();

  useEffect(() => {
    if (isOpen && bookingCode) {
      fetchDetail();
    }
  }, [isOpen, bookingCode]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      // 1. Lấy thông tin Booking
      const bRes = await bookingApi.getByCode(bookingCode);
      setBookingData(bRes);
      
      // 2. Lấy thông tin Hóa đơn đi kèm Booking này
      const iRes = await invoiceApi.getByBookingCode(bookingCode);
      setInvoiceData(iRes);
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Không thể lấy thông tin chi tiết.' });
      onClose(); 
    } finally {
      setLoading(false);
    }
  };

  // ================= THAO TÁC BOOKING =================
  const handleCancelBooking = async () => {
    try {
      setLoading(true);
      await bookingApi.updateStatus(bookingData.id, 'Cancelled', 'Hủy bởi Lễ tân (No-Show)');
      api.success({ message: 'Thành công', description: 'Đã hủy đơn đặt phòng.' });
      fetchDetail(); 
    } catch (e) { api.error({ message: 'Lỗi', description: 'Không thể hủy đơn này.' }); } 
    finally { setLoading(false); }
  };

  // ================= THAO TÁC HÓA ĐƠN =================
  const handleRecalculate = async () => {
    if(!invoiceData) return;
    try {
      setLoading(true);
      await invoiceApi.recalculate(invoiceData.id);
      api.success({ message: 'Thành công', description: 'Đã tính lại tổng tiền.' });
      fetchDetail(); 
    } catch (e) { api.error({ message: 'Lỗi', description: 'Không thể tính lại.' }); } 
    finally { setLoading(false); }
  };

  const openPayModal = () => {
    payForm.resetFields();
    payForm.setFieldsValue({ amountPaid: invoiceData.finalTotal - invoiceData.amountPaid, paymentMethod: 'Cash' });
    setIsPayModalOpen(true);
  };

  const handlePayment = async (values) => {
    try {
      setLoading(true);
      await invoiceApi.payCash({
         invoiceId: invoiceData.id,
         paymentMethod: values.paymentMethod,
         amountPaid: values.amountPaid,
         transactionCode: values.transactionCode || 'MANUAL'
      });
      api.success({ message: 'Thành công', description: 'Ghi nhận thanh toán hoàn tất.' });
      setIsPayModalOpen(false);
      fetchDetail();
    } catch (e) { api.error({ message: 'Lỗi', description: 'Lỗi thanh toán.' }); } 
    finally { setLoading(false); }
  };

  const handlePrint = () => window.print();

  // ================= RENDER UI =================
  const renderStatus = (status) => {
    switch (status) {
      case 'Pending': return <Tag color="warning" icon={<ClockCounterClockwise/>}>Chờ thanh toán</Tag>;
      case 'Confirmed': return <Tag color="processing" icon={<CheckCircle/>}>Đã xác nhận</Tag>;
      case 'Checked_in': return <Tag color="success">Đang lưu trú</Tag>;
      case 'Completed': return <Tag color="default">Đã hoàn thành</Tag>;
      case 'Cancelled': return <Tag color="error" icon={<XCircle/>}>Đã hủy</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const roomColumns = [
    { title: 'Hạng Phòng', dataIndex: 'roomTypeName', key: 'roomType', render: (text) => <Text strong style={{ color: LUXURY_COLORS.NAVY }}>{text}</Text> },
    { title: 'Số Phòng', dataIndex: 'roomNumber', key: 'roomNumber', render: (text) => <Tag color={text === 'Sẽ xếp khi nhận phòng' ? 'default' : 'blue'}>{text}</Tag> },
    { title: 'Nhận/Trả', key: 'dates', render: (_, record) => ( <Space direction="vertical" size={0}> <Text style={{ fontSize: 12 }}>{dayjs(record.checkIn).format('DD/MM/YY')}</Text> <Text style={{ fontSize: 12 }}>{dayjs(record.checkOut).format('DD/MM/YY')}</Text> </Space> ) },
    { title: 'Giá', dataIndex: 'price', key: 'price', align: 'right', render: (val) => <Text strong style={{ color: LUXURY_COLORS.ACCENT_RED }}>{new Intl.NumberFormat('vi-VN').format(val)}đ</Text> }
  ];

  const serviceColumns = [
    { title: 'Dịch vụ', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 50 },
    { title: 'Thành tiền', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (val) => `${new Intl.NumberFormat('vi-VN').format(val)}đ` }
  ];

  const damageColumns = [
    { title: 'Hư hỏng/Mất mát', dataIndex: 'itemName', key: 'itemName' },
    { title: 'Phạt', dataIndex: 'penaltyAmount', key: 'penaltyAmount', align: 'right', render: (val) => <Text type="danger">{new Intl.NumberFormat('vi-VN').format(val)}đ</Text> }
  ];

  return (
    <>
      {contextHolder}
      <Drawer
        title={
          <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space>
              <Title level={4} style={{ color: LUXURY_COLORS.DARKEST, margin: 0 }}>Đơn {bookingCode}</Title>
              {bookingData && renderStatus(bookingData.status)}
            </Space>
          </div>
        }
        placement="right" size="large" onClose={onClose} open={isOpen} className="no-print"
      >
        {loading || !bookingData ? (
          <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            {/* 🔥 TABS PHÂN CHIA RÕ RÀNG NGHIỆP VỤ */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
                <Tabs defaultActiveKey="1">
                    
                    {/* TAB 1: THÔNG TIN ĐẶT PHÒNG */}
                    <Tabs.TabPane tab={<span><User size={16} style={{verticalAlign: 'text-bottom'}}/> THÔNG TIN LƯU TRÚ</span>} key="1">
                        <Descriptions column={1} size="small" bordered style={{ marginBottom: 24, backgroundColor: '#fff' }}>
                            <Descriptions.Item label={<Text strong style={{color: LUXURY_COLORS.NAVY}}>Họ tên</Text>}>{bookingData.guestName || 'Khách vãng lai'}</Descriptions.Item>
                            <Descriptions.Item label={<Text strong style={{color: LUXURY_COLORS.NAVY}}>Số điện thoại</Text>}>{bookingData.guestPhone || '---'}</Descriptions.Item>
                            <Descriptions.Item label={<Text strong style={{color: LUXURY_COLORS.NAVY}}>CCCD/Passport</Text>}>{bookingData.identityNumber || <Text type="secondary">Chưa cập nhật</Text>}</Descriptions.Item>
                            <Descriptions.Item label={<Text strong style={{color: LUXURY_COLORS.NAVY}}>Ghi chú</Text>}>{bookingData.specialRequests || 'Không có'}</Descriptions.Item>
                        </Descriptions>

                        <Title level={5} style={{ color: LUXURY_COLORS.NAVY }}><Door size={18} style={{ verticalAlign: 'text-bottom' }}/> Danh sách Phòng</Title>
                        <Table columns={roomColumns} dataSource={bookingData.rooms} rowKey={(r, i) => i} pagination={false} size="small" style={{ border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}`, borderRadius: 8 }} />
                        
                        <div style={{ marginTop: 24, textAlign: 'right' }}>
                            {(bookingData.status === 'Pending' || bookingData.status === 'Confirmed') && (
                            <Popconfirm title="Xác nhận khách No-Show và hủy đơn?" onConfirm={handleCancelBooking}>
                                <Button danger icon={<XCircle size={18} />}>Hủy Đơn Booking</Button>
                            </Popconfirm>
                            )}
                        </div>
                    </Tabs.TabPane>

                    {/* TAB 2: HÓA ĐƠN VÀ THU NGÂN (FOLIO) */}
                    <Tabs.TabPane tab={<span><Calculator size={16} style={{verticalAlign: 'text-bottom'}}/> HÓA ĐƠN & THANH TOÁN</span>} key="2">
                        {invoiceData ? (
                            <div style={{ backgroundColor: LUXURY_COLORS.LIGHTEST, padding: 16, borderRadius: 8, border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                    <Title level={5} style={{ margin: 0, color: LUXURY_COLORS.DARKEST }}>Hóa đơn #{invoiceData.id}</Title>
                                    {invoiceData.status === 'Paid' ? <Tag color="success" icon={<CheckCircle/>}>ĐÃ THANH TOÁN</Tag> : <Tag color="error" icon={<WarningCircle/>}>CHƯA THU ĐỦ</Tag>}
                                </div>

                                <Collapse defaultActiveKey={['1']} style={{ marginBottom: 16, backgroundColor: '#fff' }}>
                                    <Collapse.Panel header={<Text strong style={{color: LUXURY_COLORS.NAVY}}><ShoppingCart size={18}/> Tiền Phòng & Dịch vụ</Text>} key="1">
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item label="Tiền phòng">{new Intl.NumberFormat('vi-VN').format(invoiceData.totalRoomAmount)}đ</Descriptions.Item>
                                            <Descriptions.Item label="Tiền Dịch vụ">{new Intl.NumberFormat('vi-VN').format(invoiceData.totalServiceAmount)}đ</Descriptions.Item>
                                        </Descriptions>
                                        {invoiceData.services?.length > 0 && <Table columns={serviceColumns} dataSource={invoiceData.services} size="small" pagination={false} style={{ marginTop: 8 }} />}
                                    </Collapse.Panel>

                                    {invoiceData.damages?.length > 0 && (
                                        <Collapse.Panel header={<Text strong style={{ color: LUXURY_COLORS.ACCENT_RED }}><WarningCircle size={18}/> Phạt Hư Hỏng</Text>} key="2">
                                            <Table columns={damageColumns} dataSource={invoiceData.damages} size="small" pagination={false} />
                                        </Collapse.Panel>
                                    )}
                                </Collapse>

                                <Divider style={{ borderColor: LUXURY_COLORS.MUTED_BLUE }} />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text type="secondary">Khuyến mãi trừ tiền</Text>
                                    <Text strong style={{ color: '#166534' }}>- {new Intl.NumberFormat('vi-VN').format(invoiceData.discountAmount)}đ</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                    <Text type="secondary">Thuế VAT (10%)</Text>
                                    <Text>{new Intl.NumberFormat('vi-VN').format(invoiceData.taxAmount)}đ</Text>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 12 }}>
                                    <Title level={5} style={{ margin: 0 }}>TỔNG THANH TOÁN</Title>
                                    <Title level={4} style={{ color: LUXURY_COLORS.ACCENT_RED, margin: 0 }}>{new Intl.NumberFormat('vi-VN').format(invoiceData.finalTotal)}đ</Title>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px', backgroundColor: '#fff', borderRadius: 6, border: `1px solid ${LUXURY_COLORS.MUTED_BLUE}` }}>
                                    <Text strong>KHÁCH CÒN NỢ:</Text>
                                    <Text strong style={{ fontSize: 16, color: invoiceData.finalTotal - invoiceData.amountPaid > 0 ? LUXURY_COLORS.ACCENT_RED : LUXURY_COLORS.SUCCESS }}>
                                        {new Intl.NumberFormat('vi-VN').format(invoiceData.finalTotal - invoiceData.amountPaid)}đ
                                    </Text>
                                </div>

                                {/* NÚT THAO TÁC TÀI CHÍNH */}
                                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                                    <Button icon={<Calculator/>} onClick={handleRecalculate} disabled={invoiceData.status === 'Paid'}>Tính lại tiền</Button>
                                    {invoiceData.status !== 'Paid' && (
                                        <Button type="primary" icon={<CreditCard />} onClick={openPayModal} style={{ backgroundColor: LUXURY_COLORS.NAVY }}>
                                            THU TIỀN / CHECK-OUT
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : ( <div style={{ textAlign: 'center', padding: 20 }}><Spin /> Đang tải dữ liệu Hóa đơn...</div> )}
                    </Tabs.TabPane>
                </Tabs>
            </div>

            {/* NÚT IN BILL CỐ ĐỊNH Ở DƯỚI */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}`, display: 'flex', justifyContent: 'space-between' }}>
              <Button onClick={onClose} size="large">Đóng</Button>
              <Button type="primary" size="large" icon={<Printer size={20} />} onClick={handlePrint} disabled={!invoiceData || invoiceData.status !== 'Paid'} style={{ backgroundColor: LUXURY_COLORS.GOLD, color: LUXURY_COLORS.DARKEST, fontWeight: 'bold' }}>
                  IN HÓA ĐƠN (GIAO KHÁCH)
              </Button>
            </div>

          </div>
        )}
      </Drawer>

      {/* MODAL THU TIỀN */}
      <Modal title={<span style={{ color: LUXURY_COLORS.NAVY }}>Xác nhận Thu tiền</span>} open={isPayModalOpen} onCancel={() => setIsPayModalOpen(false)} footer={null} centered>
        <Form form={payForm} layout="vertical" onFinish={handlePayment} style={{ marginTop: 24 }}>
          <Form.Item name="paymentMethod" label="Phương thức thanh toán" rules={[{ required: true }]}>
            <Select size="large">
              <Select.Option value="Cash"><Space><Money color="green" /> Tiền mặt</Space></Select.Option>
              <Select.Option value="Bank Transfer"><Space><QrCode color="blue" /> Chuyển khoản / Quẹt thẻ</Space></Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amountPaid" label="Số tiền thu (VNĐ)" rules={[{ required: true }]}>
            <InputNumber size="large" style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: LUXURY_COLORS.NAVY }}>Xác nhận Thu</Button>
          </div>
        </Form>
      </Modal>

      {/* KHU VỰC IN (Print Only) GIỮ NGUYÊN KHÔNG ĐỔI */}
      {invoiceData && bookingData && (
        <div className="print-only">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h1 style={{ margin: 0 }}>ABC HOTEL</h1>
            <p style={{ margin: 0 }}>123 Đường Ven Biển, TP. XYZ</p>
            <p style={{ margin: 0 }}>SĐT: 0123.456.789</p>
            <h2>HÓA ĐƠN THANH TOÁN (RECEIPT)</h2>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <p><b>Khách hàng:</b> {bookingData.guestName}</p>
              <p><b>Số điện thoại:</b> {bookingData.guestPhone}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p><b>Hóa đơn số:</b> {invoiceData.id}</p>
              <p><b>Mã đơn:</b> {bookingData.bookingCode}</p>
              <p><b>Ngày in:</b> {dayjs().format('DD/MM/YYYY HH:mm')}</p>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 20 }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #000' }}>
                <th style={{ textAlign: 'left', padding: 8 }}>Hạng mục</th>
                <th style={{ textAlign: 'right', padding: 8 }}>Thành tiền</th>
              </tr>
            </thead>
            <tbody>
              <tr><td style={{ padding: 8 }}>Tổng tiền phòng</td><td style={{ textAlign: 'right', padding: 8 }}>{new Intl.NumberFormat('vi-VN').format(invoiceData.totalRoomAmount)}đ</td></tr>
              <tr><td style={{ padding: 8 }}>Dịch vụ (Minibar, Giặt ủi...)</td><td style={{ textAlign: 'right', padding: 8 }}>{new Intl.NumberFormat('vi-VN').format(invoiceData.totalServiceAmount)}đ</td></tr>
              <tr><td style={{ padding: 8 }}>Khuyến mãi</td><td style={{ textAlign: 'right', padding: 8 }}>- {new Intl.NumberFormat('vi-VN').format(invoiceData.discountAmount)}đ</td></tr>
              <tr style={{ borderBottom: '1px dotted #ccc' }}><td style={{ padding: 8 }}>Thuế VAT</td><td style={{ textAlign: 'right', padding: 8 }}>{new Intl.NumberFormat('vi-VN').format(invoiceData.taxAmount)}đ</td></tr>
            </tbody>
          </table>

          <div style={{ textAlign: 'right', fontSize: 18 }}>
            <p><b>TỔNG THANH TOÁN:</b> {new Intl.NumberFormat('vi-VN').format(invoiceData.finalTotal)}đ</p>
            <p><b>Trạng thái:</b> ĐÃ THANH TOÁN</p>
          </div>

          <div style={{ textAlign: 'center', marginTop: 50 }}>
            <p><i>Cảm ơn quý khách và hẹn gặp lại!</i></p>
          </div>
        </div>
      )}

      <style>{`
        .print-only { display: none; }
        @media print {
          body * { visibility: hidden; }
          .print-only, .print-only * { visibility: visible; }
          .print-only { display: block; position: absolute; left: 0; top: 0; width: 100%; padding: 20px; font-family: monospace; color: #000; }
        }
        .ant-tabs-nav::before { border-bottom: 1px solid ${LUXURY_COLORS.LIGHT_BLUE} !important; }
      `}</style>
    </>
  );
}
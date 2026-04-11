import React, { useState, useEffect } from 'react';
import { Drawer, Descriptions, Table, Tag, Button, Space, Typography, Divider, Spin, notification, Collapse, Modal, Form, Select, InputNumber } from 'antd';
import { Printer, CreditCard, ShoppingCart, WarningCircle, CheckCircle, Calculator, Money, QrCode } from '@phosphor-icons/react';
import dayjs from 'dayjs';

import { invoiceApi } from '../api/invoiceApi';
import { COLORS } from '../constants/theme';

const { Title, Text } = Typography;

export default function InvoiceDetailDrawer({ isOpen, onClose, invoiceId, onSuccess }) {
  const [api, contextHolder] = notification.useNotification();
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm] = Form.useForm();

  useEffect(() => {
    if (isOpen && invoiceId) fetchInvoiceDetail();
  }, [isOpen, invoiceId]);

  const fetchInvoiceDetail = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getById(invoiceId);
      setInvoice(res);
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Không thể lấy thông tin hóa đơn.' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    try {
      setLoading(true);
      await invoiceApi.recalculate(invoiceId);
      api.success({ message: 'Thành công', description: 'Đã cập nhật lại tổng tiền.' });
      fetchInvoiceDetail(); // Load lại số liệu mới
    } catch (e) {
      api.error({ message: 'Lỗi', description: 'Không thể tính lại.' });
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = () => {
    payForm.resetFields();
    // Gợi ý số tiền nợ
    payForm.setFieldsValue({ amountPaid: invoice.finalTotal - invoice.amountPaid, paymentMethod: 'Cash' });
    setIsPayModalOpen(true);
  };

  const handlePayment = async (values) => {
    try {
      setLoading(true);
      if (values.paymentMethod === 'VNPay' || values.paymentMethod === 'MoMo') {
         // Chuyển hướng VNPay/MoMo
         const res = values.paymentMethod === 'VNPay' 
            ? await invoiceApi.createVnPayUrl(invoiceId)
            : await axiosClient.post(`/Invoices/${invoiceId}/create-momo-url`); // API MoMo hôm trước
         window.location.href = res.url; 
      } else {
         // Tiền mặt / Chuyển khoản tay
         await invoiceApi.payCash({
            invoiceId: invoiceId,
            paymentMethod: values.paymentMethod,
            amountPaid: values.amountPaid,
            transactionCode: values.transactionCode || 'MANUAL'
         });
         api.success({ message: 'Thành công', description: 'Ghi nhận thanh toán hoàn tất.' });
         setIsPayModalOpen(false);
         fetchInvoiceDetail();
         if (onSuccess) onSuccess(); // Báo cho bảng bên ngoài load lại
      }
    } catch (e) {
      api.error({ message: 'Lỗi', description: 'Lỗi thanh toán.' });
    } finally {
      setLoading(false);
    }
  };

  // Cấu hình Bảng Dịch vụ
  const serviceColumns = [
    { title: 'Tên dịch vụ', dataIndex: 'serviceName', key: 'serviceName' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity', width: 50 },
    { title: 'Thành tiền', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (val) => `${new Intl.NumberFormat('vi-VN').format(val)}đ` }
  ];

  return (
    <>
      {contextHolder}
      <Drawer
        title={<Space><Calculator size={24} color={COLORS.MIDNIGHT_BLUE}/> <Title level={4} style={{ margin: 0 }}>Hóa đơn #{invoiceId}</Title></Space>}
        placement="right" width={600} onClose={onClose} open={isOpen}
      >
        {loading && !invoice ? <div style={{ textAlign: 'center', marginTop: 100 }}><Spin size="large" /></div> : invoice && (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {/* STATUS & THÔNG TIN CƠ BẢN */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                 <Space direction="vertical" size={2}>
                   <Text type="secondary">Mã đặt phòng: <Text strong style={{ color: COLORS.MIDNIGHT_BLUE }}>{invoice.bookingCode}</Text></Text>
                   <Text type="secondary">Khách hàng: <Text strong>{invoice.guestName}</Text></Text>
                 </Space>
                 {invoice.status === 'Paid' ? <Tag color="success" icon={<CheckCircle/>}>ĐÃ THANH TOÁN</Tag> : <Tag color="error" icon={<WarningCircle/>}>CHƯA THANH TOÁN</Tag>}
              </div>

              {/* KHỐI CỘNG TIỀN (PHÒNG + DỊCH VỤ + HƯ HỎNG) */}
              <Collapse defaultActiveKey={['1']} style={{ marginBottom: 16, backgroundColor: '#fff' }}>
                <Collapse.Panel header={<Text strong><ShoppingCart size={18}/> Tiền Phòng & Dịch vụ</Text>} key="1">
                  <Descriptions column={1} size="small">
                     <Descriptions.Item label="Tổng tiền phòng">{new Intl.NumberFormat('vi-VN').format(invoice.totalRoomAmount)}đ</Descriptions.Item>
                     <Descriptions.Item label="Tổng Dịch vụ (Minibar, Giặt ủi...)">{new Intl.NumberFormat('vi-VN').format(invoice.totalServiceAmount)}đ</Descriptions.Item>
                  </Descriptions>
                  {/* Nếu Backend trả về chi tiết thì render bảng ở đây */}
                  {invoice.services?.length > 0 && <Table columns={serviceColumns} dataSource={invoice.services} size="small" pagination={false} style={{ marginTop: 8 }} />}
                  
                  {invoice.status !== 'Paid' && (
                     <Button type="dashed" block size="small" style={{ marginTop: 8 }} icon={<ShoppingCart/>}>+ Thêm dịch vụ nhanh</Button>
                  )}
                </Collapse.Panel>

                <Collapse.Panel header={<Text strong style={{ color: COLORS.ACCENT_RED }}><WarningCircle size={18}/> Phạt Hư Hỏng / Mất mát</Text>} key="2">
                   <Descriptions column={1} size="small">
                     <Descriptions.Item label="Tổng phí đền bù">
                       <Text type="danger" strong>{new Intl.NumberFormat('vi-VN').format(invoice.totalDamageAmount || 0)}đ</Text>
                     </Descriptions.Item>
                   </Descriptions>
                   {invoice.status !== 'Paid' && (
                     <Button type="dashed" danger block size="small" style={{ marginTop: 8 }}>+ Lập biên bản đền bù</Button>
                   )}
                </Collapse.Panel>
              </Collapse>

              {/* KHỐI TRỪ TIỀN (VOUCHER & HẠNG THÀNH VIÊN) */}
              <Card size="small" style={{ backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', marginBottom: 16 }}>
                 <Title level={5} style={{ color: '#166534', margin: 0, paddingBottom: 8 }}>Khuyến mãi & Trừ tiền</Title>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                   <Text>Voucher / Hạng Thành Viên áp dụng:</Text>
                   <Text strong style={{ color: '#166534' }}>- {new Intl.NumberFormat('vi-VN').format(invoice.discountAmount)}đ</Text>
                 </div>
                 {/* Khung này em có thể show chữ: "Hạng Vàng (-10%)" tùy thuộc data backend đẩy lên */}
              </Card>

              {/* KHỐI TỔNG KẾT */}
              <Divider style={{ margin: '16px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                 <Text type="secondary">Thuế VAT (10%)</Text>
                 <Text>{new Intl.NumberFormat('vi-VN').format(invoice.taxAmount)}đ</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                 <Title level={4} style={{ margin: 0 }}>TỔNG THANH TOÁN</Title>
                 <Title level={3} style={{ color: COLORS.ACCENT_RED, margin: 0 }}>{new Intl.NumberFormat('vi-VN').format(invoice.finalTotal)}đ</Title>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                 <Text type="secondary">Đã khách đưa / cọc:</Text>
                 <Text strong style={{ color: COLORS.SUCCESS }}>{new Intl.NumberFormat('vi-VN').format(invoice.amountPaid)}đ</Text>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '8px', backgroundColor: '#f8fafc', borderRadius: 6 }}>
                 <Text strong>KHÁCH CÒN NỢ:</Text>
                 <Text strong style={{ fontSize: 16 }}>{new Intl.NumberFormat('vi-VN').format(invoice.finalTotal - invoice.amountPaid)}đ</Text>
              </div>
            </div>

            {/* FOOTER NÚT BẤM */}
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: `1px solid ${COLORS.LIGHTEST}`, display: 'flex', justifyContent: 'space-between' }}>
              <Button icon={<Calculator/>} onClick={handleRecalculate} disabled={invoice.status === 'Paid'}>Tính lại tiền</Button>
              <Space>
                <Button icon={<Printer/>} onClick={() => window.print()} disabled={invoice.status !== 'Paid'}>In Hóa Đơn</Button>
                {invoice.status !== 'Paid' && (
                  <Button type="primary" size="large" icon={<CreditCard />} onClick={openPayModal} style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }}>
                    THU TIỀN
                  </Button>
                )}
              </Space>
            </div>
          </div>
        )}
      </Drawer>

      {/* MODAL THU TIỀN */}
      <Modal title="Xác nhận Thu tiền" open={isPayModalOpen} onCancel={() => setIsPayModalOpen(false)} footer={null} centered>
        <Form form={payForm} layout="vertical" onFinish={handlePayment} style={{ marginTop: 24 }}>
          <Form.Item name="paymentMethod" label="Phương thức thanh toán" rules={[{ required: true }]}>
            <Select size="large">
              <Select.Option value="Cash"><Space><Money color="green" /> Tiền mặt</Space></Select.Option>
              <Select.Option value="Bank Transfer"><Space><QrCode color="blue" /> Chuyển khoản (Xác nhận tay)</Space></Select.Option>
              <Select.Option value="VNPay"><Space><CreditCard color="red" /> Quẹt thẻ VNPay</Space></Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="amountPaid" label="Số tiền thu (VNĐ)" rules={[{ required: true }]}>
            <InputNumber size="large" style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }}>Xác nhận</Button>
          </div>
        </Form>
      </Modal>
    </>
  );
}
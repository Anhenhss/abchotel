import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Select, InputNumber, notification, Tooltip, Row, Col, Grid, Divider } from 'antd';
import { Receipt, Calculator, Money, CreditCard, QrCode } from '@phosphor-icons/react';
import dayjs from 'dayjs';

import { invoiceApi } from '../api/invoiceApi';
import { useSignalR } from '../hooks/useSignalR';
import { COLORS } from '../constants/theme';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function InvoicesPage() {
  const screens = useBreakpoint();
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payForm] = Form.useForm();

  const fetchInvoices = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await invoiceApi.getAll();
      setInvoices(res || []);
    } catch (error) {
      if (!isSilent) api.error({ message: 'Lỗi', description: 'Không thể tải danh sách hóa đơn.' });
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  // Lắng nghe có ai thanh toán thì load lại bảng
  useSignalR((notification) => {
    if (notification.permission === "MANAGE_INVOICES") fetchInvoices(true);
  });

  // Gọi API ép hệ thống cộng lại tiền
  const handleRecalculate = async (id) => {
    try {
      setLoading(true);
      await invoiceApi.recalculate(id);
      api.success({ message: 'Thành công', description: 'Đã cập nhật lại tổng tiền hóa đơn.' });
      fetchInvoices();
    } catch (e) {
      api.error({ message: 'Lỗi', description: e.response?.data?.message || 'Không thể tính lại.' });
    } finally {
      setLoading(false);
    }
  };

  const openPayModal = (invoice) => {
    setSelectedInvoice(invoice);
    payForm.resetFields();
    // Gợi ý số tiền mặc định là số tiền còn nợ
    payForm.setFieldsValue({ amountPaid: invoice.finalTotal - invoice.amountPaid, paymentMethod: 'Cash' });
    setIsPayModalOpen(true);
  };

  const handlePayment = async (values) => {
    try {
      setLoading(true);
      
      if (values.paymentMethod === 'VNPay') {
        // NẾU LÀ VNPAY: Gọi API lấy Link và chuyển hướng
        const res = await invoiceApi.createVnPayUrl(selectedInvoice.id);
        window.location.href = res.url; // CHUYỂN HƯỚNG TỚI NGÂN HÀNG
      } else {
        // NẾU LÀ TIỀN MẶT/CHUYỂN KHOẢN TAY: Trừ tiền luôn
        await invoiceApi.payCash({
          invoiceId: selectedInvoice.id,
          paymentMethod: values.paymentMethod,
          amountPaid: values.amountPaid,
          transactionCode: values.transactionCode || 'TIENMAT'
        });
        api.success({ message: 'Thành công', description: 'Đã ghi nhận thanh toán.' });
        setIsPayModalOpen(false);
        fetchInvoices();
      }
    } catch (e) {
      api.error({ message: 'Lỗi', description: e.response?.data?.message || 'Lỗi thanh toán.' });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Mã Hóa Đơn', key: 'code',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: COLORS.MIDNIGHT_BLUE }}>#{record.id}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{dayjs(record.createdAt).format('DD/MM/YYYY HH:mm')}</Text>
        </Space>
      )
    },
    {
      title: 'Mã Đặt Phòng', dataIndex: 'bookingCode', key: 'bookingCode',
      render: (text) => <Tag color="blue" style={{fontWeight: 'bold'}}>{text}</Tag>
    },
    {
      title: 'Khách hàng', dataIndex: 'guestName', key: 'guestName',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: 'Tổng tiền', key: 'total', align: 'right',
      render: (_, record) => (
        <Space direction="vertical" size={0} style={{ textAlign: 'right' }}>
          <Text strong style={{ color: COLORS.ACCENT_RED, fontSize: 16 }}>{new Intl.NumberFormat('vi-VN').format(record.finalTotal)}đ</Text>
          {record.status !== 'Paid' && (
             <Text type="secondary" style={{ fontSize: 12 }}>Còn nợ: {new Intl.NumberFormat('vi-VN').format(record.finalTotal - record.amountPaid)}đ</Text>
          )}
        </Space>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center',
      render: (status) => {
        if (status === 'Paid') return <Tag color="success">Đã thanh toán</Tag>;
        if (status === 'Partial') return <Tag color="warning">Thanh toán 1 phần</Tag>;
        return <Tag color="error">Chưa thanh toán</Tag>;
      }
    },
    {
      title: 'Thao tác', key: 'actions', align: 'center',
      render: (_, record) => (
        <Space>
          <Tooltip title="Tính lại tiền (Gom dịch vụ/phụ thu)">
            <Button type="text" icon={<Calculator size={20} />} disabled={record.status === 'Paid'} onClick={() => handleRecalculate(record.id)} />
          </Tooltip>
          <Tooltip title="Thu tiền">
            <Button type="primary" style={{ backgroundColor: COLORS.SUCCESS }} icon={<Money size={18} />} disabled={record.status === 'Paid'} onClick={() => openPayModal(record)}>
              Thu tiền
            </Button>
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {contextHolder}
      <Title level={3} style={{ color: COLORS.MIDNIGHT_BLUE, marginBottom: 24 }}>Hóa Đơn & Thu Ngân</Title>
      
      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Table columns={columns} dataSource={invoices} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />
      </Card>

      {/* MODAL THANH TOÁN */}
      <Modal title={<Space><Receipt size={24} color={COLORS.MIDNIGHT_BLUE}/> <Title level={4} style={{ margin: 0 }}>Xử lý Thanh toán</Title></Space>} open={isPayModalOpen} onCancel={() => setIsPayModalOpen(false)} footer={null} centered>
        <Form form={payForm} layout="vertical" onFinish={handlePayment} style={{ marginTop: 24 }}>
          
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="paymentMethod" label="Phương thức thanh toán" rules={[{ required: true }]}>
                <Select size="large">
                  <Select.Option value="Cash"><Space><Money color="green" /> Tiền mặt</Space></Select.Option>
                  <Select.Option value="Bank Transfer"><Space><CreditCard color="blue" /> Chuyển khoản (Xác nhận tay)</Space></Select.Option>
                  <Select.Option value="VNPay"><Space><QrCode color="red" /> VNPay (Mở cổng quét QR)</Space></Select.Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={24}>
              <Form.Item name="amountPaid" label="Số tiền thu (VNĐ)" rules={[{ required: true }]}>
                <InputNumber size="large" style={{ width: '100%' }} formatter={v => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
          </Row>

          <Divider style={{ margin: '12px 0' }} />
          <div style={{ textAlign: 'right' }}>
            <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }}>Xác nhận Thanh toán</Button>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
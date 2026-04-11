import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Input, notification, Tooltip, Grid, Divider, Empty, Tabs, Statistic, Row, Col } from 'antd';
import { MagnifyingGlass, Receipt, Money, CheckCircle, WarningCircle, Eye, Printer } from '@phosphor-icons/react';
import dayjs from 'dayjs';

import { invoiceApi } from '../api/invoiceApi';
import InvoiceDetailDrawer from '../components/InvoiceDetailDrawer';
import { COLORS } from '../constants/theme';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function InvoicesPage() {
  const screens = useBreakpoint();
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });

  // States
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [activeTab, setActiveTab] = useState('Unpaid'); // Lễ tân luôn quan tâm ai còn nợ tiền trước tiên

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

  // Lấy dữ liệu
  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const res = await invoiceApi.getAll(); // Em nhớ đảm bảo Backend có API GET /api/Invoices nhé
      setInvoices(res || []);
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Không thể tải danh sách hóa đơn.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);

  const openDrawer = (id) => {
    setSelectedInvoiceId(id);
    setIsDrawerOpen(true);
  };

  // 🔥 THUẬT TOÁN LỌC VÀ SẮP XẾP
  const processedInvoices = invoices
    .filter(inv => {
      // 1. Lọc theo Tab (Unpaid / Paid / All)
      if (activeTab !== 'ALL' && inv.status !== activeTab) return false;
      
      // 2. Lọc theo tìm kiếm (Mã phòng, Tên khách)
      const searchLower = searchText.toLowerCase();
      return (
        inv.bookingCode?.toLowerCase().includes(searchLower) ||
        inv.guestName?.toLowerCase().includes(searchLower) ||
        inv.id.toString().includes(searchLower)
      );
    })
    .sort((a, b) => {
      // Ưu tiên hóa đơn mới nhất lên đầu
      return dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf();
    });

  // Tính toán thống kê nhanh cho Thu ngân
  const totalUnpaid = invoices.filter(i => i.status === 'Unpaid').reduce((sum, i) => sum + (i.finalTotal - i.amountPaid), 0);
  const totalPaidToday = invoices.filter(i => i.status === 'Paid' && dayjs(i.updatedAt).isSame(dayjs(), 'day')).reduce((sum, i) => sum + i.amountPaid, 0);

  const renderStatus = (status) => {
    switch (status) {
      case 'Unpaid': return <Tag color="error" icon={<WarningCircle/>}>CHƯA THU ĐỦ</Tag>;
      case 'Paid': return <Tag color="success" icon={<CheckCircle/>}>ĐÃ THANH TOÁN</Tag>;
      case 'Cancelled': return <Tag color="default">ĐÃ HỦY</Tag>;
      default: return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Mã HĐ', dataIndex: 'id', key: 'id', width: 80,
      render: (text) => <Text strong>#{text}</Text>
    },
    {
      title: 'Khách hàng / Mã Đơn', key: 'guest',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: COLORS.DARKEST }}>{record.guestName || 'Khách vãng lai'}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>Booking: <Text strong style={{ color: COLORS.MIDNIGHT_BLUE }}>{record.bookingCode}</Text></Text>
        </Space>
      )
    },
    {
      title: 'Tổng tiền', dataIndex: 'finalTotal', key: 'finalTotal', align: 'right',
      render: (val) => <Text strong style={{ color: COLORS.ACCENT_RED, fontSize: 15 }}>{new Intl.NumberFormat('vi-VN').format(val)}đ</Text>
    },
    {
      title: 'Còn nợ', key: 'debt', align: 'right',
      render: (_, record) => {
        const debt = record.finalTotal - record.amountPaid;
        return <Text strong style={{ color: debt > 0 ? COLORS.ERROR : COLORS.SUCCESS }}>
          {new Intl.NumberFormat('vi-VN').format(debt)}đ
        </Text>
      }
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center',
      render: (status) => renderStatus(status)
    },
    {
      title: 'Thao tác', key: 'actions', align: 'center', width: 100,
      render: (_, record) => (
        <Tooltip title={record.status === 'Unpaid' ? "Thu Tiền" : "Xem Hóa Đơn"}>
          <Button 
            type={record.status === 'Unpaid' ? "primary" : "default"} 
            icon={record.status === 'Unpaid' ? <Money size={20} /> : <Eye size={20} />} 
            onClick={() => openDrawer(record.id)} 
            style={record.status === 'Unpaid' ? { backgroundColor: COLORS.MIDNIGHT_BLUE } : {}}
          />
        </Tooltip>
      )
    }
  ];

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      {contextHolder}
      
      {/* KHỐI THỐNG KÊ NHANH */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
         <Col xs={24} md={12}>
            <Card variant="borderless" style={{ borderRadius: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca' }}>
               <Statistic 
                  title={<Text strong style={{ color: '#991b1b' }}>Tổng Nợ Cần Thu (Chưa thanh toán)</Text>}
                  value={totalUnpaid} 
                  suffix="VNĐ"
                  valueStyle={{ color: '#dc2626', fontWeight: 'bold' }}
                  prefix={<WarningCircle />}
               />
            </Card>
         </Col>
         <Col xs={24} md={12}>
            <Card variant="borderless" style={{ borderRadius: 12, backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
               <Statistic 
                  title={<Text strong style={{ color: '#166534' }}>Doanh thu Thực nhận (Hôm nay)</Text>}
                  value={totalPaidToday} 
                  suffix="VNĐ"
                  valueStyle={{ color: '#16a34a', fontWeight: 'bold' }}
                  prefix={<Money />}
               />
            </Card>
         </Col>
      </Row>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: screens.md ? 0 : '16px 0' }}>
        
        {/* THANH TÌM KIẾM VÀ TABS PHÂN LOẠI */}
        <div style={{ display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: screens.xs ? 'stretch' : 'center', marginBottom: 16, gap: 16, padding: screens.md ? '0' : '0 16px' }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            style={{ flex: 1 }}
            items={[
              { key: 'Unpaid', label: 'Chưa thanh toán (Cần thu)' },
              { key: 'Paid', label: 'Đã thanh toán xong' },
              { key: 'ALL', label: 'Tất cả hóa đơn' },
            ]}
          />
          <Input 
            placeholder="Tìm mã HĐ, mã Đơn, Tên khách..." 
            prefix={<MagnifyingGlass color={COLORS.MUTED} />} 
            allowClear 
            onChange={e => setSearchText(e.target.value)}
            style={{ width: screens.xs ? '100%' : 280 }}
            size="large"
          />
        </div>

        {/* HIỂN THỊ DỮ LIỆU */}
        {screens.md ? (
          <Table 
            columns={columns} dataSource={processedInvoices} rowKey="id" loading={loading}
            pagination={{ pageSize: 10 }} rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
            {processedInvoices.length === 0 ? <Empty description="Không có hóa đơn nào" /> : processedInvoices.map(record => {
              return (
                <div key={record.id} style={{ border: `1px solid ${COLORS.LIGHTEST}`, borderRadius: 8, padding: 16, backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text strong style={{ fontSize: 16, color: COLORS.MIDNIGHT_BLUE }}>HĐ #{record.id}</Text>
                    {renderStatus(record.status)}
                  </div>
                  <Space direction="vertical" size={2} style={{ width: '100%', marginBottom: 12 }}>
                    <Text strong>{record.guestName || 'Khách vãng lai'}</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>Booking: {record.bookingCode}</Text>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                       <Text>Tổng tiền:</Text>
                       <Text strong style={{ color: COLORS.ACCENT_RED }}>{new Intl.NumberFormat('vi-VN').format(record.finalTotal)}đ</Text>
                    </div>
                  </Space>
                  <Divider style={{ margin: '8px 0' }} />
                  <Button type={record.status === 'Unpaid' ? "primary" : "default"} block ghost={record.status !== 'Unpaid'} onClick={() => openDrawer(record.id)} style={record.status === 'Unpaid' ? { backgroundColor: COLORS.MIDNIGHT_BLUE } : {}}>
                    {record.status === 'Unpaid' ? "THU TIỀN NGAY" : "Xem chi tiết"}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* COMPONENT NGĂN KÉO CHI TIẾT */}
      <InvoiceDetailDrawer 
         isOpen={isDrawerOpen} 
         onClose={() => setIsDrawerOpen(false)} 
         invoiceId={selectedInvoiceId} 
         onSuccess={() => fetchInvoices()} // Thu tiền xong bắt bảng danh sách load lại data mới
      />

      <style>{`
        .ant-table-thead > tr > th { background-color: ${COLORS.LIGHTEST} !important; color: ${COLORS.MIDNIGHT_BLUE} !important; font-weight: 700 !important; }
        .table-row-light { background-color: #ffffff; }
        .table-row-dark { background-color: #fcfcfc; }
        .ant-tabs-nav::before { border-bottom: none !important; }
      `}</style>
    </div>
  );
}
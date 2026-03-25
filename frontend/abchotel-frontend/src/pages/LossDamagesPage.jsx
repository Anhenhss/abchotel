import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, InputNumber, notification, Select, Dropdown, Row, Col } from 'antd';
import { Plus, MagnifyingGlass, WarningCircle, CheckCircle, Clock, ShieldWarning, Screwdriver, ThumbsUp, XCircle, DotsThreeOutlineVertical, LockKey } from '@phosphor-icons/react';
import { lossDamageApi } from '../api/lossDamageApi';
import { roomApi } from '../api/roomApi';
import { roomInventoryApi } from '../api/roomInventoryApi';

const { Title, Text } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';
const PALETTE = {
  muted: '#7D92AD',
  lightest: '#E9F0F8',
};

// Cấu hình 5 trạng thái
const STATUS_CONFIG = {
  Pending: { color: 'warning', label: 'Chờ xử lý', icon: <Clock size={16} /> },
  Confirmed: { color: 'processing', label: 'Đã xác nhận', icon: <ThumbsUp size={16} /> },
  Paid: { color: 'success', label: 'Đã thanh toán', icon: <CheckCircle size={16} /> },
  Disputed: { color: 'error', label: 'Đang tranh chấp', icon: <WarningCircle size={16} /> },
  Cancelled: { color: 'default', label: 'Hủy bỏ', icon: <XCircle size={16} /> },
};

export default function LossDamagesPage() {
  const [searchBookingId, setSearchText] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);

  const [rooms, setRooms] = useState([]);
  const [inventories, setInventories] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await roomApi.getRooms(true);
        setRooms(res || []);
      } catch (error) {
        console.log('Lỗi tải phòng', error);
      }
    };
    fetchRooms();
  }, []);

  const handleRoomChange = async (roomId) => {
    form.setFieldValue('roomInventoryId', null); 
    try {
      const res = await roomInventoryApi.getInventoryByRoom(roomId, true);
      setInventories(res || []);
    } catch (error) {
      notification.error({ message: 'Lỗi tải danh sách đồ dùng của phòng', placement: 'bottomRight' });
    }
  };

  const handleSearch = async () => {
    if (!searchBookingId) {
      notification.warning({ message: 'Vui lòng nhập Mã chi tiết đặt phòng (ID)!', placement: 'bottomRight' });
      return;
    }
    try {
      setLoading(true);
      const res = await lossDamageApi.getByBooking(searchBookingId);
      setRecords(res || []);
      if (res.length === 0) {
        notification.info({ message: 'Không có ghi nhận hư hỏng nào cho mã này.', placement: 'bottomRight' });
      }
    } catch (error) {
      notification.error({ message: 'Lỗi tìm kiếm dữ liệu', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    form.resetFields();
    if (searchBookingId) {
      form.setFieldValue('bookingDetailId', searchBookingId);
    }
    setInventories([]); 
    setIsModalOpen(true);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      await lossDamageApi.reportDamage(values);
      notification.success({ message: 'Đã ghi nhận hư hỏng thành công!', placement: 'bottomRight' });
      setIsModalOpen(false);
      
      if (values.bookingDetailId.toString() === searchBookingId.toString()) {
        handleSearch();
      }
    } catch (error) {
      notification.error({ message: error.response?.data?.message || 'Có lỗi xảy ra', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  // Cập nhật trạng thái
  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setLoading(true);
      await lossDamageApi.updateStatus(id, newStatus);
      notification.success({ message: 'Đã cập nhật trạng thái đền bù!', placement: 'bottomRight' });
      handleSearch(); // Load lại dữ liệu
    } catch (error) {
      notification.error({ message: 'Lỗi cập nhật trạng thái', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Tên Vật Tư', dataIndex: 'itemName', key: 'itemName',
      render: (text) => <Text strong style={{ color: MIDNIGHT_BLUE }}>{text}</Text>
    },
    {
      title: 'Sự cố', dataIndex: 'issueType', key: 'issueType',
      render: (type) => {
        if (type === 'Lost') return <Tag icon={<ShieldWarning />} color="magenta">Báo Mất</Tag>;
        return <Tag icon={<Screwdriver />} color="orange">Hư Hỏng</Tag>;
      }
    },
    {
      title: 'SL', dataIndex: 'quantity', key: 'quantity', align: 'center',
      render: (qty) => <Text strong>{qty}</Text>
    },
    {
      title: 'Tiền Phạt', dataIndex: 'penaltyAmount', key: 'penaltyAmount', align: 'right',
      render: (amount, record) => (
        <Text strong style={{ color: record.status === 'Cancelled' ? '#bfbfbf' : ACCENT_RED, fontSize: 15, textDecoration: record.status === 'Cancelled' ? 'line-through' : 'none' }}>
          {amount ? new Intl.NumberFormat('vi-VN').format(amount) : '0'} ₫
        </Text>
      )
    },
    {
      title: 'Ghi chú', dataIndex: 'description', key: 'description',
      render: (desc) => <Text type="secondary">{desc || 'Không có'}</Text>
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status', align: 'center',
      render: (status) => {
        const config = STATUS_CONFIG[status] || STATUS_CONFIG['Pending'];
        return <Tag icon={config.icon} color={config.color} style={{ padding: '4px 8px', borderRadius: 12 }}>{config.label}</Tag>;
      }
    },
    {
      title: 'Thao tác', key: 'actions', align: 'right',
      render: (_, record) => {
        // LOGIC KHÓA CỨNG: Nếu đã Thanh toán hoặc Hủy bỏ thì không cho thao tác nữa
        const isLocked = record.status === 'Paid' || record.status === 'Cancelled';

        if (isLocked) {
          return (
            <Space style={{ color: '#bfbfbf' }}>
              <LockKey size={16} />
              <Text type="secondary" style={{ fontSize: 13 }}>Đã chốt sổ</Text>
            </Space>
          );
        }

        // Còn lại (Pending, Confirmed, Disputed) thì cho phép đổi trạng thái
        return (
          <Dropdown
            menu={{
              items: [
                { key: 'Pending', label: 'Đưa về Chờ xử lý', onClick: () => handleUpdateStatus(record.id, 'Pending') },
                { key: 'Confirmed', label: 'Khách Đã xác nhận', onClick: () => handleUpdateStatus(record.id, 'Confirmed') },
                { key: 'Paid', label: 'Đã thanh toán (Khóa phiếu)', onClick: () => handleUpdateStatus(record.id, 'Paid') },
                { type: 'divider' },
                { key: 'Disputed', label: 'Khách đang Tranh chấp', danger: true, onClick: () => handleUpdateStatus(record.id, 'Disputed') },
                { key: 'Cancelled', label: 'Hủy bỏ / Báo nhầm (Khóa phiếu)', danger: true, onClick: () => handleUpdateStatus(record.id, 'Cancelled') },
              ]
            }}
            trigger={['click']}
          >
            <Button type="text" icon={<DotsThreeOutlineVertical size={20} color={MIDNIGHT_BLUE} />} />
          </Dropdown>
        );
      }
    }
  ];

  return (
    <div>
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Ghi nhận Hư Hỏng & Mất Mát</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 24 }}>
        <Row justify="space-between" align="middle" gutter={[16, 16]}>
          <Col xs={24} md={16}>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <Text style={{ color: '#52677D', fontSize: 15 }}>
                Tra cứu danh sách đồ dùng bị hỏng/mất theo Mã đặt phòng để tiến hành thu tiền đền bù.
              </Text>
              <Space>
                <Input 
                  placeholder="Nhập ID Chi tiết đặt phòng..." 
                  size="large"
                  prefix={<MagnifyingGlass color={PALETTE.muted} />}
                  style={{ width: 280 }}
                  value={searchBookingId}
                  onChange={(e) => setSearchText(e.target.value)}
                  onPressEnter={handleSearch}
                />
                <Button type="primary" size="large" onClick={handleSearch} loading={loading} style={{ backgroundColor: MIDNIGHT_BLUE }}>
                  Tra cứu
                </Button>
              </Space>
            </Space>
          </Col>

          <Col xs={24} md={8} style={{ textAlign: 'right' }}>
            <Button type="primary" size="large" icon={<Plus size={18} />} onClick={openModal} style={{ backgroundColor: ACCENT_RED, fontWeight: 'bold' }}>
              GHI NHẬN HƯ HỎNG MỚI
            </Button>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Table 
          columns={columns} 
          dataSource={records} 
          rowKey="id" 
          loading={loading}
          pagination={false}
          locale={{ emptyText: 'Hãy nhập Mã đặt phòng để tra cứu dữ liệu' }}
        />
      </Card>

      <Modal 
        title={<Space><WarningCircle size={24} color={ACCENT_RED}/><Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>Báo cáo Hư hỏng / Mất đồ</Title></Space>} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null} 
        centered
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="bookingDetailId" label="Mã Chi tiết Đặt phòng (ID)" rules={[{ required: true, message: 'Nhập ID đặt phòng' }]}>
                <InputNumber size="large" style={{ width: '100%' }} placeholder="VD: 105" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chọn Phòng (Để lấy danh sách đồ)">
                <Select 
                  size="large" 
                  placeholder="Chọn phòng..." 
                  showSearch
                  filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                  options={rooms.map(r => ({ value: r.id, label: `Phòng ${r.roomNumber}` }))}
                  onChange={handleRoomChange}
                />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="roomInventoryId" label="Vật tư bị hỏng / mất" rules={[{ required: true, message: 'Chọn món đồ bị hỏng/mất' }]}>
                <Select 
                  size="large" 
                  placeholder={inventories.length > 0 ? "Chọn vật tư..." : "Vui lòng chọn phòng trước"} 
                  disabled={inventories.length === 0}
                  options={inventories.map(i => ({ 
                    value: i.id, 
                    label: `${i.itemName} (Giá đền bù: ${new Intl.NumberFormat('vi-VN').format(i.priceIfLost || 0)}đ)` 
                  }))}
                />
              </Form.Item>
            </Col>

            <Col span={12}>
              <Form.Item name="issueType" label="Loại sự cố" rules={[{ required: true, message: 'Chọn loại sự cố' }]}>
                <Select size="large" placeholder="Chọn loại...">
                  <Select.Option value="Damaged">Làm hư hỏng</Select.Option>
                  <Select.Option value="Lost">Làm mất</Select.Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantity" label="Số lượng" rules={[{ required: true, message: 'Nhập số lượng' }]}>
                <InputNumber size="large" min={1} style={{ width: '100%' }} placeholder="VD: 1" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="description" label="Ghi chú chi tiết">
                <Input.TextArea rows={3} placeholder="Mô tả tình trạng hư hỏng (Ví dụ: Vỡ màn hình, Cháy khét...)" />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 8 }}>
            <Space>
              <Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: ACCENT_RED }}>
                Ghi Nhận & Tính Phạt
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
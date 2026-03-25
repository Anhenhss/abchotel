import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, InputNumber, notification, Select, Tooltip, Popconfirm, Switch, Row, Col } from 'antd';
import { Plus, PencilSimple, Archive, Copy, MagnifyingGlass, DoorOpen, ArrowsDownUp } from '@phosphor-icons/react';
import { roomInventoryApi } from '../api/roomInventoryApi';
import { roomApi } from '../api/roomApi';

const { Title, Text } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

const ITEM_TYPES = [
  { value: 'Minibar', label: 'Minibar (Đồ ăn/Thức uống)' },
  { value: 'Linen', label: 'Đồ vải (Khăn, Ga giường...)' },
  { value: 'Electronics', label: 'Đồ điện tử (Tivi, Máy sấy...)' },
  { value: 'Bathroom', label: 'Đồ phòng tắm' },
  { value: 'Furniture', label: 'Nội thất' },
  { value: 'Other', label: 'Khác' },
];

export default function RoomInventoryPage() {
  const [rooms, setRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState(null);
  
  const [inventory, setInventory] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);

  // Modal Thêm/Sửa
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form] = Form.useForm();

  // Modal Clone
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [cloneForm] = Form.useForm();

  // 1. Fetch danh sách phòng khi mở trang
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const res = await roomApi.getRooms(true); // Chỉ lấy phòng đang hoạt động
        setRooms(res || []);
      } catch (error) {
        notification.error({ message: 'Lỗi tải danh sách phòng', placement: 'bottomRight' });
      }
    };
    fetchRooms();
  }, []);

  // 2. Fetch inventory khi chọn phòng
  const fetchInventory = async (roomId) => {
    if (!roomId) return;
    try {
      setLoading(true);
      const res = await roomInventoryApi.getInventoryByRoom(roomId, false); // Lấy cả đồ bị ẩn
      setInventory(res || []);
    } catch (error) {
      notification.error({ message: 'Lỗi tải kho vật tư', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRoomId) {
      fetchInventory(selectedRoomId);
    } else {
      setInventory([]);
    }
  }, [selectedRoomId]);

  // Xử lý Thêm / Sửa
  const openModal = (item = null) => {
    if (!selectedRoomId) {
      notification.warning({ message: 'Vui lòng chọn một phòng trước khi thêm vật tư!', placement: 'bottomRight' });
      return;
    }
    setEditingItem(item);
    if (item) {
      form.setFieldsValue(item);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (editingItem) {
        await roomInventoryApi.updateInventory(editingItem.id, values);
        notification.success({ message: 'Cập nhật vật tư thành công!', placement: 'bottomRight' });
      } else {
        await roomInventoryApi.createInventory({ ...values, roomId: selectedRoomId });
        notification.success({ message: 'Thêm vật tư mới thành công!', placement: 'bottomRight' });
      }
      setIsModalOpen(false);
      fetchInventory(selectedRoomId);
    } catch (error) {
      notification.error({ message: error.response?.data?.message || 'Có lỗi xảy ra', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  // Xử lý Ẩn/Hiện
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await roomInventoryApi.deleteInventory(id);
      notification.success({ message: `Đã ${currentStatus ? 'ngừng theo dõi' : 'theo dõi lại'} vật tư này!`, placement: 'bottomRight' });
      fetchInventory(selectedRoomId);
    } catch (error) {
      notification.error({ message: 'Lỗi thay đổi trạng thái', placement: 'bottomRight' });
    }
  };

  // Xử lý Sao chép (Clone)
  const onCloneFinish = async (values) => {
    try {
      setLoading(true);
      await roomInventoryApi.cloneInventory(values);
      notification.success({ message: 'Sao chép kho vật tư thành công!', placement: 'bottomRight' });
      setIsCloneModalOpen(false);
      // Nếu phòng đang xem chính là phòng đích, thì tải lại dữ liệu
      if (selectedRoomId === values.targetRoomId) {
        fetchInventory(selectedRoomId);
      }
    } catch (error) {
      notification.error({ message: error.response?.data?.message || 'Lỗi sao chép', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const displayedInventory = inventory.filter(item => 
    item.itemName.toLowerCase().includes(searchText.toLowerCase())
  );

  const columns = [
    {
      title: 'Tên Vật Tư / Tài Sản', dataIndex: 'itemName', key: 'itemName',
      render: (text, record) => (
        <Text style={{ fontWeight: 600, color: record.isActive ? MIDNIGHT_BLUE : '#8c8c8c', textDecoration: record.isActive ? 'none' : 'line-through' }}>{text}</Text>
      )
    },
    {
      title: 'Phân loại', dataIndex: 'itemType', key: 'itemType',
      render: (type) => {
        const found = ITEM_TYPES.find(t => t.value === type);
        return <Tag color="blue">{found ? found.label : type}</Tag>;
      }
    },
    {
      title: 'Số lượng chuẩn', dataIndex: 'quantity', key: 'quantity', align: 'center',
      render: (qty, record) => <Text strong style={{ color: record.isActive ? '#000' : '#8c8c8c' }}>{qty}</Text>
    },
    {
      title: 'Giá đền bù (VNĐ)', dataIndex: 'priceIfLost', key: 'priceIfLost', align: 'right',
      render: (price, record) => (
        <Text style={{ color: record.isActive ? ACCENT_RED : '#8c8c8c', fontWeight: 500 }}>
          {price ? new Intl.NumberFormat('vi-VN').format(price) : '0'} ₫
        </Text>
      )
    },
    {
      title: 'Trạng thái', key: 'isActive', align: 'center', width: 150,
      render: (_, record) => (
        <Popconfirm 
          title={`Bạn muốn ${record.isActive ? 'ngừng theo dõi' : 'theo dõi lại'} món đồ này?`} 
          onConfirm={() => handleToggleStatus(record.id, record.isActive)} 
          okText="Đồng ý" cancelText="Hủy"
        >
          <Switch checked={record.isActive} size="small" style={{ backgroundColor: record.isActive ? '#52c41a' : '#d9d9d9' }} />
        </Popconfirm>
      )
    },
    {
      title: 'Thao tác', key: 'actions', align: 'right', width: 100,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Sửa thông tin">
            <Button type="text" icon={<PencilSimple size={20} color="#52677D" />} onClick={() => openModal(record)} disabled={!record.isActive} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Quản lý Kho Vật Tư Phòng</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 24, backgroundColor: '#f9fbfd' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ width: 48, height: 48, backgroundColor: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <DoorOpen size={28} color={ACCENT_RED} weight="fill" />
          </div>
          <div style={{ flex: 1 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 4 }}>Chọn phòng để xem danh sách vật tư:</Text>
            <Select
              showSearch
              placeholder="Gõ số phòng hoặc tìm kiếm..."
              style={{ width: 300 }}
              size="large"
              onChange={(val) => setSelectedRoomId(val)}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={rooms.map(r => ({ value: r.id, label: `Phòng ${r.roomNumber} - Tầng ${r.floor}` }))}
            />
          </div>
          
          <Space>
            <Button size="large" icon={<Copy size={18} />} onClick={() => setIsCloneModalOpen(true)} style={{ color: MIDNIGHT_BLUE, borderColor: MIDNIGHT_BLUE, fontWeight: 500 }}>
              SAO CHÉP KHO
            </Button>
          </Space>
        </div>
      </Card>

      {selectedRoomId ? (
        <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <Input 
              placeholder="Tìm tên vật tư..." 
              allowClear 
              size="large"
              prefix={<MagnifyingGlass color="#7D92AD" />}
              style={{ width: 250 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => openModal()} style={{ backgroundColor: ACCENT_RED, fontWeight: 'bold' }}>
              THÊM VẬT TƯ
            </Button>
          </div>

          <Table 
            columns={columns} 
            dataSource={displayedInventory} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </Card>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', backgroundColor: '#fff', borderRadius: 12, border: '1px dashed #d9d9d9' }}>
          <Archive size={64} color="#bfbfbf" weight="light" style={{ marginBottom: 16 }} />
          <Title level={5} style={{ color: '#8c8c8c' }}>Chưa chọn phòng</Title>
          <Text type="secondary">Vui lòng chọn một phòng ở khung phía trên để xem và quản lý kho vật tư.</Text>
        </div>
      )}

      {/* MODAL THÊM / SỬA */}
      <Modal 
        title={<Space><Archive size={24} color={ACCENT_RED}/><Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>{editingItem ? 'Sửa Vật Tư' : 'Thêm Vật Tư Mới'}</Title></Space>} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null} 
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item name="itemName" label="Tên vật tư / tài sản" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                <Input size="large" placeholder="VD: Khăn tắm lớn, Điều khiển Tivi..." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="itemType" label="Phân loại" rules={[{ required: true, message: 'Vui lòng chọn loại' }]}>
                <Select size="large" placeholder="Chọn phân loại..." options={ITEM_TYPES} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="quantity" label="Số lượng chuẩn" rules={[{ required: true, message: 'Nhập số lượng' }]}>
                <InputNumber size="large" min={1} style={{ width: '100%' }} placeholder="VD: 2" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="priceIfLost" label="Giá đền bù (VNĐ)" rules={[{ required: true, message: 'Nhập giá đền bù' }]}>
                <InputNumber size="large" min={0} step={10000} style={{ width: '100%' }} placeholder="VD: 150000" formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: ACCENT_RED }}>
                {editingItem ? 'Lưu Thay Đổi' : 'Thêm Vào Phòng'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* MODAL CLONE (SAO CHÉP KHO) */}
      <Modal 
        title={<Space><Copy size={24} color={MIDNIGHT_BLUE}/><Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>Sao Chép Kho Vật Tư</Title></Space>} 
        open={isCloneModalOpen} 
        onCancel={() => setIsCloneModalOpen(false)} 
        footer={null} 
        centered
      >
        <div style={{ marginBottom: 20 }}>
          <Text type="secondary">Tính năng này giúp bạn sao chép toàn bộ danh sách vật tư từ một phòng (đã thiết lập chuẩn) sang một phòng khác để tiết kiệm thời gian.</Text>
        </div>

        <Form form={cloneForm} layout="vertical" onFinish={onCloneFinish}>
          <Form.Item name="sourceRoomId" label="Từ phòng (Phòng Nguồn)" rules={[{ required: true, message: 'Chọn phòng nguồn' }]}>
            <Select showSearch size="large" placeholder="Chọn phòng có sẵn vật tư..." filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={rooms.map(r => ({ value: r.id, label: `Phòng ${r.roomNumber}` }))} />
          </Form.Item>

          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <ArrowsDownUp size={24} color="#bfbfbf" />
          </div>

          <Form.Item name="targetRoomId" label="Đến phòng (Phòng Đích)" rules={[{ required: true, message: 'Chọn phòng đích' }]}>
            <Select showSearch size="large" placeholder="Chọn phòng cần dán vật tư vào..." filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())} options={rooms.map(r => ({ value: r.id, label: `Phòng ${r.roomNumber}` }))} />
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button size="large" onClick={() => setIsCloneModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: MIDNIGHT_BLUE }}>
                Thực Hiện Sao Chép
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

    </div>
  );
}
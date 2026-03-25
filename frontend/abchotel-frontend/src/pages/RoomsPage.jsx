import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Typography, Tag, Modal, Form, Input, notification, Tooltip, Row, Col, Select, Dropdown } from 'antd';
import { Plus, Door, Broom, Warning, CheckCircle, ArrowsDownUp, SquaresFour, MagnifyingGlass, Clock, Gear, LockKey, PencilSimple, LockOpen } from '@phosphor-icons/react';
import { roomApi } from '../api/roomApi';
import { roomTypeApi } from '../api/roomTypeApi';

const { Title, Text } = Typography;

// 🎨 BẢNG MÀU
const ACCENT_RED = '#8A1538';
const PALETTE = {
  darkest: '#0D1821',
  dark: '#344966',
  muted: '#7D92AD',
  light: '#B4CDED',
  lightest: '#E9F0F8',
  reserved: '#7D92AD', // Đã đổi sang Xám Xanh theo yêu cầu
  locked: '#1f2937' // Xám Than Chì (Cho phòng bị khóa)
};

// 🎨 THEME CHO FULL-BOX PHÒNG
const STATUS_THEME = {
  Available: { bg: PALETTE.light, text: PALETTE.darkest, btnBg: PALETTE.lightest }, 
  Occupied: { bg: ACCENT_RED, text: '#FFFFFF', btnBg: 'rgba(255,255,255,0.15)' }, 
  Reserved: { bg: PALETTE.reserved, text: '#FFFFFF', btnBg: 'rgba(255,255,255,0.2)' },
  Maintenance: { bg: '#F0F2F5', text: PALETTE.dark, btnBg: '#E2E8F0' },
  Locked: { bg: PALETTE.locked, text: '#9ca3af', btnBg: 'rgba(255,255,255,0.05)' } // Giao diện khi bị khóa
};

const CLEANING_COLORS = {
  Clean: '#52c41a',   
  Dirty: '#faad14',   
  Cleaning: '#1890ff',
  Inspected: '#722ed1'
};

export default function RoomsPage() {
  // STATE TÌM KIẾM VÀ LỌC
  const [searchText, setSearchText] = useState('');
  const [filterFloor, setFilterFloor] = useState(null);
  const [filterStatus, setFilterStatus] = useState(null);
  const [filterCleaning, setFilterCleaning] = useState(null); // Lọc Sạch/Dơ
  const [filterActive, setFilterActive] = useState(null); // Lọc Hoạt động/Khóa

  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null); 
  const [form] = Form.useForm();
  const [isBulkMode, setIsBulkMode] = useState(false); 

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomsRes, typesRes] = await Promise.all([
        roomApi.getRooms(false), 
        roomTypeApi.getRoomTypes(true)
      ]);
      setRooms(roomsRes || []);
      setRoomTypes(typesRes || []);
    } catch (error) {
      notification.error({ message: 'Lỗi tải dữ liệu phòng', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = (bulk = false, room = null) => {
    setIsBulkMode(bulk);
    setEditingRoom(room);
    if (room) {
      form.setFieldsValue(room);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (editingRoom) {
        await roomApi.updateRoom(editingRoom.id, values);
        notification.success({ message: 'Cập nhật thông tin phòng thành công!', placement: 'bottomRight' });
      } else if (isBulkMode) {
        const roomNumbersArray = values.roomNumbersString.split(',').map(s => s.trim()).filter(s => s);
        await roomApi.bulkCreateRooms({ ...values, roomNumbers: roomNumbersArray });
        notification.success({ message: 'Tạo phòng hàng loạt thành công!', placement: 'bottomRight' });
      } else {
        await roomApi.createRoom(values);
        notification.success({ message: 'Tạo phòng mới thành công!', placement: 'bottomRight' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      notification.error({ message: error.response?.data?.message || 'Lỗi xử lý phòng', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id, status, type = 'Status') => {
    try {
      if (type === 'Status') await roomApi.updateStatus(id, status);
      else await roomApi.updateCleaningStatus(id, status);
      
      notification.success({ message: 'Cập nhật trạng thái thành công', placement: 'bottomRight' });
      fetchData();
    } catch (error) {
      notification.error({ message: 'Không thể đổi trạng thái', placement: 'bottomRight' });
    }
  };

  const handleToggleLock = async (id, currentStatus) => {
    try {
      await roomApi.deleteRoom(id); 
      notification.success({ message: `Đã ${currentStatus ? 'khóa' : 'mở khóa'} phòng thành công!`, placement: 'bottomRight' });
      fetchData();
    } catch (error) {
      notification.error({ message: 'Lỗi khóa/mở phòng', placement: 'bottomRight' });
    }
  };

  // LOGIC LỌC ĐA LỚP
  const displayedRooms = rooms.filter(r => {
    const matchSearch = r.roomNumber.toLowerCase().includes(searchText.toLowerCase());
    const matchFloor = filterFloor ? r.floor === filterFloor : true;
    const matchStatus = filterStatus ? r.status === filterStatus : true;
    const matchCleaning = filterCleaning ? r.cleaningStatus === filterCleaning : true;
    
    let matchActive = true;
    if (filterActive === 'Active') matchActive = r.isActive === true;
    if (filterActive === 'Locked') matchActive = r.isActive === false;

    return matchSearch && matchFloor && matchStatus && matchCleaning && matchActive;
  });

  const uniqueFloors = [...new Set(rooms.map(r => r.floor))].sort((a, b) => a - b);

  return (
    <div>
      <Title level={3} style={{ color: PALETTE.darkest, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Sơ đồ Quản lý Phòng</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          {/* BỘ LỌC ĐƯỢC BỔ SUNG ĐẦY ĐỦ */}
          <Space size="middle" wrap style={{ flex: 1 }}>
            <Input 
              placeholder="Tìm số phòng..." 
              allowClear 
              size="large"
              prefix={<MagnifyingGlass color={PALETTE.muted} />}
              style={{ width: 160 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select 
              placeholder="Tất cả Tầng" 
              allowClear 
              style={{ width: 130 }} 
              size="large"
              onChange={setFilterFloor}
              options={uniqueFloors.map(f => ({ value: f, label: `Tầng ${f}` }))}
            />
            <Select 
              placeholder="Kinh doanh" 
              allowClear 
              style={{ width: 170 }} 
              size="large"
              onChange={setFilterStatus}
              options={[
                { value: 'Available', label: 'Phòng Trống' },
                { value: 'Occupied', label: 'Đang Có Khách' },
                { value: 'Reserved', label: 'Đã Đặt Trước' },
                { value: 'Maintenance', label: 'Bảo Trì/Hỏng' }
              ]}
            />
            <Select 
              placeholder="Dọn dẹp" 
              allowClear 
              style={{ width: 140 }} 
              size="large"
              onChange={setFilterCleaning}
              options={[
                { value: 'Clean', label: 'Sạch sẽ' },
                { value: 'Dirty', label: 'Chưa dọn' },
                { value: 'Cleaning', label: 'Đang dọn' },
                { value: 'Inspected', label: 'Chờ kiểm tra' }
              ]}
            />
            <Select 
              placeholder="Tình trạng" 
              allowClear 
              style={{ width: 160 }} 
              size="large"
              onChange={setFilterActive}
              options={[
                { value: 'Active', label: 'Đang Mở Bán' },
                { value: 'Locked', label: 'Đã Khóa' }
              ]}
            />
          </Space>

          <Space>
            <Button size="large" icon={<SquaresFour size={18} />} onClick={() => openModal(true)} style={{ color: PALETTE.dark, borderColor: PALETTE.dark, fontWeight: 600 }}>
              TẠO NHIỀU PHÒNG
            </Button>
            <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => openModal(false)} style={{ backgroundColor: ACCENT_RED, fontWeight: 'bold' }}>
              TẠO 1 PHÒNG
            </Button>
          </Space>
        </div>
      </Card>

      <Row gutter={[16, 16]}>
        {displayedRooms.map(room => {
          const theme = room.isActive ? (STATUS_THEME[room.status] || STATUS_THEME['Maintenance']) : STATUS_THEME['Locked'];

          return (
            <Col xs={24} sm={12} md={8} lg={6} xl={4} key={room.id}>
              <Card 
                hoverable
                styles={{ body: { padding: '20px 16px', textAlign: 'center', backgroundColor: theme.bg, borderRadius: 12, transition: 'all 0.3s', position: 'relative' } }}
                style={{ 
                  borderRadius: 12, 
                  border: room.status === 'Maintenance' && room.isActive ? '1px solid #D9D9D9' : 'none', 
                  boxShadow: '0 6px 16px rgba(0,0,0,0.06)',
                  overflow: 'hidden'
                }}
              >
                {/* NÚT QUẢN LÝ (CỜ LÊ) GÓC TRÊN PHẢI */}
                <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
                  <Dropdown 
                    menu={{ 
                      items: [
                        { key: 'edit', label: 'Sửa thông tin', icon: <PencilSimple size={16}/>, onClick: () => openModal(false, room) },
                        { 
                          key: 'lock', 
                          label: room.isActive ? <Text type="danger">Khóa phòng (Ngừng bán)</Text> : <Text type="success">Mở khóa kinh doanh</Text>, 
                          icon: room.isActive ? <LockKey color="#ff4d4f" size={16}/> : <LockOpen color="#52c41a" size={16}/>, 
                          onClick: () => handleToggleLock(room.id, room.isActive) 
                        },
                      ] 
                    }} 
                    trigger={['click']}
                  >
                    <Gear size={20} color={theme.text} weight="fill" style={{ cursor: 'pointer', opacity: 0.7 }} />
                  </Dropdown>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 8, alignItems: 'flex-start' }}>
                  <Text strong style={{ fontSize: 24, color: theme.text, fontFamily: '"Source Serif 4", serif', lineHeight: 1 }}>
                    {room.roomNumber}
                  </Text>
                  
                  <div style={{ marginLeft: 12 }}>
                    <Dropdown 
                      disabled={!room.isActive}
                      menu={{ 
                        items: [
                          { key: 'Clean', label: 'Sạch sẽ', icon: <CheckCircle color={CLEANING_COLORS.Clean}/>, onClick: () => handleUpdateStatus(room.id, 'Clean', 'Cleaning') },
                          { key: 'Dirty', label: 'Dơ (Chưa dọn)', icon: <Warning color={CLEANING_COLORS.Dirty}/>, onClick: () => handleUpdateStatus(room.id, 'Dirty', 'Cleaning') },
                          { key: 'Cleaning', label: 'Đang dọn dẹp', icon: <Broom color={CLEANING_COLORS.Cleaning}/>, onClick: () => handleUpdateStatus(room.id, 'Cleaning', 'Cleaning') },
                          { key: 'Inspected', label: 'Chờ kiểm tra', icon: <CheckCircle color={CLEANING_COLORS.Inspected}/>, onClick: () => handleUpdateStatus(room.id, 'Inspected', 'Cleaning') },
                        ] 
                      }} 
                      trigger={['click']}
                    >
                      <Tag color={room.isActive ? CLEANING_COLORS[room.cleaningStatus] : 'default'} style={{ cursor: room.isActive ? 'pointer' : 'not-allowed', margin: 0, padding: '4px 10px', borderRadius: 20, border: 'none', fontWeight: 'bold' }}>
                        {room.cleaningStatus === 'Clean' && 'Sạch'}
                        {room.cleaningStatus === 'Dirty' && 'Dơ'}
                        {room.cleaningStatus === 'Cleaning' && 'Đang dọn'}
                        {room.cleaningStatus === 'Inspected' && 'Chờ KT'}
                      </Tag>
                    </Dropdown>
                  </div>
                </div>

                <Text style={{ display: 'block', fontSize: 13, marginBottom: 20, color: theme.text, opacity: 0.85 }}>
                  {room.isActive ? room.roomTypeName : 'Phòng Đã Khóa'}
                </Text>

                <Dropdown 
                  disabled={!room.isActive}
                  menu={{ 
                    items: [
                      { key: 'Available', label: 'Phòng Trống (Available)', onClick: () => handleUpdateStatus(room.id, 'Available', 'Status') },
                      { key: 'Occupied', label: 'Có Khách (Occupied)', onClick: () => handleUpdateStatus(room.id, 'Occupied', 'Status') },
                      { key: 'Reserved', label: 'Đã Đặt Trước (Reserved)', onClick: () => handleUpdateStatus(room.id, 'Reserved', 'Status') },
                      { key: 'Maintenance', label: 'Bảo Trì (Maintenance)', onClick: () => handleUpdateStatus(room.id, 'Maintenance', 'Status') },
                    ] 
                  }} 
                  trigger={['click']}
                >
                  <Button 
                    style={{ width: '100%', borderRadius: 8, backgroundColor: theme.btnBg, border: 'none', color: theme.text, fontWeight: 600, height: 40 }}
                    icon={!room.isActive ? <LockKey size={16} color={theme.text} /> : (room.status === 'Reserved' ? <Clock size={16} color={theme.text} /> : <ArrowsDownUp size={16} color={theme.text} />)}
                  >
                    {!room.isActive && 'NGỪNG KINH DOANH'}
                    {room.isActive && room.status === 'Available' && 'Phòng Trống'}
                    {room.isActive && room.status === 'Occupied' && 'Có Khách'}
                    {room.isActive && room.status === 'Reserved' && 'Đã Đặt Trước'}
                    {room.isActive && room.status === 'Maintenance' && 'Bảo Trì'}
                  </Button>
                </Dropdown>
              </Card>
            </Col>
          );
        })}
      </Row>

      <Modal 
        title={<Space><Door size={24} color={ACCENT_RED}/><Title level={4} style={{ color: PALETTE.darkest, margin: 0 }}>{editingRoom ? 'Sửa Thông Tin Phòng' : (isBulkMode ? 'Tạo Phòng Hàng Loạt' : 'Tạo 1 Phòng Mới')}</Title></Space>} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null} 
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="floor" label="Tầng số" rules={[{ required: true, message: 'Nhập số tầng' }]}>
                <Input type="number" size="large" placeholder="VD: 1, 2, 3..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="roomTypeId" label="Loại phòng" rules={[{ required: true, message: 'Chọn loại phòng' }]}>
                <Select size="large" placeholder="Chọn loại..." options={roomTypes.map(rt => ({ value: rt.id, label: rt.name }))} />
              </Form.Item>
            </Col>

            <Col span={24}>
              {isBulkMode && !editingRoom ? (
                <Form.Item 
                  name="roomNumbersString" 
                  label="Danh sách Số phòng (Phân cách bằng dấu phẩy)" 
                  rules={[{ required: true, message: 'Vui lòng nhập các số phòng' }]}
                >
                  <Input.TextArea rows={3} size="large" placeholder="VD: 101, 102, 103, 104..." />
                </Form.Item>
              ) : (
                <Form.Item 
                  name="roomNumber" 
                  label="Số phòng" 
                  rules={[{ required: true, message: 'Vui lòng nhập số phòng' }]}
                >
                  <Input size="large" placeholder="VD: 101" disabled={!!editingRoom} />
                </Form.Item>
              )}
            </Col>
          </Row>

          <div style={{ textAlign: 'right', marginTop: 16 }}>
            <Space>
              <Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: ACCENT_RED }}>
                {editingRoom ? 'Lưu Thay Đổi' : (isBulkMode ? 'Tạo Hàng Loạt' : 'Tạo Phòng')}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, notification, Tooltip, Popconfirm, Switch, Row, Col, InputNumber } from 'antd';
import { Plus, PencilSimple, MapPin, Compass, MapTrifold, MagnifyingGlass } from '@phosphor-icons/react';
import { attractionApi } from '../api/attractionApi';

const { Title, Text, Paragraph } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

export default function AttractionsPage() {
  const [searchText, setSearchText] = useState('');
  const [attractions, setAttractions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAttraction, setEditingAttraction] = useState(null);
  const [form] = Form.useForm();

  // THEO DÕI SỰ THAY ĐỔI CỦA Ô NHẬP LINK ĐỂ HIỂN THỊ PREVIEW BẢN ĐỒ
  const mapLink = Form.useWatch('mapEmbedLink', form);

  const fetchAttractions = async () => {
    try {
      setLoading(true);
      const res = await attractionApi.getAttractions(false); 
      setAttractions(res || []);
    } catch (error) {
      notification.error({ message: 'Lỗi tải danh sách điểm đến', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttractions();
  }, []);

  const openModal = (attraction = null) => {
    setEditingAttraction(attraction);
    if (attraction) {
      form.setFieldsValue(attraction);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (editingAttraction) {
        await attractionApi.updateAttraction(editingAttraction.id, values);
        notification.success({ message: 'Cập nhật điểm đến thành công!', placement: 'bottomRight' });
      } else {
        await attractionApi.createAttraction(values);
        notification.success({ message: 'Thêm điểm đến mới thành công!', placement: 'bottomRight' });
      }
      setIsModalOpen(false);
      fetchAttractions();
    } catch (error) {
      notification.error({ message: error.response?.data?.message || 'Có lỗi xảy ra', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await attractionApi.deleteAttraction(id);
      notification.success({ 
        message: `Đã ${currentStatus ? 'ẩn' : 'hiển thị'} điểm đến này trên Website!`, 
        placement: 'bottomRight' 
      });
      fetchAttractions();
    } catch (error) {
      notification.error({ message: 'Không thể thay đổi trạng thái', placement: 'bottomRight' });
    }
  };

  const displayedAttractions = attractions.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase()) || 
    (item.address && item.address.toLowerCase().includes(searchText.toLowerCase()))
  );

  const columns = [
    {
      title: 'Tên Địa Điểm', dataIndex: 'name', key: 'name', width: 250,
      render: (text, record) => (
        <Space style={{ opacity: record.isActive ? 1 : 0.5 }}>
          <div style={{ width: 36, height: 36, backgroundColor: '#e9f0f8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} color={record.isActive ? ACCENT_RED : '#8c8c8c'} weight="fill" />
          </div>
          <Text style={{ fontWeight: 600, color: record.isActive ? MIDNIGHT_BLUE : '#8c8c8c', fontSize: 15 }}>{text}</Text>
        </Space>
      )
    },
    {
      title: 'Khoảng cách', dataIndex: 'distanceKm', key: 'distanceKm', width: 120, align: 'center',
      render: (km, record) => <Tag color={record.isActive ? "blue" : "default"} style={{ borderRadius: 12, padding: '2px 10px', fontSize: 13 }}>{km} km</Tag>
    },
    {
      title: 'Địa chỉ', dataIndex: 'address', key: 'address',
      render: (address, record) => <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0, color: record.isActive ? '#52677D' : '#bfbfbf' }}>{address || 'Chưa cập nhật'}</Paragraph>
    },
    {
      title: 'Trạng thái hiển thị', dataIndex: 'isActive', key: 'isActive', width: 150, align: 'center',
      render: (isActive, record) => (
        <Popconfirm 
          title={`Bạn có chắc muốn ${isActive ? 'ẩn' : 'hiện'} địa điểm này trên Web?`} 
          onConfirm={() => handleToggleStatus(record.id, isActive)} 
          okText="Đồng ý" cancelText="Hủy" placement="topRight"
        >
          <Switch 
            checked={isActive} 
            checkedChildren="Đang Hiện" 
            unCheckedChildren="Đang Ẩn" 
            style={{ backgroundColor: isActive ? '#344966' : '#780000' }}
          />
        </Popconfirm>
      )
    },
    {
      title: 'Thao tác', key: 'actions', width: 100, align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Sửa thông tin">
            <Button type="text" icon={<PencilSimple size={20} color="#52677D" />} onClick={() => openModal(record)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Quản lý Điểm Du Lịch</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
          <Space direction="vertical" size="small">
            <Text style={{ color: '#52677D', fontSize: 15 }}>
              Quản lý các địa điểm lân cận, khu vui chơi, nhà hàng để giới thiệu cho khách lưu trú.
            </Text>
            <Input 
              placeholder="Tìm kiếm tên hoặc địa chỉ..." 
              allowClear 
              size="large"
              prefix={<MagnifyingGlass color="#7D92AD" />}
              style={{ width: 300, marginTop: 8 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Space>

          <Button 
            type="primary" 
            size="large" 
            icon={<Plus size={18} />} 
            onClick={() => openModal()} 
            style={{ backgroundColor: ACCENT_RED, borderRadius: 8, fontWeight: 'bold' }}
          >
            THÊM ĐIỂM ĐẾN
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={displayedAttractions} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
        />
      </Card>

      <Modal 
        title={<Space><Compass size={24} color={ACCENT_RED}/><Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>{editingAttraction ? 'Sửa Thông Tin Địa Điểm' : 'Thêm Địa Điểm Mới'}</Title></Space>} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null} 
        width={800}
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={18}>
              <Form.Item name="name" label="Tên địa điểm" rules={[{ required: true, message: 'Vui lòng nhập tên địa điểm' }]}>
                <Input size="large" placeholder="VD: Bãi biển Mỹ Khê, Vinpearl Land..." />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="distanceKm" label="Cách KS (km)">
                <InputNumber size="large" style={{ width: '100%' }} min={0} step={0.1} placeholder="VD: 2.5" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="address" label="Địa chỉ chi tiết">
                <Input size="large" prefix={<MapTrifold color="#bfbfbf" />} placeholder="Nhập địa chỉ cụ thể..." />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="description" label="Mô tả ngắn gọn">
                <Input.TextArea rows={3} placeholder="Giới thiệu vài nét nổi bật về địa điểm này để thu hút du khách..." />
              </Form.Item>
            </Col>
          </Row>

          <div style={{ backgroundColor: '#f9fbfd', padding: '20px', borderRadius: 8, marginBottom: 24, border: '1px solid #e9f0f8' }}>
            <Text strong style={{ color: MIDNIGHT_BLUE, display: 'block', marginBottom: 12 }}>Bản đồ Google Maps (Khuyên dùng)</Text>
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item name="mapEmbedLink" label="Đường dẫn nhúng (Embed Link) iframe" help="Lên Google Maps > Tìm điểm đến > Chia sẻ > Nhúng bản đồ > Copy đoạn link bên trong thuộc tính src='...'">
                  <Input size="large" placeholder='VD: https://www.google.com/maps/embed?pb=...' />
                </Form.Item>
                
                {/* TÍNH NĂNG PREVIEW BẢN ĐỒ TỰ ĐỘNG */}
                {mapLink && mapLink.includes('http') && (
                  <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9', height: 250 }}>
                    <iframe src={mapLink} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy" referrerPolicy="no-referrer"></iframe>
                  </div>
                )}
              </Col>
              
              <Col span={24} style={{ marginTop: 16 }}>
                <Text type="secondary" style={{ fontSize: 13 }}>* Tọa độ Latitude/Longitude bên dưới có thể để trống (Dành cho việc mở rộng tính năng API sau này).</Text>
              </Col>
              <Col span={12} style={{ marginTop: 8 }}>
                <Form.Item name="latitude" label="Vĩ độ (Latitude)">
                  <InputNumber style={{ width: '100%' }} placeholder="VD: 16.0544" step={0.000001} />
                </Form.Item>
              </Col>
              <Col span={12} style={{ marginTop: 8 }}>
                <Form.Item name="longitude" label="Kinh độ (Longitude)">
                  <InputNumber style={{ width: '100%' }} placeholder="VD: 108.2022" step={0.000001} />
                </Form.Item>
              </Col>
            </Row>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: ACCENT_RED }}>
                {editingAttraction ? 'Lưu Thay Đổi' : 'Thêm Địa Điểm'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <style>{`
        .ant-table-thead > tr > th { background-color: #e9f0f8 !important; color: #1C2E4A !important; font-weight: 700 !important; }
        .table-row-light { background-color: #ffffff; }
        .table-row-dark { background-color: #fcfcfc; }
        .ant-table-tbody > tr:hover > td { background-color: #f0f4f8 !important; }
      `}</style>
    </div>
  );
}
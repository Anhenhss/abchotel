import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, notification, Tooltip, Popconfirm, Switch, Row, Col, InputNumber, Upload, Image } from 'antd';
import { Plus, PencilSimple, Trash, Image as ImageIcon, CheckCircle, UploadSimple, Bed, Users } from '@phosphor-icons/react';
import { roomTypeApi } from '../api/roomTypeApi';
import { mediaApi } from '../api/mediaApi';

const { Title, Text } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

export default function RoomTypesPage() {
  // STATE TÌM KIẾM
  const [searchText, setSearchText] = useState('');

  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modal Thêm/Sửa thông tin
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState(null);
  const [form] = Form.useForm();

  // Modal Quản lý Ảnh
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedRoomType, setSelectedRoomType] = useState(null);

  const fetchRoomTypes = async () => {
    try {
      setLoading(true);
      const res = await roomTypeApi.getRoomTypes(false); 
      setRoomTypes(res || []);
      
      if (selectedRoomType) {
        const updatedRt = res.find(r => r.id === selectedRoomType.id);
        if (updatedRt) setSelectedRoomType(updatedRt);
      }
    } catch (error) {
      notification.error({ message: 'Lỗi tải dữ liệu Loại phòng', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomTypes();
  }, []);

  // ================= 1. XỬ LÝ THÔNG TIN CƠ BẢN =================
  const openModal = (rt = null) => {
    setEditingRoomType(rt);
    if (rt) {
      form.setFieldsValue(rt);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (editingRoomType) {
        await roomTypeApi.updateRoomType(editingRoomType.id, values);
        notification.success({ message: 'Cập nhật thành công!', placement: 'bottomRight' });
      } else {
        await roomTypeApi.createRoomType(values);
        notification.success({ message: 'Tạo loại phòng thành công!', placement: 'bottomRight' });
      }
      setIsModalOpen(false);
      fetchRoomTypes();
    } catch (error) {
      notification.error({ message: error.response?.data?.message || 'Có lỗi xảy ra', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await roomTypeApi.deleteRoomType(id);
      notification.success({ message: `Đã ${currentStatus ? 'Ngừng bán' : 'Mở bán'} loại phòng!`, placement: 'bottomRight' });
      fetchRoomTypes();
    } catch (error) {
      notification.error({ message: 'Không thể đổi trạng thái', placement: 'bottomRight' });
    }
  };

  // ================= 2. XỬ LÝ QUẢN LÝ ẢNH =================
  const openImageModal = (rt) => {
    setSelectedRoomType(rt);
    setIsImageModalOpen(true);
  };

  const handleUploadImage = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      setLoading(true);
      const uploadRes = await mediaApi.uploadImage(file);
      const isFirstImage = !selectedRoomType.images || selectedRoomType.images.length === 0;
      await roomTypeApi.addRoomImage(selectedRoomType.id, { 
        imageUrl: uploadRes.data.url, 
        isPrimary: isFirstImage 
      });
      notification.success({ message: 'Đã thêm ảnh mới!', placement: 'bottomRight' });
      fetchRoomTypes();
      onSuccess("ok");
    } catch (error) {
      notification.error({ message: 'Lỗi tải ảnh lên', placement: 'bottomRight' });
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageId) => {
    try {
      setLoading(true);
      await roomTypeApi.deleteRoomImage(imageId);
      notification.success({ message: 'Đã xóa ảnh!', placement: 'bottomRight' });
      fetchRoomTypes();
    } catch (error) {
      notification.error({ message: 'Không thể xóa ảnh', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimaryImage = async (imageId) => {
    try {
      setLoading(true);
      await roomTypeApi.setPrimaryImage(selectedRoomType.id, imageId);
      notification.success({ message: 'Đã cập nhật ảnh đại diện!', placement: 'bottomRight' });
      fetchRoomTypes();
    } catch (error) {
      notification.error({ message: 'Lỗi cài đặt ảnh đại diện', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  // ================= 3. BỘ LỌC TÌM KIẾM =================
  const displayedRoomTypes = roomTypes.filter(rt => 
    rt.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // ================= 4. CỘT CỦA BẢNG =================
  const columns = [
    {
      title: 'Tên & Ảnh', dataIndex: 'name', key: 'name', width: 280,
      render: (text, record) => {
        const primaryImg = record.images?.find(i => i.isPrimary) || record.images?.[0];
        return (
          <Space>
            {primaryImg ? (
              <Image src={primaryImg.imageUrl} width={50} height={35} style={{ objectFit: 'cover', borderRadius: 4 }} />
            ) : (
              <div style={{ width: 50, height: 35, backgroundColor: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon color="#bfbfbf" /></div>
            )}
            <Text style={{ fontWeight: 600, color: MIDNIGHT_BLUE, fontSize: 14 }}>{text}</Text>
          </Space>
        )
      }
    },
    {
      title: 'Giá niêm yết (VNĐ)', dataIndex: 'basePrice', key: 'basePrice',
      render: (price) => <Text strong style={{ color: ACCENT_RED }}>{price.toLocaleString()} đ</Text>
    },
    {
      title: 'Sức chứa', key: 'capacity',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Người lớn"><Tag icon={<Users />} color="blue">{record.capacityAdults}</Tag></Tooltip>
          <Tooltip title="Trẻ em"><Tag color="cyan">+{record.capacityChildren} TE</Tag></Tooltip>
        </Space>
      )
    },
    {
      title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', align: 'center',
      render: (isActive, record) => (
        <Popconfirm title={`Bạn có chắc muốn ${isActive ? 'ngừng bán' : 'mở bán'} loại phòng này?`} onConfirm={() => handleToggleStatus(record.id, isActive)} okText="Đồng ý" cancelText="Hủy" placement="topRight">
          <Switch checked={isActive} checkedChildren="Đang Mở Bán" unCheckedChildren="Ngừng Bán" style={{ backgroundColor: isActive ? '#344966' : '#780000' }} />
        </Popconfirm>
      )
    },
    {
      title: 'Thao tác', key: 'actions', align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Quản lý kho ảnh">
            <Button type="text" icon={<ImageIcon size={20} color="#1890ff" />} onClick={() => openImageModal(record)} />
          </Tooltip>
          <Tooltip title="Chỉnh sửa thông tin">
            <Button type="text" icon={<PencilSimple size={20} color="#52677D" />} onClick={() => openModal(record)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Quản lý Loại Phòng</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <Space direction="vertical" size="small">
            <Input.Search 
              placeholder="Tìm kiếm theo tên loại phòng..." 
              allowClear 
              size="large"
              style={{ width: 300, marginTop: 8 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Space>

          <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => openModal()} style={{ backgroundColor: ACCENT_RED, borderRadius: 8, fontWeight: 'bold' }}>
            TẠO LOẠI PHÒNG
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={displayedRoomTypes} 
          rowKey="id" 
          loading={loading} 
          pagination={{ pageSize: 10 }} 
          rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'} 
        />
      </Card>

      {/* MODAL 1: THÊM / SỬA THÔNG TIN */}
      <Modal title={<Space><Bed size={24} color={ACCENT_RED}/><Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>{editingRoomType ? 'Sửa Loại Phòng' : 'Tạo Loại Phòng'}</Title></Space>} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={800} centered>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item name="name" label="Tên loại phòng" rules={[{ required: true, message: 'Vui lòng nhập tên' }]}>
                <Input size="large" placeholder="VD: Deluxe Double City View..." />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="basePrice" label="Giá niêm yết (VNĐ)" rules={[{ required: true, message: 'Vui lòng nhập giá' }]}>
                <InputNumber size="large" style={{ width: '100%' }} formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={value => value?.replace(/\$\s?|(,*)/g, '')} />
              </Form.Item>
            </Col>
            
            <Col span={6}>
              <Form.Item name="capacityAdults" label="Người lớn tối đa" rules={[{ required: true, message: 'Nhập SL' }]}>
                <InputNumber size="large" style={{ width: '100%' }} min={1} max={10} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="capacityChildren" label="Trẻ em tối đa" rules={[{ required: true, message: 'Nhập SL' }]}>
                <InputNumber size="large" style={{ width: '100%' }} min={0} max={10} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="sizeSqm" label="Diện tích (m²)">
                <InputNumber size="large" style={{ width: '100%' }} min={10} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="bedType" label="Loại giường">
                <Input size="large" placeholder="VD: 1 giường King" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item name="viewDirection" label="Hướng nhìn (View)">
                <Input size="large" placeholder="VD: Hướng biển, Hướng thành phố..." />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="description" label="Mô tả chi tiết">
                <Input.TextArea rows={4} placeholder="Viết vài dòng mô tả sự sang trọng của căn phòng..." />
              </Form.Item>
            </Col>
          </Row>
          
          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: MIDNIGHT_BLUE }}>Lưu Thông Tin</Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* MODAL 2: QUẢN LÝ KHO ẢNH */}
      <Modal title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>Kho ảnh: {selectedRoomType?.name}</Title>} open={isImageModalOpen} onCancel={() => setIsImageModalOpen(false)} footer={null} width={700} centered>
        <div style={{ marginBottom: 24, textAlign: 'center', padding: '20px', backgroundColor: '#f9fbfd', borderRadius: 8, border: '1px dashed #d9d9d9' }}>
          <Upload customRequest={handleUploadImage} showUploadList={false} accept="image/*">
            <Button size="large" type="primary" icon={<UploadSimple size={20} />} loading={loading} style={{ backgroundColor: ACCENT_RED, fontWeight: 'bold' }}>Tải Ảnh Mới Lên</Button>
          </Upload>
          <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>Hỗ trợ JPG, PNG. Khuyên dùng ảnh khổ ngang.</Text>
        </div>

        <Row gutter={[16, 16]}>
          {selectedRoomType?.images?.length > 0 ? (
            selectedRoomType.images.map(img => (
              <Col span={8} key={img.id}>
                <Card 
                  hoverable 
                  cover={<Image src={img.imageUrl} style={{ height: 120, objectFit: 'cover' }} />}
                  styles={{ body: { padding: '12px', textAlign: 'center' } }}
                  style={{ border: img.isPrimary ? `2px solid ${ACCENT_RED}` : '1px solid #f0f0f0' }}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    {img.isPrimary ? (
                      <Tag color="error" style={{ margin: 0 }}><CheckCircle weight="fill"/> Ảnh đại diện</Tag>
                    ) : (
                      <Button size="small" type="dashed" onClick={() => handleSetPrimaryImage(img.id)} block>Đặt làm đại diện</Button>
                    )}
                    <Popconfirm title="Xóa ảnh này?" onConfirm={() => handleDeleteImage(img.id)} okText="Xóa" cancelText="Hủy">
                      <Button size="small" danger block icon={<Trash />}>Xóa ảnh</Button>
                    </Popconfirm>
                  </Space>
                </Card>
              </Col>
            ))
          ) : (
            <div style={{ width: '100%', textAlign: 'center', padding: '30px 0', color: '#bfbfbf' }}>Phòng này chưa có hình ảnh nào.</div>
          )}
        </Row>
      </Modal>

      <style>{`
        .ant-table-thead > tr > th { background-color: #e9f0f8 !important; color: #1C2E4A !important; font-weight: 700 !important; }
        .table-row-light { background-color: #ffffff; }
        .table-row-dark { background-color: #fcfcfc; }
      `}</style>
    </div>
  );
}
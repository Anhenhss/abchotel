import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, notification, Tooltip, Popconfirm, Switch } from 'antd';
import { Plus, PencilSimple, Folder, Trash } from '@phosphor-icons/react';
import { categoryApi } from '../api/categoryApi';

const { Title, Text } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

export default function CategoriesPage() {
  // State cho bộ lọc tìm kiếm
  const [searchText, setSearchText] = useState('');
  
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();

  // ================= 1. FETCH DỮ LIỆU =================
  const fetchCategories = async () => {
    try {
      setLoading(true);
      // Quản lý thì phải thấy cả danh mục đang bị ẩn (onlyActive = false)
      const res = await categoryApi.getCategories(false);
      setCategories(res || []);
    } catch (error) {
      notification.error({ message: 'Lỗi tải danh sách danh mục', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ================= 2. THÊM / SỬA DANH MỤC =================
  const openModal = (category = null) => {
    setEditingCategory(category);
    if (category) {
      form.setFieldsValue(category);
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (editingCategory) {
        await categoryApi.updateCategory(editingCategory.id, values);
        notification.success({ message: 'Cập nhật danh mục thành công!', placement: 'bottomRight' });
      } else {
        await categoryApi.createCategory(values);
        notification.success({ message: 'Tạo danh mục mới thành công!', placement: 'bottomRight' });
      }
      setIsModalOpen(false);
      fetchCategories();
    } catch (error) {
      notification.error({ message: error.response?.data?.message || 'Có lỗi xảy ra', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  // ================= 3. ẨN / HIỆN DANH MỤC (SOFT DELETE) =================
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      await categoryApi.toggleStatus(id);
      notification.success({ 
        message: `Đã ${currentStatus ? 'ẩn' : 'hiện'} danh mục thành công!`, 
        placement: 'bottomRight' 
      });
      fetchCategories();
    } catch (error) {
      notification.error({ message: 'Không thể thay đổi trạng thái', placement: 'bottomRight' });
    }
  };

  // ================= 4. LOGIC LỌC DỮ LIỆU TẠI FRONTEND =================
  const displayedCategories = categories.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase())
  );

  // ================= 5. CỘT CỦA BẢNG =================
  const columns = [
    {
        title: 'Tên Danh Mục', dataIndex: 'name', key: 'name',
        render: (text) => (
          <Space>
            <Folder size={20} color={MIDNIGHT_BLUE} weight="duotone" />
            <Text style={{ fontWeight: 600, color: MIDNIGHT_BLUE, fontSize: 15 }}>{text}</Text>
          </Space>
        )
    },
    {
      title: 'Đường dẫn (Slug)', dataIndex: 'slug', key: 'slug',
      render: (slug) => <Tag color="blue" style={{ borderRadius: 4, fontFamily: 'monospace' }}>/{slug}</Tag>
    },
    {
      title: 'Mô tả', dataIndex: 'description', key: 'description',
      render: (desc) => <Text type="secondary">{desc || 'Không có mô tả'}</Text>
    },
    {
      title: 'Trạng thái hiển thị', dataIndex: 'isActive', key: 'isActive',
      render: (isActive, record) => (
        <Popconfirm 
          title={`Bạn có chắc muốn ${isActive ? 'ẩn' : 'hiện'} danh mục này trên Web?`} 
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
      title: 'Thao tác', key: 'actions', align: 'right',
      render: (_, record) => (
        <Space size="middle">
          <Tooltip title="Chỉnh sửa danh mục">
            <Button type="text" icon={<PencilSimple size={20} color="#52677D" />} onClick={() => openModal(record)} />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Quản lý Danh mục Bài viết</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        {/* THANH TÌM KIẾM VÀ NÚT THÊM MỚI */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <Space direction="vertical" size="small">
            <Input.Search 
              placeholder="Tìm kiếm danh mục..." 
              allowClear 
              size="large"
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
            TẠO DANH MỤC
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={displayedCategories} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
        />
      </Card>

      {/* MODAL THÊM / SỬA DANH MỤC */}
      <Modal 
        title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>{editingCategory ? 'Sửa Danh Mục' : 'Tạo Danh Mục Mới'}</Title>} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={null} 
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, message: 'Vui lòng nhập tên danh mục' }]}>
            <Input size="large" placeholder="Ví dụ: Tin tức Khách sạn, Ưu đãi..." />
          </Form.Item>
          
          <Form.Item name="description" label="Mô tả ngắn">
            <Input.TextArea rows={3} placeholder="Viết vài dòng mô tả về danh mục này..." />
          </Form.Item>

          {!editingCategory && (
            <Text type="secondary" style={{ display: 'block', marginBottom: 20, fontStyle: 'italic' }}>
              * Hệ thống sẽ tự động tạo đường dẫn (Slug) dựa trên tên danh mục của bạn.
            </Text>
          )}

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: ACCENT_RED }}>
                {editingCategory ? 'Lưu thay đổi' : 'Tạo mới'}
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
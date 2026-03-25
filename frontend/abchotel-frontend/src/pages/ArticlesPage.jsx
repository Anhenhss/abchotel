import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, notification, Tooltip, Popconfirm, Select, Upload, Image } from 'antd';
import { Plus, PencilSimple, Article, Trash, Image as ImageIcon, Eye, GlobeHemisphereWest, LockKey, UploadSimple, ArrowCounterClockwise } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { articleApi } from '../api/articleApi';
import { categoryApi } from '../api/categoryApi';
import { mediaApi } from '../api/mediaApi';

const { Title, Text } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';
const SUCCESS_GREEN = '#52c41a';

export default function ArticlesPage() {
  const [searchText, setSearchText] = useState('');
  const [filterCategory, setFilterCategory] = useState(null);
  
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [form] = Form.useForm();

  const [isThumbModalOpen, setIsThumbModalOpen] = useState(false);
  const [selectedArticleId, setSelectedArticleId] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [artRes, catRes] = await Promise.all([
        articleApi.getArticles(false), 
        categoryApi.getCategories(true) 
      ]);
      setArticles(artRes || []);
      setCategories(catRes || []);
    } catch (error) {
      notification.error({ message: 'Lỗi tải dữ liệu', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openModal = async (article = null) => {
    setEditingArticle(article);
    if (article) {
      try {
        setLoading(true);
        const detail = await articleApi.getArticleBySlug(article.slug);
        form.setFieldsValue(detail);
      } catch (err) {
        notification.error({ message: 'Lỗi lấy chi tiết bài viết' });
      } finally {
        setLoading(false);
      }
    } else {
      form.resetFields();
    }
    setIsModalOpen(true);
  };

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (editingArticle) {
        await articleApi.updateArticle(editingArticle.id, values);
        notification.success({ message: 'Cập nhật bài viết thành công!', placement: 'bottomRight' });
      } else {
        await articleApi.createArticle(values);
        notification.success({ message: 'Tạo bản nháp thành công!', placement: 'bottomRight' });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      notification.error({ message: error.response?.data?.message || 'Có lỗi xảy ra', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePublish = async (id) => {
    try {
      await articleApi.togglePublish(id);
      notification.success({ message: 'Đã cập nhật trạng thái Xuất bản', placement: 'bottomRight' });
      fetchData();
    } catch (error) {
      notification.error({ message: 'Lỗi đổi trạng thái', placement: 'bottomRight' });
    }
  };

  // LOGIC THÔNG BÁO XÓA/KHÔI PHỤC THÔNG MINH
  const handleToggleSoftDelete = async (record) => {
    try {
      await articleApi.deleteArticle(record.id);
      notification.success({ 
        message: record.isActive ? 'Đã đưa bài viết vào thùng rác!' : 'Đã khôi phục bài viết thành công!', 
        placement: 'bottomRight' 
      });
      fetchData();
    } catch (error) {
      notification.error({ message: 'Lỗi thao tác trạng thái', placement: 'bottomRight' });
    }
  };

  const handleUploadThumbnail = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      setLoading(true);
      const uploadRes = await mediaApi.uploadImage(file);
      await articleApi.updateThumbnail(selectedArticleId, { thumbnailUrl: uploadRes.data.url });
      
      notification.success({ message: 'Cập nhật ảnh bìa thành công!', placement: 'bottomRight' });
      setIsThumbModalOpen(false);
      fetchData();
      onSuccess("ok");
    } catch (error) {
      notification.error({ message: 'Tải ảnh thất bại', placement: 'bottomRight' });
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  const displayedArticles = articles.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchText.toLowerCase());
    const matchCategory = filterCategory ? item.categoryName === filterCategory : true;
    return matchSearch && matchCategory;
  });
  
  const columns = [
    {
      title: 'Tiêu đề bài viết', dataIndex: 'title', key: 'title', width: 350,
      render: (text, record) => (
        <Space style={{ opacity: record.isActive ? 1 : 0.5 }}>
          {record.thumbnailUrl ? (
            <Image src={record.thumbnailUrl} width={50} height={35} style={{ objectFit: 'cover', borderRadius: 4, filter: record.isActive ? 'none' : 'grayscale(100%)' }} />
          ) : (
            <div style={{ width: 50, height: 35, backgroundColor: '#f0f0f0', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ImageIcon color="#bfbfbf" /></div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Text style={{ fontWeight: 600, color: record.isActive ? MIDNIGHT_BLUE : '#8c8c8c', fontSize: 14, width: 250, textDecoration: record.isActive ? 'none' : 'line-through' }} ellipsis>
              {text}
            </Text>
            <Space size="small">
              <Text type="secondary" style={{ fontSize: 12 }}>Tác giả: {record.authorName}</Text>
              {!record.isActive && <Tag color="error" style={{ fontSize: 10, lineHeight: '14px', border: 'none' }}>Đã Xóa</Tag>}
            </Space>
          </div>
        </Space>
      )
    },
    {
      title: 'Danh mục', dataIndex: 'categoryName', key: 'categoryName',
      render: (cat, record) => <Tag color={record.isActive ? "blue" : "default"} style={{ borderRadius: 12 }}>{cat}</Tag>
    },
    {
      title: 'Lượt xem', dataIndex: 'viewCount', key: 'viewCount', align: 'center',
      render: (views, record) => <Space style={{ opacity: record.isActive ? 1 : 0.5 }}><Eye size={16} color="#52677D"/><Text strong>{views}</Text></Space>
    },
    {
      title: 'Trạng thái', key: 'status', align: 'center',
      render: (_, record) => {
        if (!record.isActive) return <Tag color="default">Trong thùng rác</Tag>;
        return record.publishedAt 
          ? <Tag icon={<GlobeHemisphereWest />} color="success">Đã Xuất Bản</Tag> 
          : <Tag icon={<LockKey />} color="warning">Bản Nháp</Tag>;
      }
    },
    {
      title: 'Thao tác', key: 'actions', align: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.isActive ? (
            // NẾU ĐANG HOẠT ĐỘNG -> Hiện đầy đủ nút
            <>
              <Tooltip title="Đổi Ảnh bìa">
                <Button type="text" icon={<ImageIcon size={20} color="#1890ff" />} onClick={() => { setSelectedArticleId(record.id); setIsThumbModalOpen(true); }} />
              </Tooltip>
              <Tooltip title={record.publishedAt ? "Gỡ Xuất bản (Đưa về Nháp)" : "Xuất bản bài này lên Web"}>
                <Button type="text" icon={record.publishedAt ? <LockKey size={20} color="#faad14" /> : <GlobeHemisphereWest size={20} color="#52c41a" />} onClick={() => handleTogglePublish(record.id)} />
              </Tooltip>
              <Tooltip title="Sửa nội dung">
                <Button type="text" icon={<PencilSimple size={20} color="#52677D" />} onClick={() => openModal(record)} />
              </Tooltip>
              <Popconfirm title="Bạn có chắc muốn đưa bài viết này vào Thùng rác?" onConfirm={() => handleToggleSoftDelete(record)} okText="Đồng ý" cancelText="Hủy" placement="topRight">
                <Button type="text" danger icon={<Trash size={20} />} />
              </Popconfirm>
            </>
          ) : (
            // NẾU ĐÃ BỊ XÓA MỀM -> Chỉ hiện nút Khôi phục
            <Popconfirm title="Bạn muốn khôi phục bài viết này để tiếp tục sử dụng?" onConfirm={() => handleToggleSoftDelete(record)} okText="Khôi phục" cancelText="Hủy" placement="topRight">
              <Button type="primary" size="small" icon={<ArrowCounterClockwise size={16} />} style={{ backgroundColor: SUCCESS_GREEN, fontSize: 13, display: 'flex', alignItems: 'center' }}>
                Khôi phục
              </Button>
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Quản lý Bài viết & Blog</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        
        {/* THANH TÌM KIẾM VÀ NÚT THÊM MỚI */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <Space size="middle">
            <Input.Search 
              placeholder="Tìm theo Tiêu đề bài viết..." 
              allowClear 
              size="large"
              style={{ width: 300 }}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Select 
              placeholder="Lọc theo Danh mục" 
              allowClear 
              size="large"
              style={{ width: 200 }} 
              onChange={(val) => setFilterCategory(val)} 
              options={categories.map(c => ({ value: c.name, label: c.name }))} 
            />
          </Space>

          <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => openModal()} style={{ backgroundColor: ACCENT_RED, borderRadius: 8, fontWeight: 'bold' }}>
            VIẾT BÀI MỚI
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={displayedArticles} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
        />
      </Card>

      {/* MODAL THÊM / SỬA BÀI VIẾT */}
      <Modal title={<Space><Article size={24} color={ACCENT_RED}/><Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>{editingArticle ? 'Sửa Bài Viết' : 'Viết Bài Mới'}</Title></Space>} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={1000} centered>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
          <div style={{ display: 'flex', gap: 16 }}>
            <Form.Item name="title" label="Tiêu đề bài viết" rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]} style={{ flex: 2 }}>
              <Input size="large" placeholder="Nhập tiêu đề thật hấp dẫn..." />
            </Form.Item>
            <Form.Item name="categoryId" label="Thuộc danh mục" rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]} style={{ flex: 1 }}>
              <Select size="large" placeholder="Chọn danh mục" options={categories.map(c => ({ value: c.id, label: c.name }))} />
            </Form.Item>
          </div>
          
          <Form.Item name="shortDescription" label="Mô tả ngắn (Hiển thị ngoài trang chủ)">
            <Input.TextArea rows={2} placeholder="Vài dòng tóm tắt nội dung..." />
          </Form.Item>

          <Form.Item name="content" label="Nội dung chi tiết (Văn bản)" rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}>
            <Input.TextArea rows={12} placeholder="Viết nội dung bài đăng tại đây... (Có thể tích hợp thư viện Trình soạn thảo văn bản RichText ở đây sau này)" />
          </Form.Item>

          <div style={{ backgroundColor: '#f9fbfd', padding: '16px', borderRadius: 8, marginBottom: 24, border: '1px solid #e9f0f8' }}>
            <Text strong style={{ color: MIDNIGHT_BLUE, display: 'block', marginBottom: 12 }}>Cấu hình SEO (Tối ưu Google Search)</Text>
            <Form.Item name="metaTitle" label="Tiêu đề SEO">
              <Input placeholder="Nếu để trống sẽ tự lấy Tiêu đề bài viết" />
            </Form.Item>
            <Form.Item name="metaDescription" label="Mô tả SEO">
              <Input.TextArea rows={2} placeholder="Mô tả dùng để hiển thị trên kết quả tìm kiếm Google..." />
            </Form.Item>
          </div>

          <div style={{ textAlign: 'right' }}>
            <Space>
              <Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: MIDNIGHT_BLUE, fontWeight: 'bold' }}>
                {editingArticle ? 'Lưu thay đổi' : 'Lưu Bản nháp'}
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* MODAL CẬP NHẬT ẢNH BÌA */}
      <Modal title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>Cập nhật Ảnh bìa (Thumbnail)</Title>} open={isThumbModalOpen} onCancel={() => setIsThumbModalOpen(false)} footer={null} centered>
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <Text type="secondary" style={{ display: 'block', marginBottom: 24 }}>Hỗ trợ định dạng .JPG, .PNG. Dung lượng tối đa 5MB.</Text>
          <Upload customRequest={handleUploadThumbnail} showUploadList={false} accept="image/*">
            <Button size="large" type="primary" icon={<UploadSimple size={20} />} loading={loading} style={{ backgroundColor: ACCENT_RED, height: 50, borderRadius: 8, padding: '0 30px', fontWeight: 'bold' }}>
              Chọn Ảnh Từ Máy Tính
            </Button>
          </Upload>
        </div>
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
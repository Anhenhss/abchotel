import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Typography, notification, Row, Col, Upload, Switch, Space, Divider, Image } from 'antd';
import { ArrowLeft, FloppyDisk, ImageSquare, UploadSimple, Trash } from '@phosphor-icons/react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 

import { articleApi } from '../../api/articleApi';   
import { categoryApi } from '../../api/categoryApi'; 
import { mediaApi } from '../../api/mediaApi';
import { COLORS } from '../../constants/theme';

const { Title, Text } = Typography;

// 🔥 Định nghĩa bên ngoài để tránh React nhận diện là Object mới gây vòng lặp
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }], 
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image', 'video'], 
    ['clean'] 
  ],
};

export default function ArticleEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const [searchParams] = useSearchParams();
  const prefillCategoryId = searchParams.get('category');

  const [form] = Form.useForm();
  
  // 🔥 Bắt buộc hiển thị thông báo cá nhân ở góc Dưới Phải
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });
  
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  
  const [content, setContent] = useState(''); 
  const [thumbnailUrl, setThumbnailUrl] = useState(null);
  const [initialState, setInitialState] = useState({ isPublished: false, thumbnailUrl: null });

  useEffect(() => {
    categoryApi.getCategories(true).then(res => setCategories(res || []));

    if (id) {
      setLoading(true);
      articleApi.getArticles(false).then(res => {
        const items = res.items || res;
        const articleToEdit = items.find(a => a.id.toString() === id);
        if (articleToEdit) {
          const isPub = articleToEdit.publishedAt != null;
          form.setFieldsValue({
            title: articleToEdit.title,
            summary: articleToEdit.shortDescription, 
            categoryId: articleToEdit.categoryId,
            isPublished: isPub
          });
          setContent(articleToEdit.content || '');
          setThumbnailUrl(articleToEdit.thumbnailUrl);
          setInitialState({ isPublished: isPub, thumbnailUrl: articleToEdit.thumbnailUrl });
        }
        setLoading(false);
      });
    } else if (prefillCategoryId) {
      form.setFieldsValue({ categoryId: parseInt(prefillCategoryId) });
    }
  }, [id, prefillCategoryId, form]);

  const handleUploadThumbnail = async (options) => {
    const { file, onSuccess, onError } = options;
    try {
      setLoading(true);
      const uploadRes = await mediaApi.uploadImage(file);
      const newUrl = uploadRes.data?.url || uploadRes.url || uploadRes;
      setThumbnailUrl(newUrl);
      onSuccess("ok");
    } catch (error) {
      api.error({ title: 'Lỗi', description: 'Tải ảnh bìa thất bại.' });
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 Fix lỗi vòng lặp vô tận (Maximum update depth)
  const handleContentChange = (value, delta, source) => {
    if (source === 'user' && value !== content) {
      setContent(value);
    } else if (source === 'api' && !content) {
      setContent(value);
    }
  };

  const handleSaveArticle = async (values) => {
    try {
      setLoading(true);
      
      // 🔥 Fix lỗi 400 Bad Request: Mapping chính xác các trường mà C# DTO yêu cầu
      const payload = { 
        categoryId: values.categoryId,
        title: values.title || "",
        shortDescription: values.summary || "", 
        content: content || "",
        metaTitle: values.title || "", 
        metaDescription: values.summary || "" 
        // BỎ TRƯỜNG "SLUG" RA VÌ C# DTO KHÔNG CÓ TRƯỜNG NÀY!
      }; 

      let articleId = id;

      if (id) {
        await articleApi.updateArticle(id, payload); 
      } else {
        const res = await articleApi.createArticle(payload); 
        articleId = res.articleId || res.data?.articleId || res.id;
      }

      if (articleId && thumbnailUrl !== initialState.thumbnailUrl) {
        try { await articleApi.updateThumbnail(articleId, { thumbnailUrl: thumbnailUrl || "" }); } catch(e) {}
      }

      if (articleId && values.isPublished !== initialState.isPublished) {
        try { await articleApi.togglePublish(articleId); } catch(e) {}
      }

      api.success({ title: 'Thành công', description: 'Đã lưu bài viết.' });
      setTimeout(() => navigate(payload.categoryId ? `/admin/articles?category=${payload.categoryId}` : '/admin/articles'), 1000);
    } catch (error) {
      api.error({ title: 'Lỗi', description: 'Không thể lưu bài viết. Vui lòng kiểm tra dữ liệu.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ paddingBottom: 40, maxWidth: 1200, margin: '0 auto' }}>
      {contextHolder}
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <Space>
          <Button type="text" icon={<ArrowLeft size={24} />} onClick={() => navigate(prefillCategoryId ? `/admin/articles?category=${prefillCategoryId}` : '/admin/articles')} />
          <Title level={3} style={{ margin: 0, color: COLORS.MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif' }}>
            {id ? 'Chỉnh sửa Bài viết' : 'Soạn thảo Bài viết mới'}
          </Title>
        </Space>
        <Button type="primary" size="large" onClick={() => form.submit()} loading={loading} icon={<FloppyDisk size={20} />} style={{ backgroundColor: COLORS.MIDNIGHT_BLUE, fontWeight: 'bold' }}>
          LƯU BÀI VIẾT
        </Button>
      </div>

      <Form form={form} layout="vertical" onFinish={handleSaveArticle} initialValues={{ isPublished: false }}>
        <Row gutter={24}>
          <Col xs={24} lg={16}>
            <Card variant="borderless" style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Form.Item name="title" label={<Text strong>Tiêu đề bài viết</Text>} rules={[{ required: true, message: 'Vui lòng nhập tiêu đề' }]}>
                <Input size="large" placeholder="Nhập tiêu đề thật hấp dẫn..." />
              </Form.Item>
              
              <Form.Item name="summary" label={<Text strong>Tóm tắt (Mô tả ngắn)</Text>}>
                <Input.TextArea rows={3} placeholder="Đoạn văn ngắn xuất hiện dưới tiêu đề..." />
              </Form.Item>

              <div style={{ marginBottom: 24 }}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>Nội dung bài viết (Rich Text)</Text>
                <style>{`.ql-editor { min-height: 400px; font-size: 16px; }`}</style>
                <ReactQuill 
                  theme="snow" 
                  value={content || ""} 
                  onChange={handleContentChange} 
                  modules={quillModules}
                  placeholder="Bắt đầu viết nội dung tại đây..."
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card variant="borderless" style={{ borderRadius: 12, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
              <Form.Item name="isPublished" label={<Text strong>Trạng thái hiển thị</Text>} valuePropName="checked">
                <Switch checkedChildren="Xuất bản ngay" unCheckedChildren="Lưu bản nháp" />
              </Form.Item>

              <Form.Item name="categoryId" label={<Text strong>Thuộc Danh mục</Text>} rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}>
                <Select size="large" placeholder="Chọn danh mục...">
                  {categories.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
                </Select>
              </Form.Item>

              <Divider />
              
              <Text strong style={{ display: 'block', marginBottom: 8 }}>Ảnh bìa (Thumbnail)</Text>
              
              {thumbnailUrl ? (
                <div style={{ border: '1px solid #e8e8e8', borderRadius: 8, padding: 8, background: '#fafafa' }}>
                  <Image src={thumbnailUrl} style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 6 }} />
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Upload customRequest={handleUploadThumbnail} showUploadList={false} accept="image/*" style={{ flex: 1 }}>
                      <Button block type="primary" style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }} icon={<UploadSimple />}>Đổi ảnh</Button>
                    </Upload>
                    <Button danger icon={<Trash />} onClick={() => setThumbnailUrl(null)}>Xóa</Button>
                  </div>
                </div>
              ) : (
                <Upload customRequest={handleUploadThumbnail} showUploadList={false} accept="image/*">
                  <div style={{ border: '2px dashed #d9d9d9', borderRadius: 8, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: '#fafafa', width: '100%' }}>
                    <ImageSquare size={32} color="#bfbfbf" />
                    <div style={{ marginTop: 8 }}><Text type="secondary">Nhấp để tải ảnh lên</Text></div>
                  </div>
                </Upload>
              )}
            </Card>
          </Col>
        </Row>
      </Form>
    </div>
  );
}
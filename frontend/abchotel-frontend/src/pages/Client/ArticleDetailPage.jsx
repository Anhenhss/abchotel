import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Skeleton, Tag, Breadcrumb, Divider, Button, Result, Space } from 'antd';
import { Clock, User, ArrowLeft, CalendarBlank, Tag as TagIcon } from '@phosphor-icons/react';
import { articleApi } from '../../api/articleApi';
import dayjs from 'dayjs';

const { Title, Paragraph, Text } = Typography;

// Theme đồng bộ với trang danh sách của bạn
const LUXURY_THEME = {
    PRIMARY: '#8A1538',
    NAVY: '#0D1821',
    GOLD: '#D4AF37',
    BG: '#F8FAFC'
};

export default function ArticleDetailPage() {
    const { slug } = useParams(); 
    const navigate = useNavigate();
    
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                // Gọi API lấy chi tiết bằng slug từ file articleApi.js bạn đã gửi
                const res = await articleApi.getArticleBySlug(slug);
                setArticle(res);
            } catch (err) {
                console.error("Lỗi lấy chi tiết bài viết:", err);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchDetail();
    }, [slug]);

    if (loading) {
        return (
            <div style={{ maxWidth: 900, margin: '100px auto', padding: '0 20px' }}>
                <Skeleton active title paragraph={{ rows: 12 }} />
            </div>
        );
    }

    if (!article) {
        return (
            <Result
                status="404"
                title="Không tìm thấy bài viết"
                subTitle="Nội dung này có thể đã bị ẩn hoặc không tồn tại."
                extra={<Button type="primary" onClick={() => navigate('/articles')}>Quay lại danh sách</Button>}
            />
        );
    }

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '40px 0' }}>
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 20px' }}>
                
                {/* Điều hướng */}
                <Breadcrumb style={{ marginBottom: 24 }}>
                    <Breadcrumb.Item onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>Trang chủ</Breadcrumb.Item>
                    <Breadcrumb.Item onClick={() => navigate('/articles')} style={{ cursor: 'pointer' }}>Tin tức</Breadcrumb.Item>
                    <Breadcrumb.Item>{article.title}</Breadcrumb.Item>
                </Breadcrumb>

                <Button 
                    type="link" 
                    icon={<ArrowLeft />} 
                    onClick={() => navigate(-1)} 
                    style={{ color: LUXURY_THEME.PRIMARY, padding: 0, marginBottom: 20 }}
                >
                    Quay lại
                </Button>

                {/* Tiêu đề bài viết */}
                <Title level={1} style={{ 
                    fontFamily: "'Playfair Display', serif", 
                    fontSize: '40px', 
                    color: LUXURY_THEME.NAVY,
                    marginBottom: 20 
                }}>
                    {article.title}
                </Title>

                {/* Thông tin metadata */}
                <Space size="large" style={{ marginBottom: 30, color: '#64748B', flexWrap: 'wrap' }}>
                    <Space><User size={18} /> <Text strong>{article.authorName || 'Quản trị viên'}</Text></Space>
                    <Space><CalendarBlank size={18} /> {dayjs(article.publishedAt).format('DD/MM/YYYY')}</Space>
                    <Tag color="volcano" style={{ borderRadius: 4 }}>{article.categoryName}</Tag>
                </Space>

                {/* Ảnh bìa */}
                {article.thumbnailUrl && (
                    <div style={{ marginBottom: 40, borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                        <img 
                            src={article.thumbnailUrl} 
                            alt={article.title} 
                            style={{ width: '100%', display: 'block', maxHeight: '500px', objectFit: 'cover' }} 
                        />
                    </div>
                )}

                {/* Nội dung bài viết (Render từ HTML của Quill) */}
                <div 
                    className="article-detail-content"
                    style={{ 
                        fontSize: '18px', 
                        lineHeight: '1.8', 
                        color: '#334155',
                        textAlign: 'justify'
                    }}
                    dangerouslySetInnerHTML={{ __html: article.content }}
                />

                <Divider style={{ margin: '60px 0' }} />

                {/* Footer bài viết */}
                <div style={{ textAlign: 'center', paddingBottom: '40px' }}>
                    <Text type="secondary">--- Hết bài viết ---</Text>
                </div>
            </div>

            {/* CSS bổ sung để nội dung HTML đẹp hơn */}
            <style>{`
                .article-detail-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 8px;
                    margin: 20px 0;
                }
                .article-detail-content p {
                    margin-bottom: 20px;
                }
                .article-detail-content h2, .article-detail-content h3 {
                    color: ${LUXURY_THEME.NAVY};
                    margin-top: 40px;
                    font-family: 'Playfair Display', serif;
                }
            `}</style>
        </div>
    );
}
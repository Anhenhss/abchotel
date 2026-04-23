import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Skeleton, Tag, Breadcrumb, Divider, Button, Result, Space, Row, Col, Anchor, Card } from 'antd';
import { User, ArrowLeft, CalendarBlank, ListBullets, CaretDown, CaretUp } from '@phosphor-icons/react';
import { articleApi } from '../../api/articleApi';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const LUXURY_THEME = {
    PRIMARY: '#8A1538',
    NAVY: '#0D1821',
    GOLD: '#D4AF37'
};

export default function ArticleDetailPage() {
    const { slug } = useParams(); 
    const navigate = useNavigate();
    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [toc, setToc] = useState([]);
    const [isExpended, setIsExpended] = useState(true);

    useEffect(() => {
        const fetchDetail = async () => {
            try {
                setLoading(true);
                const res = await articleApi.getArticleBySlug(slug);
                if (res) {
                    setArticle(res);
                    if (res.content) {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(res.content, 'text/html');
                        const headings = Array.from(doc.querySelectorAll('h2, h3'));
                        const tocData = headings.map((h, index) => ({
                            key: `heading-${index}`,
                            href: `#heading-${index}`,
                            title: h.innerText,
                        }));
                        setToc(tocData);
                    }
                }
            } catch (err) {
                console.error("Lỗi:", err);
            } finally {
                setLoading(false);
            }
        };
        if (slug) fetchDetail();
    }, [slug]);

    if (loading) return <div style={{ maxWidth: 900, margin: '100px auto', padding: '0 20px' }}><Skeleton active paragraph={{ rows: 15 }} /></div>;
    if (!article) return <Result status="404" title="Không tìm thấy bài viết" extra={<Button onClick={() => navigate('/articles')}>Quay lại</Button>} />;

    // 🔥 XỬ LÝ LỖI KÝ TỰ LỘN XỘN (HTML TAGS)
    const rawDesc = article.summary || article.description || article.shortDescription || "";
    const cleanShortDesc = rawDesc
        .replace(/<[^>]*>/g, '') // Xóa thẻ HTML
        .replace(/&nbsp;/g, ' ') // Xóa ký tự trắng đặc biệt
        .trim();

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '40px 0' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                <Button type="link" icon={<ArrowLeft />} onClick={() => navigate(-1)} style={{ color: LUXURY_THEME.PRIMARY, padding: 0, marginBottom: 20 }}>Quay lại</Button>

                <Row gutter={40}>
                    <Col xs={24} lg={17}>
                        <Title level={1} style={{ fontFamily: "'Playfair Display', serif", color: LUXURY_THEME.NAVY }}>{article.title}</Title>

                        {/* HIỂN THỊ MÔ TẢ ĐÃ LÀM SẠCH */}
                        {cleanShortDesc && (
                            <div style={{ padding: '20px', borderLeft: `4px solid ${LUXURY_THEME.GOLD}`, background: '#f8f9fa', marginBottom: 30, borderRadius: '0 8px 8px 0' }}>
                                <Text style={{ fontSize: '18px', color: '#475569', fontStyle: 'italic', fontFamily: "'Playfair Display', serif" }}>
                                    {cleanShortDesc}
                                </Text>
                            </div>
                        )}

                        <Space size="large" style={{ marginBottom: 30, color: '#64748B' }}>
                            <Space><User size={18} /> <Text strong>{article.authorName || 'Quản trị viên'}</Text></Space>
                            <Space><CalendarBlank size={18} /> {article.publishedAt ? dayjs(article.publishedAt).format('DD/MM/YYYY') : 'N/A'}</Space>
                            <Tag color="volcano">{article.categoryName}</Tag>
                        </Space>

                        {article.thumbnailUrl && (
                            <div style={{ marginBottom: 40, borderRadius: 16, overflow: 'hidden' }}>
                                <img src={article.thumbnailUrl} style={{ width: '100%' }} alt={article.title} />
                            </div>
                        )}

                        <div 
                            className="article-content"
                            dangerouslySetInnerHTML={{ __html: article.content }} 
                            style={{ fontSize: '17px', lineHeight: '1.8' }}
                        />
                    </Col>

                    <Col xs={0} lg={7}>
                        <div style={{ position: 'sticky', top: '100px' }}>
                            <Card title="MỤC LỤC" size="small">
                                {toc.length > 0 ? <Anchor affix={false} items={toc} /> : "Không có mục lục"}
                            </Card>
                        </div>
                    </Col>
                </Row>
            </div>
        </div>
    );
}
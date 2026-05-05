import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Typography, Skeleton, Tag, Button, Result, Space, Row, Col, Anchor, Card, notification, Modal, Divider } from 'antd';
import { User, ArrowLeft, CalendarBlank, ListBullets, BellRinging, BookOpenText } from '@phosphor-icons/react';
import { articleApi } from '../../api/articleApi'; 
import * as signalR from '@microsoft/signalr';
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
    const [relatedArticles, setRelatedArticles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toc, setToc] = useState([]);
    const [isExpended, setIsExpended] = useState(false); 
    const [processedContent, setProcessedContent] = useState('');

    const [mapModalOpen, setMapModalOpen] = useState(false);
    const [currentMapUrl, setCurrentMapUrl] = useState('');

    const handleContentClick = (e) => {
        const trigger = e.target.closest('.hotel-map-trigger');
        if (trigger) {
            e.preventDefault(); 
            const url = trigger.getAttribute('data-map-url');
            if (url) {
                setCurrentMapUrl(url);
                setMapModalOpen(true);
            }
        }
    };

    // Hàm fetch dữ liệu được tách ra và dùng useCallback để tránh re-render thừa
    // Thêm tham số showLoading để kiểm soát việc hiện Skeleton
    const fetchDetail = useCallback(async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            
            const res = await articleApi.getArticleBySlug(slug);
            if (res) {
                setArticle(res);
                
                const allArticlesRes = await articleApi.getArticles(true);
                const dataArray = Array.isArray(allArticlesRes) ? allArticlesRes : [];

                const related = dataArray
                    .filter(item => item.slug && item.slug !== slug)
                    .slice(0, 3);
                
                setRelatedArticles(related);

                if (res.content) {
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(res.content, 'text/html');
                    const headings = Array.from(doc.querySelectorAll('h2, h3'));
                    
                    const tocData = headings.map((h, index) => {
                        const id = `heading-${index}`;
                        h.setAttribute('id', id);
                        return { key: id, href: `#${id}`, title: h.innerText };
                    });
                    
                    setToc(tocData);
                    setProcessedContent(doc.body.innerHTML);
                }
            }
        } catch (err) {
            console.error("Lỗi fetch:", err);
        } finally {
            if (showLoading) setLoading(false);
        }
    }, [slug]);

    // 1. SIGNALR REALTIME - Cập nhật thầm lặng
    useEffect(() => {
        const token = localStorage.getItem('token');
        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:5035/notificationHub", {
                accessTokenFactory: () => token 
            })
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                connection.on("ReceiveNotification", (msg) => {
                    notification.info({
                        message: 'Cập nhật hệ thống',
                        description: msg,
                        icon: <BellRinging color={LUXURY_THEME.GOLD} />,
                        placement: 'bottomRight'
                    });
                    // Gọi fetchDetail với tham số false để cập nhật dữ liệu ngầm, không hiện Skeleton
                    fetchDetail(false);
                });
            })
            .catch(err => console.error("SignalR Error: ", err));

        return () => { connection.stop(); };
    }, [fetchDetail]); // Hook này phụ thuộc vào fetchDetail

    useEffect(() => {
        if (slug) fetchDetail(true); // Lần đầu load trang thì hiện Skeleton
        window.scrollTo(0, 0); 
    }, [slug, fetchDetail]);

    if (loading) return <div style={{ maxWidth: 900, margin: '100px auto', padding: '0 20px' }}><Skeleton active paragraph={{ rows: 15 }} /></div>;
    if (!article) return <Result status="404" title="Không tìm thấy bài viết" extra={<Button onClick={() => navigate('/articles')}>Quay lại</Button>} />;

    const rawDesc = article.shortDescription || "";
    const cleanShortDesc = rawDesc.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '20px 0' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                
                <Button type="link" icon={<ArrowLeft />} onClick={() => navigate('/articles')} style={{ color: LUXURY_THEME.PRIMARY, padding: 0, marginBottom: 15 }}>
                    Quay lại danh sách
                </Button>

                <Row gutter={[40, 30]}>
                    <Col xs={24} lg={17}>
                        <Title level={1} style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(24px, 5vw, 36px)', color: LUXURY_THEME.NAVY }}>
                            {article.title}
                        </Title>

                        {cleanShortDesc && (
                            <div className="short-desc-card">
                                <Text>{cleanShortDesc}</Text>
                            </div>
                        )}

                        <Space size="middle" wrap style={{ marginBottom: 30, color: '#64748B' }}>
                            <Space><User size={18} /> <Text strong>{article.authorName || 'Quản trị viên'}</Text></Space>
                            <Space><CalendarBlank size={18} /> {dayjs(article.publishedAt).format('DD/MM/YYYY')}</Space>
                            <Tag color="volcano">{article.categoryName}</Tag>
                        </Space>

                        {article.thumbnailUrl && (
                            <div style={{ marginBottom: 30, borderRadius: 12, overflow: 'hidden', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
                                <img src={article.thumbnailUrl} style={{ width: '100%', display: 'block' }} alt="thumb" />
                            </div>
                        )}

                        {/* MỤC LỤC MOBILE */}
                        {toc.length > 0 && (
                            <Col xs={24} lg={0} style={{ marginBottom: 30 }}>
                                <Card 
                                    size="small" 
                                    title={<Space><ListBullets /> MỤC LỤC</Space>}
                                    onClick={() => setIsExpended(!isExpended)}
                                    style={{ cursor: 'pointer', border: `1px solid ${LUXURY_THEME.GOLD}44` }}
                                >
                                    {isExpended && (
                                        <div onClick={(e) => e.stopPropagation()}>
                                            <Anchor affix={false} items={toc} targetOffset={80} />
                                        </div>
                                    )}
                                </Card>
                            </Col>
                        )}

                        <div 
                            className="article-detail-content"
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                            onClick={handleContentClick}
                        />

                        {relatedArticles.length > 0 && (
                            <div style={{ marginTop: 60, paddingBottom: 40 }}>
                                <Divider orientation="left" style={{ borderColor: LUXURY_THEME.GOLD }}>
                                    <Space>
                                        <BookOpenText size={24} color={LUXURY_THEME.PRIMARY} />
                                        <Text strong style={{ fontSize: 18, fontFamily: "'Playfair Display', serif" }}>
                                            BÀI VIẾT LIÊN QUAN
                                        </Text>
                                    </Space>
                                </Divider>
                                
                                <Row gutter={[20, 20]}>
                                    {relatedArticles.map(item => (
                                        <Col xs={24} sm={8} key={item.id}>
                                            <Link to={`/article/${item.slug}`}>
                                                <Card
                                                    hoverable
                                                    cover={<img alt={item.title} src={item.thumbnailUrl} style={{ height: 150, objectFit: 'cover' }} />}
                                                    bodyStyle={{ padding: '12px' }}
                                                    style={{ borderRadius: 8, overflow: 'hidden', height: '100%' }}
                                                >
                                                    <Text strong style={{ fontSize: 14, color: LUXURY_THEME.NAVY }} ellipsis={{ rows: 2 }}>
                                                        {item.title}
                                                    </Text>
                                                    <div style={{ marginTop: 8 }}>
                                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                                            {dayjs(item.publishedAt).format('DD/MM/YYYY')}
                                                        </Text>
                                                    </div>
                                                </Card>
                                            </Link>
                                        </Col>
                                    ))}
                                </Row>
                            </div>
                        )}
                    </Col>

                    <Col xs={0} lg={7}>
                        <div style={{ position: 'sticky', top: '100px', zIndex: 10 }}>
                            <Card 
                                size="small"
                                title={<Space><ListBullets size={20} weight="bold" /><Text strong>MỤC LỤC</Text></Space>}
                                styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}}
                                style={{ borderRadius: '12px' }}
                            >
                                {toc.length > 0 ? <Anchor affix={false} targetOffset={100} items={toc} /> : <Text italic>Không có mục lục</Text>}
                            </Card>
                        </div>
                    </Col>
                </Row>
            </div>

            <Modal 
                title="📍 Bản đồ địa điểm" 
                open={mapModalOpen} 
                onCancel={() => setMapModalOpen(false)} 
                footer={null} width={800} centered destroyOnClose
            >
                <div style={{ width: '100%', height: '450px', background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
                    <iframe src={currentMapUrl} width="100%" height="100%" style={{ border: 0 }} allowFullScreen="" loading="lazy"></iframe>
                </div>
            </Modal>

            <style>{`
                .short-desc-card { padding: 20px; border-left: 4px solid ${LUXURY_THEME.GOLD}; background: #f8f9fa; margin-bottom: 30px; font-size: 18px; font-style: italic; font-family: 'Playfair Display', serif; }
                .article-detail-content { font-size: 17px; line-height: 1.8; color: #334155; }
                .article-detail-content h2, .article-detail-content h3 { scroll-margin-top: 110px; color: ${LUXURY_THEME.NAVY}; margin-top: 1.5em; font-family: 'Playfair Display', serif; }
                .ant-anchor-link-title { font-size: 14px !important; white-space: normal !important; }
                .ant-divider-horizontal { border-top-color: ${LUXURY_THEME.GOLD} !important; }
                .ant-anchor-ink { background-color: ${LUXURY_THEME.GOLD} !important; }
            `}</style>
        </div>
    );
}
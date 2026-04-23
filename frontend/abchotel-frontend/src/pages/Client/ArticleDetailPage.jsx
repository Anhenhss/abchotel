import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Skeleton, Tag, Breadcrumb, Button, Result, Space, Row, Col, Anchor, Card, notification } from 'antd';
import { User, ArrowLeft, CalendarBlank, ListBullets, CaretDown, CaretUp, BellRinging } from '@phosphor-icons/react';
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
    const [loading, setLoading] = useState(true);
    const [toc, setToc] = useState([]);
    const [isExpended, setIsExpended] = useState(true);
    const [processedContent, setProcessedContent] = useState('');

    // 1. XỬ LÝ SIGNALR REALTIME
    useEffect(() => {
        const token = localStorage.getItem('token'); // Lấy token để auth với Hub

        const connection = new signalR.HubConnectionBuilder()
            .withUrl("https://localhost:5035/notificationHub", {
                // Backend của bạn yêu cầu access_token qua query cho SignalR
                accessTokenFactory: () => token 
            })
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                console.log("Connected to abchotel SignalR!");
                // Lắng nghe sự kiện từ NotificationHub.cs
                connection.on("ReceiveNotification", (msg) => {
                    notification.info({
                        message: 'Cập nhật mới',
                        description: msg,
                        icon: <BellRinging color={LUXURY_THEME.GOLD} />,
                        placement: 'bottomRight'
                    });
                    fetchDetail(); // Reload lại dữ liệu bài viết
                });
            })
            .catch(err => console.error("SignalR Connection Error: ", err));

        return () => { connection.stop(); };
    }, [slug]);

    // 2. FETCH DỮ LIỆU & XỬ LÝ MỤC LỤC
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
            console.error("Lỗi:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slug) fetchDetail();
    }, [slug]);

    if (loading) return <div style={{ maxWidth: 900, margin: '100px auto', padding: '0 20px' }}><Skeleton active paragraph={{ rows: 15 }} /></div>;
    if (!article) return <Result status="404" title="Không tìm thấy bài viết" extra={<Button onClick={() => navigate('/articles')}>Quay lại</Button>} />;

    // LÀM SẠCH MÔ TẢ NGẮN CỦA ÁNH
    const rawDesc = article.summary || article.description || article.shortDescription || "";
    const cleanShortDesc = rawDesc.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

    return (
        <div style={{ backgroundColor: '#fff', minHeight: '100vh', padding: '20px 0' }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                
                <Button type="link" icon={<ArrowLeft />} onClick={() => navigate(-1)} style={{ color: LUXURY_THEME.PRIMARY, padding: 0, marginBottom: 15 }}>
                    Quay lại
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

                        {/* MỤC LỤC TRÊN MOBILE */}
                        <Col xs={24} lg={0} style={{ marginBottom: 30 }}>
                             <Card 
                                size="small" 
                                title={<Space><ListBullets /> MỤC LỤC (Bấm để xem)</Space>}
                                onClick={() => setIsExpended(!isExpended)}
                                className="mobile-toc-card"
                             >
                                {isExpended && <Anchor affix={false} items={toc} targetOffset={80} />}
                             </Card>
                        </Col>

                        <div 
                            className="article-detail-content"
                            dangerouslySetInnerHTML={{ __html: processedContent }}
                        />
                    </Col>

                    {/* MỤC LỤC CỐ ĐỊNH TRÊN DESKTOP (STICKY) */}
                    <Col xs={0} lg={7}>
                        <div style={{ position: 'sticky', top: '100px', zIndex: 10 }}>
                            <Card 
                                size="small"
                                title={
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Space><ListBullets size={20} weight="bold" /><Text strong>MỤC LỤC</Text></Space>
                                    </div>
                                }
                                styles={{ body: { maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}}
                                style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                            >
                                {toc.length > 0 ? (
                                    <Anchor affix={false} targetOffset={100} items={toc} />
                                ) : (
                                    <Text type="secondary" italic>Không có mục lục</Text>
                                )}
                            </Card>
                        </div>
                    </Col>
                </Row>
            </div>

            <style>{`
                html { scroll-behavior: smooth; }

                /* CHUYỂN TABLE SANG CARD TRÊN MOBILE */
                @media (max-width: 768px) {
                    .article-detail-content table, .article-detail-content tbody, .article-detail-content tr, .article-detail-content td {
                        display: block;
                        width: 100% !important;
                    }
                    .article-detail-content thead { display: none; }
                    .article-detail-content tr {
                        margin-bottom: 15px;
                        border: 1px solid #eee;
                        border-radius: 8px;
                        padding: 10px;
                        background: #fdfdfd;
                    }
                    .article-detail-content td {
                        text-align: right;
                        padding: 8px 5px;
                        border-bottom: 1px dashed #eee;
                        position: relative;
                    }
                    .article-detail-content td::before {
                        content: attr(data-label);
                        float: left;
                        font-weight: bold;
                    }
                }

                .short-desc-card {
                    padding: 20px; border-left: 4px solid ${LUXURY_THEME.GOLD}; 
                    background: #f8f9fa; margin-bottom: 30px; border-radius: 0 8px 8px 0;
                    font-size: 18px; color: #475569; font-style: italic; font-family: 'Playfair Display', serif;
                }

                .article-detail-content { font-size: 17px; line-height: 1.8; color: #334155; }
                .article-detail-content h2, .article-detail-content h3 {
                    scroll-margin-top: 110px;
                    color: ${LUXURY_THEME.NAVY};
                    margin-top: 1.5em;
                }
                .article-detail-content img { max-width: 100% !important; height: auto !important; border-radius: 8px; }

                .ant-anchor-link-title { font-size: 14px !important; white-space: normal !important; }
                .ant-anchor-ink { background-color: ${LUXURY_THEME.GOLD} !important; }
                .ant-anchor-link-active > .ant-anchor-link-title { color: ${LUXURY_THEME.PRIMARY} !important; font-weight: 600; }
                
                .mobile-toc-card { border: 1px solid ${LUXURY_THEME.GOLD}44; border-radius: 8px; }
            `}</style>
        </div>
    );
}
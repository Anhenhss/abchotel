import React, { useState, useEffect, useCallback } from 'react';
import { Typography, Row, Col, Tag, Input, Space, Divider, ConfigProvider, Pagination, Empty, Card } from 'antd';
import { MagnifyingGlass, Clock, Eye, Fire, ArrowRight } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { articleApi } from '../../api/articleApi';
import { categoryApi } from '../../api/categoryApi'; 
import dayjs from 'dayjs';
// Import SignalR
import * as signalR from "@microsoft/signalr";

const { Title, Text, Paragraph } = Typography;

const THEME = {
    NAVY: '#0D1821',
    GOLD: '#D4AF37',
    PRIMARY: '#8A1538',
    BORDER: '#F1F5F9',
    SOFT_GRAY: '#64748B'
};

export default function ArticlePage() {
    const navigate = useNavigate();
    const [articles, setArticles] = useState([]);
    const [categories, setCategories] = useState([]); 
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState(null); 
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // Hàm load dữ liệu có thêm tham số silent để không gây giật trang khi cập nhật realtime
    const loadData = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const [artRes, catRes] = await Promise.all([
                articleApi.getArticles(true),
                categoryApi.getCategories(true)
            ]);
            setArticles(artRes || []);
            setCategories(catRes || []);
        } catch (err) { 
            console.error(err); 
        } finally { 
            if (!silent) setLoading(false); 
        }
    }, []);

    // 1. Thiết lập SignalR lắng nghe NotificationHub có sẵn từ Backend
    useEffect(() => {
        const connection = new signalR.HubConnectionBuilder()
            // URL Hub này phải khớp với cấu hình trong Program.cs của Backend (ví dụ: /notificationHub)
            .withUrl("https://your-api-url/hub/notification") 
            .withAutomaticReconnect()
            .build();

        connection.start()
            .then(() => {
                console.log("SignalR Connected to NotificationHub!");
                
                // Lắng nghe sự kiện ReceiveNotification từ NotificationService.cs
                connection.on("ReceiveNotification", (data) => {
                    // Khi nhận được thông báo bất kỳ, thực hiện cập nhật danh sách thầm lặng
                    // Bạn có thể thêm điều kiện: if(data.title.includes("bài viết")) để lọc chính xác hơn
                    loadData(true); 
                });
            })
            .catch(err => console.error("SignalR Error: ", err));

        return () => {
            if (connection) connection.stop();
        };
    }, [loadData]);

    // Khởi tạo dữ liệu lần đầu
    useEffect(() => {
        loadData();
    }, [loadData]);

    const filtered = articles.filter(a => {
        const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
        const matchesCat = activeCategory ? a.categoryId === activeCategory : true;
        return matchesSearch && matchesCat;
    });

    const topArticle = filtered[0]; 
    const mainList = filtered.slice(1);
    const trending = [...articles].reverse().slice(0, 5); 
    const currentMainList = mainList.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    return (
        <ConfigProvider theme={{ token: { fontFamily: '"Source Serif 4", serif', borderRadius: 2 } }}>
            <div style={{ background: '#fff', minHeight: '100vh' }}>
                
                {/* HERO SECTION */}
                <section className="hero-modern">
                    <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2073" className="hero-img" alt="beach-banner" />
                    <div className="hero-overlay" />
                    <div className="hero-inner">
                        <Title level={1} className="hero-title">CẨM NANG <span style={{ color: THEME.GOLD }}>DU LỊCH</span></Title>
                        <Text className="hero-subtitle">Khám phá hành trình nghỉ dưỡng đẳng cấp tại AbcHotel</Text>
                        <div className="hero-search-box">
                            <Input 
                                prefix={<MagnifyingGlass size={22} weight="bold" color={THEME.NAVY} />}
                                placeholder="Bạn tìm gì hôm nay?..." 
                                onChange={e => setSearch(e.target.value)}
                                className="search-input-modern"
                            />
                        </div>
                    </div>
                </section>

                {/* THANH DANH MỤC */}
                <nav className="category-bar-modern">
                    <div className="category-container">
                        <Space size={40} className="category-list">
                            <span 
                                className={`category-item ${!activeCategory ? 'active' : ''}`}
                                onClick={() => {setActiveCategory(null); setCurrentPage(1);}}
                            >
                                TẤT CẢ
                            </span>
                            {categories.map(cat => (
                                <span 
                                    key={cat.id} 
                                    className={`category-item ${activeCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => {setActiveCategory(cat.id); setCurrentPage(1);}}
                                >
                                    {cat.name.toUpperCase()}
                                </span>
                            ))}
                        </Space>
                    </div>
                </nav>

                <main style={{ maxWidth: 1300, margin: '60px auto', padding: '0 20px' }}>
                    <Row gutter={[40, 40]}>
                        {/* CỘT TRÁI */}
                        <Col xs={24} lg={17}>
                            {topArticle && (
                                <article className="top-post-card" onClick={() => navigate(`/article/${topArticle.slug}`)}>
                                    <div className="top-post-img">
                                        <img src={topArticle.thumbnailUrl || 'https://via.placeholder.com/800x450'} alt="top" />
                                        <div className="top-post-badge">{topArticle.categoryName || 'NỔI BẬT NHẤT'}</div>
                                    </div>
                                    <div className="top-post-content">
                                        <Title level={2} className="title-serif">{topArticle.title}</Title>
                                        <Paragraph className="desc-serif" ellipsis={{ rows: 3 }}>
                                            {topArticle.shortDescription?.replace(/<[^>]*>/g, '')}
                                        </Paragraph>
                                        <div className="btn-read-more">TIẾP TỤC ĐỌC <ArrowRight size={18} /></div>
                                    </div>
                                </article>
                            )}

                            <div style={{ margin: '60px 0 30px' }}>
                                <Title level={3} style={{ fontWeight: 800, borderLeft: `5px solid ${THEME.GOLD}`, paddingLeft: 15 }}>TIN TỨC MỚI</Title>
                            </div>

                            {/* HIỂN THỊ DANH SÁCH - TỰ ĐỘNG CHUYỂN CARD TRÊN MOBILE */}
                            <div className="article-list-container">
                                {currentMainList.length > 0 ? currentMainList.map(art => (
                                    <div key={art.id} className="post-item-wrapper" onClick={() => navigate(`/article/${art.slug}`)}>
                                        {/* Desktop View */}
                                        <div className="post-row-item desktop-view">
                                            <Row gutter={25} align="middle">
                                                <Col span={9}>
                                                    <div className="row-item-img">
                                                        <img src={art.thumbnailUrl || 'https://via.placeholder.com/300x200'} alt="thumb" />
                                                    </div>
                                                </Col>
                                                <Col span={15}>
                                                    <Title level={4} className="row-item-title">{art.title}</Title>
                                                    <Space className="item-meta">
                                                        <Clock size={14} /> {dayjs(art.publishedAt).format('DD/MM/YYYY')}
                                                        <Divider type="vertical" />
                                                        <Eye size={14} /> {Math.floor(Math.random() * 500) + 10} xem
                                                    </Space>
                                                    <Paragraph className="row-item-desc" ellipsis={{ rows: 2 }}>
                                                        {art.shortDescription?.replace(/<[^>]*>/g, '')}
                                                    </Paragraph>
                                                </Col>
                                            </Row>
                                        </div>

                                        {/* Mobile View */}
                                        <Card 
                                            className="mobile-view mobile-article-card"
                                            cover={<img alt="thumb" src={art.thumbnailUrl} style={{ borderRadius: 0 }} />}
                                            bordered={true}
                                        >
                                            <Title level={4} style={{ fontSize: 16 }}>{art.title}</Title>
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                {dayjs(art.publishedAt).format('DD/MM/YYYY')}
                                            </Text>
                                        </Card>
                                    </div>
                                )) : <Empty description="Không có bài viết trong mục này" />}
                            </div>
                            
                            <div style={{ textAlign: 'center', marginTop: 40 }}>
                                <Pagination current={currentPage} total={filtered.length} pageSize={pageSize} onChange={setCurrentPage} />
                            </div>
                        </Col>

                        {/* CỘT PHẢI */}
                        <Col xs={24} lg={7}>
                            <aside style={{ position: 'sticky', top: 100 }}>
                                <div className="sidebar-title-box">
                                    <Fire size={24} weight="fill" color={THEME.PRIMARY} />
                                    <Title level={4} style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>TIN TỨC KHÁC</Title>
                                </div>
                                
                                <div className="trending-container">
                                    {trending.map((t, index) => (
                                        <div key={t.id} className="trending-row" onClick={() => navigate(`/article/${t.slug}`)}>
                                            <div className="trending-num">0{index + 1}</div>
                                            <div className="trending-body">
                                                <Text strong className="trending-link">{t.title}</Text>
                                                <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                                                    {dayjs(t.publishedAt).format('DD/MM/YYYY')}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </aside>
                        </Col>
                    </Row>
                </main>

                <style>{`
                    /* Khóa bo tròn - Giữ nguyên góc vuông */
                    * { border-radius: 0 !important; }

                    .hero-modern { position: relative; height: 480px; display: flex; align-items: center; justify-content: center; text-align: center; overflow: hidden; }
                    .hero-img { position: absolute; width: 100%; height: 100%; object-fit: cover; z-index: 1; }
                    .hero-overlay { position: absolute; inset: 0; background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.6)); z-index: 2; }
                    .hero-inner { position: relative; z-index: 3; max-width: 800px; padding: 0 20px; }
                    .hero-title { color: #fff !important; font-size: clamp(32px, 8vw, 56px) !important; font-weight: 900 !important; margin: 0 !important; }
                    .hero-subtitle { color: #fff; font-size: 18px; opacity: 0.9; letter-spacing: 1px; display: block; margin: 15px 0 35px; }
                    .search-input-modern { height: 55px !important; border: none !important; box-shadow: 0 10px 30px rgba(0,0,0,0.2) !important; }

                    .category-bar-modern { background: #fff; border-bottom: 1px solid ${THEME.BORDER}; position: sticky; top: 0; z-index: 1000; overflow-x: auto; }
                    .category-container { max-width: 1300px; margin: 0 auto; display: flex; justify-content: center; }
                    .category-list { padding: 18px 0; }
                    .category-item { font-weight: 700; font-size: 13px; color: ${THEME.SOFT_GRAY}; letter-spacing: 1.5px; cursor: pointer; transition: 0.3s; position: relative; white-space: nowrap; }
                    .category-item.active { color: ${THEME.GOLD}; }
                    .category-item.active::after { content: ''; position: absolute; bottom: -18px; left: 0; width: 100%; height: 3px; background: ${THEME.GOLD}; }

                    .top-post-card { cursor: pointer; margin-bottom: 40px; padding-bottom: 40px; border-bottom: 1px solid ${THEME.BORDER}; }
                    .top-post-img { position: relative; height: 420px; border: 1px solid ${THEME.BORDER}; }
                    .top-post-img img { width: 100%; height: 100%; object-fit: cover; }
                    .top-post-badge { position: absolute; top: 20px; left: 20px; background: ${THEME.GOLD}; color: #fff; padding: 5px 15px; font-weight: 700; font-size: 11px; }
                    .title-serif { margin-top: 25px !important; font-size: 34px !important; font-weight: 800 !important; }
                    
                    .post-row-item { padding: 25px 0; border-bottom: 1px solid ${THEME.BORDER}; cursor: pointer; transition: 0.3s; }
                    .post-row-item:hover { background: #fdfdfd; }
                    .row-item-img { height: 170px; border: 1px solid ${THEME.BORDER}; }
                    .row-item-img img { width: 100%; height: 100%; object-fit: cover; }
                    
                    .sidebar-title-box { display: flex; align-items: center; gap: 10px; padding-bottom: 15px; border-bottom: 2px solid ${THEME.NAVY}; margin-bottom: 20px; }
                    .trending-row { display: flex; gap: 15px; padding: 15px 0; border-bottom: 1px solid ${THEME.BORDER}; cursor: pointer; }
                    .trending-num { font-size: 22px; font-weight: 900; color: ${THEME.GOLD}; opacity: 0.4; }

                    /* RESPONSIVE CSS */
                    @media (max-width: 768px) {
                        .desktop-view { display: none; }
                        .mobile-view { display: block; }
                        .mobile-article-card { margin-bottom: 20px; }
                        .hero-modern { height: 320px; }
                        .category-container { justify-content: flex-start; padding-left: 20px; }
                    }
                    @media (min-width: 769px) {
                        .desktop-view { display: block; }
                        .mobile-view { display: none; }
                    }
                `}</style>
            </div>
        </ConfigProvider>
    );
}
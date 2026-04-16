import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Tag, Button, Skeleton, Empty, Space, ConfigProvider } from 'antd';
import { Clock, ArrowRight, BookOpen, NavigationArrow } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { articleApi } from '../../api/articleApi';
import { categoryApi } from '../../api/categoryApi';

const { Title, Text, Paragraph } = Typography;

const LUXURY_THEME = {
  PRIMARY: '#8A1538', // Đỏ rượu vang
  GOLD: '#D4AF37',    // Vàng gold
  NAVY: '#0D1821',    // Xanh đen
  BG: '#F8FAFC',      // Nền xám nhạt luxury
  WHITE: '#FFFFFF'
};

export default function ArticlePage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoryApi.getCategories(true);
        setCategories(res || []);
      } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchArticles = async () => {
      setLoading(true);
      try {
        const res = await articleApi.getArticles(true, activeCategory);
        setArticles(res || []);
      } catch (err) {
        console.error("Lỗi lấy bài viết:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchArticles();
  }, [activeCategory]);

  return (
    <div style={{ backgroundColor: LUXURY_THEME.BG, minHeight: '100vh', padding: '60px 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
        
        {/* Header Section */}
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <Title level={1} style={{ 
            color: LUXURY_THEME.NAVY, 
            fontFamily: "'Playfair Display', serif", 
            fontSize: '48px',
            marginBottom: 16 
          }}>
            CẨM NANG <span style={{ color: LUXURY_THEME.PRIMARY }}>DU LỊCH</span>
          </Title>
          <div style={{ width: 80, height: 3, backgroundColor: LUXURY_THEME.GOLD, margin: '0 auto 20px' }} />
          <Text style={{ fontSize: 18, color: '#64748B', maxWidth: 600, display: 'inline-block' }}>
            Khám phá tinh hoa ẩm thực, văn hóa và những địa điểm bí ẩn tại thành phố biển Đà Nẵng
          </Text>
        </div>

        {/* Category Filter */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 50 }}>
          <Space wrap style={{ background: '#FFF', padding: '8px 20px', borderRadius: '50px', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
            <Button 
              type="text"
              onClick={() => setActiveCategory(null)}
              style={{
                borderRadius: '30px',
                fontWeight: 600,
                color: activeCategory === null ? LUXURY_THEME.PRIMARY : '#64748B',
                backgroundColor: activeCategory === null ? '#FDF2F4' : 'transparent'
              }}
            >
              Tất cả
            </Button>
            {categories.map(cat => (
              <Button
                key={cat.id}
                type="text"
                onClick={() => setActiveCategory(cat.id)}
                style={{
                  borderRadius: '30px',
                  fontWeight: 600,
                  color: activeCategory === cat.id ? LUXURY_THEME.PRIMARY : '#64748B',
                  backgroundColor: activeCategory === cat.id ? '#FDF2F4' : 'transparent'
                }}
              >
                {cat.name}
              </Button>
            ))}
          </Space>
        </div>

        {/* Articles Grid */}
        {loading ? (
          <Row gutter={[32, 32]}>
            {[1, 2, 3].map(i => (
              <Col xs={24} md={8} key={i}><Card loading cover={<div style={{ height: 240, background: '#eee' }} />} /></Col>
            ))}
          </Row>
        ) : articles.length > 0 ? (
          <Row gutter={[32, 40]}>
            {articles.map(item => (
              <Col xs={24} sm={12} lg={8} key={item.id}>
                <Card
                  hoverable
                  onClick={() => navigate(`/article/${item.slug}`)}
                  bordered={false}
                  style={{ 
                    borderRadius: 20, 
                    overflow: 'hidden', 
                    boxShadow: '0 15px 35px rgba(0,0,0,0.05)',
                    transition: 'transform 0.3s ease'
                  }}
                  bodyStyle={{ padding: '24px' }}
                  cover={
                    <div style={{ overflow: 'hidden', height: 260, position: 'relative' }}>
                      <img 
                        alt={item.title} 
                        src={item.thumbnailUrl || 'https://images.unsplash.com/photo-1559592490-3f74eda3d797'} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                      <Tag style={{ 
                        position: 'absolute', top: 20, left: 20, 
                        background: 'rgba(138, 21, 56, 0.9)', color: '#FFF', 
                        border: 'none', padding: '4px 12px', borderRadius: '4px',
                        backdropFilter: 'blur(4px)'
                      }}>
                        {item.categoryName}
                      </Tag>
                    </div>
                  }
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Title level={4} style={{ marginBottom: 12, height: 56, overflow: 'hidden', color: LUXURY_THEME.NAVY }}>
                    {item.title}
                  </Title>
                  <Paragraph ellipsis={{ rows: 2 }} type="secondary" style={{ marginBottom: 20 }}>
                    {item.shortDescription}
                  </Paragraph>
                  
                  <div style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    paddingTop: 16, borderTop: '1px solid #F1F5F9' 
                  }}>
                    <Space style={{ color: '#94A3B8', fontSize: '13px' }}>
                      <Clock size={16} />
                      {new Date(item.publishedAt).toLocaleDateString('vi-VN')}
                    </Space>
                    <Button 
                      type="link" 
                      style={{ color: LUXURY_THEME.PRIMARY, padding: 0, display: 'flex', alignItems: 'center', fontWeight: 700 }}
                    >
                      XEM THÊM <ArrowRight weight="bold" style={{ marginLeft: 6 }} />
                    </Button>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="Không tìm thấy bài viết nào trong mục này." style={{ padding: '100px 0' }} />
        )}
      </div>
    </div>
  );
}
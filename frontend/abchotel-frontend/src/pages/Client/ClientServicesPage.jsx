import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Spin, Tag, Empty, Input, Button, Badge } from 'antd';
import { 
    Knife, Waves, Car, FlowerLotus, WifiHigh,
    MagnifyingGlass, CheckCircle, ShoppingCart, 
    PlusCircle, ArrowRight
} from '@phosphor-icons/react';
import { serviceApi } from '../../api/serviceApi';

const { Title, Text } = Typography;

const THEME = {
    NAVY: '#0D1821',
    GOLD: '#D4AF37',
    DARK_RED: '#8A1538',
    SUCCESS: '#22C55E',
    BG: '#F8F9FA',
    WHITE: '#FFFFFF'
};

export default function ClientServicesPage() {
    const [services, setServices] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                const [svcRes, catRes] = await Promise.all([
                    serviceApi.getServices(true),
                    serviceApi.getCategories()
                ]);
                setServices(svcRes || []);
                setCategories(catRes || []);
            } catch (err) { console.error(err); } 
            finally { setLoading(false); }
        };
        loadData();
    }, []);

    const toggleSelect = (service) => {
        const isExist = selectedItems.find(item => item.id === service.id);
        if (isExist) {
            setSelectedItems(selectedItems.filter(item => item.id !== service.id));
        } else {
            setSelectedItems([...selectedItems, service]);
        }
    };

    const getIcon = (catName) => {
        const name = catName?.toLowerCase() || '';
        if (name.includes('ăn')) return <Knife size={24} weight="duotone" />;
        if (name.includes('nước')) return <Waves size={24} weight="duotone" />;
        if (name.includes('xe')) return <Car size={24} weight="duotone" />;
        if (name.includes('spa')) return <FlowerLotus size={24} weight="duotone" />;
        return <WifiHigh size={24} weight="duotone" />;
    };

    if (loading) return <div style={{ height: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Spin size="large" /></div>;

    return (
        <div style={{ backgroundColor: THEME.BG, minHeight: '100vh', paddingBottom: 100 }}>
            {/* Header giữ nguyên chữ Luxury Services */}
            <div style={{ background: THEME.NAVY, padding: '40px 20px', textAlign: 'center' }}>
                <Title level={2} style={{ color: THEME.GOLD, margin: 0, fontFamily: "'Playfair Display', serif" }}>TINH HOA TIỆN NGHI</Title>
                <Text style={{ color: 'rgba(255,255,255,0.5)' }}>"Nâng tầm kỳ nghỉ của quý khách với những đặc quyền duy nhất"</Text>
                
                <div className="search-box-wrapper">
                    <Input 
                        prefix={<MagnifyingGlass size={20} color={THEME.GOLD} />} 
                        placeholder="Tìm dịch vụ bạn cần..." 
                        variant="borderless"
                        onChange={e => setSearchText(e.target.value)}
                    />
                </div>
            </div>

            <div style={{ maxWidth: 1000, margin: '30px auto', padding: '0 20px' }}>
                {categories.map(cat => {
                    const filteredSvc = services.filter(s => s.categoryId === cat.id && s.name.toLowerCase().includes(searchText.toLowerCase()));
                    if (filteredSvc.length === 0) return null;

                    return (
                        <div key={cat.id} style={{ marginBottom: 40 }}>
                            <div className="section-title">
                                <div className="icon-circle">{getIcon(cat.name)}</div>
                                <Title level={4} style={{ margin: 0, color: THEME.NAVY }}>{cat.name.toUpperCase()}</Title>
                            </div>

                            <Row gutter={[16, 16]}>
                                {filteredSvc.map(svc => {
                                    const isSelected = selectedItems.some(item => item.id === svc.id);
                                    return (
                                        <Col xs={24} sm={12} md={8} key={svc.id}>
                                            <div className={`svc-card-compact ${isSelected ? 'active' : ''}`} onClick={() => toggleSelect(svc)}>
                                                <div className="card-main">
                                                    <Text strong className="svc-name">{svc.name}</Text>
                                                    <div className="price-row">
                                                        <Text className="price-val">{svc.price.toLocaleString()}₫</Text>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>/{svc.unit}</Text>
                                                    </div>
                                                </div>
                                                <div className="card-action">
                                                    {isSelected ? <CheckCircle size={24} weight="fill" color={THEME.SUCCESS} /> : <PlusCircle size={24} weight="light" opacity={0.3} />}
                                                </div>
                                            </div>
                                        </Col>
                                    );
                                })}
                            </Row>
                        </div>
                    );
                })}

                {services.length === 0 && <Empty description="Chưa có dịch vụ nào" />}
            </div>

            {/* Giỏ hàng nổi (Floating Cart) - Giữ nguyên chữ ĐẶT NGAY */}
            {selectedItems.length > 0 && (
                <div className="floating-cart-bar">
                    <div className="cart-info">
                        <Badge count={selectedItems.length} color={THEME.DARK_RED}>
                            <div className="cart-icon-bg">
                                <ShoppingCart size={24} weight="bold" color="#fff" />
                            </div>
                        </Badge>
                        <div style={{ marginLeft: 15 }}>
                            <Text strong style={{ color: '#fff', fontSize: 15 }}>Đã chọn {selectedItems.length} dịch vụ</Text>
                        </div>
                    </div>
                    <Button type="primary" className="btn-confirm-booking" icon={<ArrowRight weight="bold" />}>
                        ĐẶT NGAY
                    </Button>
                </div>
            )}

            <style>{`
                .search-box-wrapper {
                    background: #fff;
                    max-width: 500px;
                    margin: 25px auto 0;
                    border-radius: 30px;
                    padding: 8px 20px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                    border-bottom: 2px solid ${THEME.GOLD}33;
                    padding-bottom: 10px;
                }

                .icon-circle {
                    width: 40px;
                    height: 40px;
                    background: ${THEME.NAVY};
                    color: ${THEME.GOLD};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .svc-card-compact {
                    background: #fff;
                    padding: 15px;
                    border-radius: 16px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border: 1px solid #edf2f7;
                }

                .svc-card-compact:hover {
                    transform: translateY(-3px);
                    box-shadow: 0 8px 20px rgba(0,0,0,0.06);
                }

                .svc-card-compact.active {
                    background: #F0FDF4;
                    border-color: ${THEME.SUCCESS};
                }

                .svc-name {
                    display: block;
                    font-size: 15px;
                    margin-bottom: 4px;
                }

                .price-val {
                    color: ${THEME.DARK_RED};
                    font-weight: 700;
                    font-size: 16px;
                }

                .floating-cart-bar {
                    position: fixed;
                    bottom: 30px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 90%;
                    max-width: 450px;
                    background: ${THEME.NAVY};
                    border-radius: 50px;
                    padding: 10px 10px 10px 20px;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    box-shadow: 0 15px 35px rgba(0,0,0,0.3);
                    z-index: 1000;
                }

                .cart-info { display: flex; align-items: center; }
                
                .cart-icon-bg {
                    width: 45px;
                    height: 45px;
                    background: ${THEME.DARK_RED};
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .btn-confirm-booking {
                    height: 45px;
                    border-radius: 25px;
                    background: ${THEME.GOLD} !important;
                    border: none;
                    color: ${THEME.NAVY} !important;
                    font-weight: 800;
                    padding: 0 25px;
                }

                @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&display=swap');
                * { font-family: 'Plus Jakarta Sans', sans-serif; }
            `}</style>
        </div>
    );
}
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Button, Tabs, Card, notification, Spin } from 'antd';
import { ArrowLeft, Info, Archive } from '@phosphor-icons/react';

import { roomApi } from '../../api/roomApi';
import { COLORS } from '../../constants/theme';
import { useSignalR } from '../../hooks/useSignalR';

import TabRoomBasicInfo from './components/TabRoomBasicInfo';
import TabRoomInventory from './components/TabRoomInventory'; 

const { Title, Text } = Typography;

// 🔥 PHẢI CÓ ĐỦ CHỮ 'export default' Ở ĐÂY NHÉ
export default function RoomConfigDetail() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('basic-info');

  const fetchRoomDetail = async () => {
    try {
      setLoading(true);
      const data = await roomApi.getRoom(roomId);
      setRoom(data);
    } catch (error) {
      api.error({ title: 'Lỗi', description: 'Không thể tải thông tin phòng.' });
      navigate('/admin/room-setup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetail();
  }, [roomId]);

  useSignalR(() => {
    fetchRoomDetail();
  });

  const tabItems = [
    {
      key: 'basic-info',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}><Info size={20} />Thông tin Cơ bản</span>,
      children: room ? <TabRoomBasicInfo room={room} onRefresh={fetchRoomDetail} /> : null
    },
    {
      key: 'inventory',
      label: <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16 }}><Archive size={20} />Quản lý Vật tư</span>,
      children: room ? <TabRoomInventory room={room} /> : <div style={{padding: 24, textAlign: 'center'}}>Đang xây dựng...</div> 
    }
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 40 }}>
      {contextHolder}
      
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 24 }}>
        <Button type="text" icon={<ArrowLeft size={24} color={COLORS.MIDNIGHT_BLUE} />} onClick={() => navigate(-1)} style={{ marginRight: 8 }} />
        <div>
          <Title level={3} style={{ margin: '0 0 4px 0', color: COLORS.MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif' }}>
            Cấu hình Phòng: {room?.roomNumber || '...'}
          </Title>
          <Text type="secondary">Quản lý trạng thái vật lý và danh mục đồ dùng trong phòng này.</Text>
        </div>
      </div>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }} styles={{ body: { padding: '16px 24px' } }}>
        <Spin spinning={loading} description="Đang tải dữ liệu phòng...">
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab} 
            items={tabItems} 
            size="large" 
            destroyOnHidden={false} 
          />
        </Spin>
      </Card>
    </div>
  );
}
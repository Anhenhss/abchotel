import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Tabs, Button, Card, Space, Tag, Spin, notification } from 'antd';
import { ArrowLeft, Info, Broom } from '@phosphor-icons/react';

import { roomApi } from '../../api/roomApi';
import { useAuthStore } from '../../store/authStore';
import { useSignalR } from '../../hooks/useSignalR'; 
import { COLORS } from '../../constants/theme';

import TabRoomInfo from './components/TabRoomInfo';
import TabCleaning from './components/TabCleaning';

const { Title, Text } = Typography;

const BUSINESS_LABELS = { Available: 'Trống', Occupied: 'Có khách', Reserved: 'Đặt trước', Maintenance: 'Bảo trì' };
const CLEANING_LABELS = { Clean: 'Sạch sẽ', Dirty: 'Dơ (Chưa dọn)', Cleaning: 'Đang dọn dẹp', Inspected: 'Chờ kiểm tra' };

export default function RoomDetailPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const perms = user?.permissions || [];

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  const canUpdateRoomStatus = perms.includes('UPDATE_ROOM_STATUS'); 
  const canUpdateCleaning = perms.includes('UPDATE_CLEANING_STATUS') || perms.includes('REPORT_DAMAGES'); 

  const fetchRoomInfo = useCallback(async () => {
    if (!id || id === 'undefined') return;
    try {
      const data = await roomApi.getRoom(id);
      setRoom(data);
    } catch (error) { notification.error({ message: 'Lỗi tải phòng' }); } 
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchRoomInfo(); }, [fetchRoomInfo]);
  useSignalR(() => { fetchRoomInfo(); });

  const generateTabs = () => {
    const items = [];
    if (canUpdateRoomStatus) items.push({ key: 'info', label: <Space><Info size={18}/> Trạng thái & Thông tin</Space>, children: <TabRoomInfo room={room} onRefresh={fetchRoomInfo} /> });
    if (canUpdateCleaning) items.push({ key: 'cleaning', label: <Space><Broom size={18}/> Dọn phòng & Kiểm tra</Space>, children: <TabCleaning room={room} roomId={id} onRefreshRoom={fetchRoomInfo} /> });
    return items;
  };

  if (loading) return <div style={{textAlign: 'center', padding: '100px 0'}}><Spin size="large" /></div>;
  if (!room) return <div style={{textAlign: 'center', padding: '50px 0'}}>Không tìm thấy dữ liệu!</div>;

  return (
    <div style={{ paddingBottom: 40, width: '100%', margin: '0 auto' }}>
      {/* CĂN CHỈNH LẠI HEADER CHO MOBILE KHÔNG BỊ TRÀN */}
      <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 24, gap: 12 }}>
        <Button type="text" icon={<ArrowLeft size={24} color={COLORS.MIDNIGHT_BLUE} />} onClick={() => navigate('/admin/rooms')} style={{ padding: '4px 8px' }} />
        <div style={{ flex: 1 }}>
          <Title level={4} style={{ margin: '0 0 8px 0', color: COLORS.MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif' }}>
            Phòng {room.roomNumber} <Text type="secondary" style={{fontSize: 14}}>({room.roomTypeName})</Text>
          </Title>
          <Space wrap style={{ marginTop: 4 }}>
            <Tag color={room.status === 'Occupied' ? COLORS.ACCENT_RED : COLORS.LIGHT} style={{ color: room.status === 'Occupied' ? '#fff' : COLORS.DARKEST, border: 'none', fontWeight: 600 }}>
              {BUSINESS_LABELS[room.status] || room.status}
            </Tag>
            <Tag color={room.cleaningStatus === 'Clean' ? COLORS.LIGHT : COLORS.MUTED} style={{ color: room.cleaningStatus === 'Clean' ? COLORS.DARKEST : '#fff', border: 'none', fontWeight: 600 }}>
              Dọn dẹp: {CLEANING_LABELS[room.cleaningStatus] || room.cleaningStatus}
            </Tag>
          </Space>
        </div>
      </div>

      {/* FIX LỖI ÉP KHUNG TRÊN ĐIỆN THOẠI BẰNG window.innerWidth */}
      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }} styles={{ body: { padding: window.innerWidth > 768 ? '16px 24px' : '16px 8px' } }}>
        <Tabs items={generateTabs()} size={window.innerWidth > 768 ? "large" : "middle"} destroyOnHidden={false} />
      </Card>
    </div>
  );
}
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Typography, Tabs, Button, Card, Space, Tag, Spin, notification } from 'antd';
import { ArrowLeft, Info, Broom, Archive, Gear } from '@phosphor-icons/react'; // 🔥 Thêm icon Gear

import { roomApi } from '../../api/roomApi';
import { useAuthStore } from '../../store/authStore';
import { useSignalR } from '../../hooks/useSignalR'; 
import { COLORS } from '../../constants/theme';

import TabRoomInfo from './components/TabRoomInfo';
import TabCleaning from './components/TabCleaning';
import TabRoomInventory from '../RoomSetup/components/TabRoomInventory';
// 🔥 IMPORT THÊM TAB BASIC INFO
import TabRoomBasicInfo from '../RoomSetup/components/TabRoomBasicInfo';

const { Title, Text } = Typography;

const BUSINESS_LABELS = { Available: 'Trống', Occupied: 'Có khách', Reserved: 'Đặt trước', Maintenance: 'Bảo trì' };
const CLEANING_LABELS = { Clean: 'Sạch sẽ', Dirty: 'Dơ (Chưa dọn)', Cleaning: 'Đang dọn dẹp', Inspected: 'Chờ kiểm tra' };

export default function RoomDetailPage() {
  const { id } = useParams(); 
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const perms = user?.permissions || [];

  const [api, contextHolder] = notification.useNotification();

  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);

  // PHÂN QUYỀN HIỂN THỊ CÁC TAB
  const canUpdateRoomStatus = perms.includes('UPDATE_ROOM_STATUS'); 
  const canUpdateCleaning = perms.includes('UPDATE_CLEANING_STATUS') || perms.includes('REPORT_DAMAGES'); 
  const canManageInventory = perms.includes('MANAGE_INVENTORY') || perms.includes('MANAGE_ROOMS'); 
  // 🔥 KIỂM TRA QUYỀN QUẢN LÝ PHÒNG
  const canManageRooms = perms.includes('MANAGE_ROOMS');

  const fetchRoomInfo = useCallback(async (isRealtime = false) => {
    if (!id || id === 'undefined') return;
    try {
      if (!isRealtime) setLoading(true);
      const data = await roomApi.getRoom(id);
      setRoom(data);
    } catch (error) { 
      if (!isRealtime) {
        api.error({ placement: 'bottomRight', message: 'Lỗi', description: 'Không thể tải dữ liệu phòng' }); 
      }
    } 
    finally { 
      if (!isRealtime) setLoading(false); 
    }
  }, [id]); 

  useEffect(() => { fetchRoomInfo(false); }, [fetchRoomInfo]);
  useSignalR(() => { fetchRoomInfo(true); });

  const generateTabs = () => {
    const items = [];
    
    // Tab 1: Của Lễ tân
    if (canUpdateRoomStatus) items.push({ key: 'info', label: <Space><Info size={18}/> Trạng thái & Thông tin</Space>, children: <TabRoomInfo room={room} onRefresh={() => fetchRoomInfo(false)} /> });
    
    // Tab 2: Của Buồng phòng
    if (canUpdateCleaning) items.push({ key: 'cleaning', label: <Space><Broom size={18}/> Dọn phòng & Báo cáo</Space>, children: <TabCleaning room={room} roomId={id} onRefreshRoom={() => fetchRoomInfo(false)} /> });
    
    // Tab 3: Của Quản lý Kho
    if (canManageInventory) items.push({ key: 'inventory', label: <Space><Archive size={18}/> Quản lý Vật tư</Space>, children: <TabRoomInventory room={room} /> });
    
    // 🔥 Tab 4: Của Quản lý khách sạn (Admin/Manager)
    if (canManageRooms) items.push({ key: 'basic', label: <Space><Gear size={18}/> Cấu hình & Sửa chữa</Space>, children: <TabRoomBasicInfo room={room} onRefresh={() => fetchRoomInfo(false)} /> });

    return items;
  };

  if (loading && !room) return <div style={{textAlign: 'center', padding: '100px 0'}}><Spin size="large" /></div>;
  if (!room && !loading) return <div style={{textAlign: 'center', padding: '50px 0'}}>Không tìm thấy dữ liệu!</div>;

  return (
    <div style={{ paddingBottom: 40, width: '100%', margin: '0 auto' }}>
      {contextHolder}

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

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 20px rgba(0,0,0,0.04)' }} styles={{ body: { padding: window.innerWidth > 768 ? '16px 24px' : '16px 8px' } }}>
        <Tabs items={generateTabs()} size={window.innerWidth > 768 ? "large" : "middle"} destroyOnHidden={false} />
      </Card>
    </div>
  );
}
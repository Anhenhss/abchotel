import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Space, Tag, Select, Table, Avatar, Badge, DatePicker, Button, notification } from 'antd';
import { User, DownloadSimple } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { reportApi } from '../api/reportApi';
import { useSignalR } from '../hooks/useSignalR';

const { Title, Text } = Typography;

const THEME = {
    NAVY_DARK: '#0D1821', 
    DARK_RED: '#8A1538', 
    COLD_BLUE: '#1C2E4A',
    BG_LIGHT: '#F8FAFC'
};

export default function AuditLogsPage() {
  const [api, contextHolder] = notification.useNotification();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  // 1. TỪ ĐIỂN DỊCH ENTITY CHO FRONTEND
  const translateEntity = (entity) => {
      const dict = {
          'LossAndDamage': 'Thất thoát & Đền bù',
          'Rooms': 'Phòng', 'RoomInventory': 'Vật tư phòng',
          'Bookings': 'Đặt phòng', 'Users': 'Nhân sự',
          'Invoices': 'Hóa đơn', 'Equipments': 'Vật tư',
          'Services': 'Dịch vụ', 'Vouchers': 'Khuyến mãi',
          'Articles': 'Bài viết'
      };
      return dict[entity] || entity;
  };

  const fetchLogs = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await reportApi.getAuditLogs({ top: 500 }); 
      const rawData = res?.data?.$values || res?.$values || res || [];

      const parsedData = rawData.map(item => {
          let detailObj = { TotalEvents: 0, Events: [] };
          try {
              if (item.logData) detailObj = JSON.parse(item.logData);
          } catch (error) {
              console.error("Lỗi parse JSON log:", error);
          }
          return { ...item, detail: detailObj };
      });
      setLogs(parsedData);
    } catch (e) { console.error(e); } 
    finally { if (!isSilent) setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);
  useSignalR(() => { fetchLogs(true); });

  const uniqueUsers = [...new Set(logs.map(item => item.performedBy))].filter(Boolean);

  const filteredLogs = logs.filter(log => {
    let matchUser = selectedUser ? log.performedBy === selectedUser : true;
    let matchDate = selectedDate ? dayjs(log.createdAt).isSame(selectedDate, 'day') : true;
    return matchUser && matchDate;
  });

  // =========================================================================
  // 🔥 THUẬT TOÁN 1: TẠO TÓM TẮT THÔNG MINH CHO DÒNG CHA
  // =========================================================================
  const generateSmartSummary = (events, userName) => {
      if (!events || events.length === 0) return "Hoạt động hệ thống.";

      // THUẬT TOÁN NHẬN DIỆN "SAO CHÉP / THÊM HÀNG LOẠT"
      const roomInvEvents = events.filter(e => e.entityType.includes('RoomInventory') || e.entityType.includes('Room_Inventory'));
      
      if (roomInvEvents.length > 5) {
          // Nếu có nhiều hơn 5 sự kiện thêm vật tư vào cùng 1 bảng, ta coi đây là thao tác hàng loạt
          const firstMsg = roomInvEvents[0].message;
          // Tìm số phòng từ message (Dùng regex hoặc cắt chuỗi)
          const roomMatch = firstMsg.match(/phòng\s(\w+)/);
          const roomNum = roomMatch ? roomMatch[1] : "";
          
          return `${userName} đã thêm hàng loạt ${roomInvEvents.length} vật tư vào phòng ${roomNum}.`;
      }

      // Các logic ưu tiên khác (LossAndDamage, Bookings...)
      const priorityEvent = events.find(e => ['LossAndDamage', 'Bookings', 'Rooms'].some(p => e.entityType.includes(p))) || events[0];
      
      const message = priorityEvent.message;
      const extra = events.length - 1;
      
      return extra > 0 ? `${message} (và ${extra} sự kiện khác)` : message;
  };

  // =========================================================================
  // 🔥 THUẬT TOÁN 2: GOM NHÓM SỰ KIỆN SPAM (TRONG BẢNG CON)
  // =========================================================================
  const groupSpammyEvents = (events) => {
    if (!events) return [];
    
    const grouped = {};
    events.forEach(ev => {
        // Gom nhóm dựa trên Loại hành động + Tên bảng + Nội dung message
        const key = `${ev.actionType}_${ev.entityType}_${ev.message}`;
        if (!grouped[key]) {
            grouped[key] = { ...ev, quantity: 0, firstTime: ev.timestamp };
        }
        grouped[key].quantity++;
        // Cập nhật thời gian mới nhất
        grouped[key].timestamp = ev.timestamp; 
    });

    // Sắp xếp lại theo thời gian mới nhất
    return Object.values(grouped).sort((a, b) => dayjs(b.timestamp).diff(dayjs(a.timestamp)));
  };

  const getActionTag = (type) => {
    switch(type?.toUpperCase()) {
        case 'CREATE': case 'ADDED': return <Text strong style={{ color: '#d97706', fontSize: 13 }}>CREATE</Text>;
        case 'UPDATE': case 'MODIFIED': return <Text strong style={{ color: '#2563eb', fontSize: 13 }}>UPDATE</Text>;
        case 'DELETE': case 'DELETED': return <Text strong style={{ color: '#dc2626', fontSize: 13 }}>DELETE</Text>;
        default: return <Text strong style={{ color: '#475569', fontSize: 13 }}>{type}</Text>;
    }
  };

  const columns = [
    { 
        title: <Text strong style={{ color: THEME.COLD_BLUE }}>Ngày</Text>, 
        dataIndex: 'createdAt', width: 150,
        render: (val) => <Text strong>{dayjs(val).format('DD/MM/YYYY')}</Text> 
    },
    { 
        title: <Text strong style={{ color: THEME.COLD_BLUE }}>Nhân viên</Text>, width: 250,
        render: (_, record) => (
            <Space>
                <Avatar size="small" icon={<User />} style={{ backgroundColor: THEME.COLD_BLUE }} />
                <Text strong>{record.performedBy || 'Hệ thống'}</Text>
            </Space>
        )
    },
    { 
        title: <Text strong style={{ color: THEME.COLD_BLUE }}>Tóm tắt hoạt động</Text>, 
        render: (_, record) => (
            <Text style={{ color: THEME.NAVY_DARK }}>
                {generateSmartSummary(record.detail?.Events, record.performedBy || 'Hệ thống')}
            </Text>
        )
    }
  ];

  const expandedRowRender = (record) => {
    // 🔥 Sử dụng dữ liệu đã gộp thay vì dữ liệu gốc
    const groupedData = groupSpammyEvents(record.detail?.Events);

    const nestedColumns = [
      { 
          title: 'Giờ (mới nhất)', dataIndex: 'timestamp', width: 120,
          render: (val) => <Text type="secondary">{dayjs(val).format('HH:mm:ss')}</Text> 
      },
      { 
          title: 'Hành động', dataIndex: 'actionType', width: 120,
          render: (val) => getActionTag(val)
      },
      { 
          title: 'Đối tượng', dataIndex: 'entityType', width: 180,
          render: (val) => <Text>{translateEntity(val)}</Text>
      },
      { 
          title: 'Nội dung', key: 'message',
          render: (_, record) => (
              <Space>
                  <Text style={{ color: THEME.NAVY_DARK }}>{record.message}</Text>
                  {/* Hiển thị số lượng nếu bị lặp (ví dụ: Thêm mới 15 lần) */}
                  {record.quantity > 1 && (
                      <Badge count={`x${record.quantity}`} style={{ backgroundColor: '#52c41a' }} />
                  )}
              </Space>
          )
      },
    ];

    return (
        <div style={{ padding: '8px 24px 24px 24px', backgroundColor: THEME.BG_LIGHT }}>
            <Table 
                columns={nestedColumns} 
                dataSource={groupedData} 
                pagination={false} 
                rowKey={(item) => item.eventId || Math.random().toString()}
                size="small" className="nested-audit-table" scroll={{ x: 700 }}
            />
        </div>
    );
  };

  // ... (Giữ nguyên phần return layout và style của bạn)
  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
        {/* ... */}
        <Table 
            columns={columns} 
            dataSource={filteredLogs} 
            rowKey="id" 
            loading={loading}
            expandable={{ expandedRowRender, expandRowByClick: true }}
            pagination={{ pageSize: 15 }}
            className="main-audit-table"
        />
        {/* ... */}
    </div>
  );
}
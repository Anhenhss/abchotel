import React, { useState, useEffect, useCallback } from 'react';
import { Card, Typography, Space, Tag, Select, Table, Avatar, Badge, DatePicker, Button, notification } from 'antd';
import { User, DownloadSimple } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { reportApi } from '../api/reportApi';

// 🔥 IMPORT SIGNALR ĐỂ REALTIME
import { useSignalR } from '../hooks/useSignalR';

const { Title, Text } = Typography;

// Bảng màu quyền lực
const THEME = {
    NAVY_DARK: '#0D1821', 
    DARK_RED: '#8A1538', 
    COLD_BLUE: '#1C2E4A',
    BG_LIGHT: '#F8FAFC'
};

export default function AuditLogsPage() {
  // 🔥 FIX WARNING: Đổi message thành title ở các hàm gọi api.success / api.error
  const [api, contextHolder] = notification.useNotification();
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  // States cho Bộ lọc
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);

  const fetchLogs = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const res = await reportApi.getAuditLogs({ top: 500 }); 
      
      // 🔥 FIX LỖI $VALUES TỪ .NET TRẢ VỀ
      const rawData = res?.data?.$values || res?.$values || res || [];

      // Bóc tách chuỗi JSON
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
    } catch (e) { 
      console.error(e); 
    } finally { 
      if (!isSilent) setLoading(false); 
    }
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // 🔥 TÍCH HỢP REALTIME SIGNALR: Tự động tải lại data ngầm khi có sự kiện mới
  useSignalR(() => {
    fetchLogs(true); // true = tải ngầm, không hiện spinner xoay xoay gây khó chịu
  });

  // Lấy danh sách Nhân viên duy nhất từ dữ liệu để đưa vào Dropdown lọc
  const uniqueUsers = [...new Set(logs.map(item => item.performedBy))].filter(Boolean);

  // THUẬT TOÁN LỌC DỮ LIỆU
  const filteredLogs = logs.filter(log => {
    let matchUser = true;
    let matchDate = true;

    if (selectedUser) {
        matchUser = log.performedBy === selectedUser;
    }
    if (selectedDate) {
        matchDate = dayjs(log.createdAt).isSame(selectedDate, 'day');
    }

    return matchUser && matchDate;
  });

  // 🔥 THUẬT TOÁN XUẤT FILE EXCEL CHUẨN XÁC 100%
  const handleExport = (type) => {
    const dataToExport = type === 'all' ? logs : filteredLogs;
    
    if (dataToExport.length === 0) {
      api.error({ title: 'Lỗi xuất file', description: 'Không có dữ liệu để xuất.' });
      return;
    }

    // Tạo cấu trúc bảng HTML để Excel tự động chia cột và nhận diện màu sắc
    let tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          th { background-color: #1C2E4A; color: #ffffff; font-weight: bold; border: 1px solid #dddddd; padding: 5px; }
          td { border: 1px solid #dddddd; padding: 5px; }
        </style>
      </head>
      <body>
        <table>
          <thead>
            <tr>
              <th>Ngày</th>
              <th>Giờ</th>
              <th>Nhân viên</th>
              <th>Hành động</th>
              <th>Đối tượng</th>
              <th>Nội dung chi tiết</th>
            </tr>
          </thead>
          <tbody>
    `;

    // Phân rã dữ liệu từ JSON ra từng dòng của bảng
    dataToExport.forEach(log => {
        const dateStr = dayjs(log.createdAt).format('DD/MM/YYYY');
        const user = log.performedBy || 'Hệ thống';
        const events = log.detail?.Events || [];

        events.forEach(ev => {
            const timeStr = dayjs(ev.timestamp).format('HH:mm:ss');
            const action = ev.actionType;
            const entity = translateEntity(ev.entityType);
            const message = ev.message || '';

            tableHtml += `
              <tr>
                <td style="text-align: center;">${dateStr}</td>
                <td style="text-align: center;">${timeStr}</td>
                <td>${user}</td>
                <td style="text-align: center;">${action}</td>
                <td>${entity}</td>
                <td>${message}</td>
              </tr>
            `;
        });
    });

    tableHtml += `</tbody></table></body></html>`;

    // Tạo file Excel (.xls) thay vì CSV
    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `Nhat_Ky_He_Thong_${dayjs().format('DDMMYYYY_HHmm')}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    api.success({
        title: 'Xuất Excel thành công',
        description: `Đã tải xuống file Excel ${type === 'all' ? 'toàn bộ' : 'theo bộ lọc'} cho hệ thống.`
    });
  };

  // Hàm tạo Tag cho Hành động
  const getActionTag = (type) => {
    switch(type?.toUpperCase()) {
        case 'CREATE': case 'ADDED': return <Text strong style={{ color: '#d97706', fontSize: 13 }}>CREATE</Text>;
        case 'UPDATE': case 'MODIFIED': return <Text strong style={{ color: '#2563eb', fontSize: 13 }}>UPDATE</Text>;
        case 'DELETE': case 'DELETED': return <Text strong style={{ color: '#dc2626', fontSize: 13 }}>DELETE</Text>;
        default: return <Text strong style={{ color: '#475569', fontSize: 13 }}>{type}</Text>;
    }
  };

  const translateEntity = (entity) => {
      const dict = {
          'LossAndDamage': 'Thất thoát & Đền bù',
          'Rooms': 'Phòng',
          'Bookings': 'Đặt phòng',
          'Users': 'Nhân sự',
          'Invoices': 'Hóa đơn',
          'Equipments': 'Vật tư',
          'Services': 'Dịch vụ',
          'Vouchers': 'Khuyến mãi',
          'Articles': 'Bài viết'
      };
      return dict[entity] || entity;
  };

  // ================= CỘT CHO BẢNG CHÍNH (GOM NHÓM) =================
  const columns = [
    { 
        title: <Text strong style={{ color: THEME.COLD_BLUE }}>Ngày</Text>, 
        dataIndex: 'createdAt', 
        key: 'date',
        width: 150,
        render: (val) => <Text strong>{dayjs(val).format('DD/MM/YYYY')}</Text> 
    },
    { 
        title: <Text strong style={{ color: THEME.COLD_BLUE }}>Nhân viên</Text>, 
        key: 'user',
        width: 250,
        render: (_, record) => (
            <Space>
                <Avatar size="small" icon={<User />} style={{ backgroundColor: THEME.COLD_BLUE }} />
                <Text strong>{record.performedBy || 'Hệ thống'}</Text>
                {record.logType === 'System' && <Tag color="blue">Hệ thống</Tag>}
            </Space>
        )
    },
    { 
        title: <Text strong style={{ color: THEME.COLD_BLUE }}>Tóm tắt hoạt động</Text>, 
        key: 'summary',
        render: (_, record) => {
            const events = record.detail?.Events || [];
            if (events.length === 0) return <Text type="secondary">Ghi nhận hoạt động hệ thống</Text>;
            
            const firstMessage = events[0].message;
            const extraCount = events.length - 1;
            
            return (
                <Text style={{ color: THEME.NAVY_DARK }}>
                    {firstMessage} {extraCount > 0 && <Text type="secondary" italic>(và {extraCount} sự kiện khác)</Text>}
                </Text>
            );
        }
    }
  ];

  // ================= CỘT CHO BẢNG CHI TIẾT (KHI BẤM XỔ XUỐNG) =================
  const expandedRowRender = (record) => {
    const nestedColumns = [
      { 
          title: 'Giờ', 
          dataIndex: 'timestamp', 
          key: 'time',
          width: 120,
          render: (val) => <Text type="secondary">{dayjs(val).format('HH:mm:ss')}</Text> 
      },
      { 
          title: 'Hành động', 
          dataIndex: 'actionType', 
          key: 'action',
          width: 120,
          render: (val) => getActionTag(val)
      },
      { 
          title: 'Đối tượng', 
          dataIndex: 'entityType', 
          key: 'entity',
          width: 180,
          render: (val) => <Text>{translateEntity(val)}</Text>
      },
      { 
          title: 'Nội dung', 
          dataIndex: 'message', 
          key: 'message',
          render: (val) => <Text style={{ color: THEME.NAVY_DARK }}>{val}</Text>
      },
    ];

    return (
        <div style={{ padding: '8px 24px 24px 24px', backgroundColor: THEME.BG_LIGHT }}>
            <Table 
                columns={nestedColumns} 
                dataSource={record.detail?.Events || []} 
                pagination={false} 
                // 🔥 FIX WARNING: Chỉ sử dụng eventId, bỏ index
                rowKey={(item) => item.eventId || Math.random().toString()}
                size="small"
                className="nested-audit-table"
                scroll={{ x: 700 }} // Cuộn ngang cho bảng nhỏ
            />
        </div>
    );
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-in-out' }}>
      {contextHolder}
      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: 24 }}>
        
        {/* HEADER & LỌC */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
          <Space align="center" size="middle">
            <div style={{ width: 4, height: 24, backgroundColor: THEME.DARK_RED, borderRadius: 2 }}></div>
            <Title level={3} style={{ color: THEME.NAVY_DARK, margin: 0 }}>Nhật ký hoạt động</Title>
          </Space>

          <Space size="middle" wrap>
             <Select 
                placeholder="Lọc theo nhân viên" 
                style={{ width: 180 }} 
                allowClear 
                onChange={(value) => setSelectedUser(value)}
                options={uniqueUsers.map(user => ({ value: user, label: user }))}
             />
             <DatePicker 
                placeholder="Lọc theo ngày" 
                style={{ width: 150 }} 
                format="DD/MM/YYYY"
                allowClear
                onChange={(date) => setSelectedDate(date)}
             />
             
             <Button icon={<DownloadSimple />} onClick={() => handleExport('filter')}>Xuất theo bộ lọc</Button>
             <Button type="primary" style={{ backgroundColor: '#1d4ed8' }} icon={<DownloadSimple />} onClick={() => handleExport('all')}>Xuất toàn bộ (CSV)</Button>
          </Space>
        </div>

        {/* BẢNG DỮ LIỆU ĐÃ ĐƯỢC LỌC */}
        <Table 
            columns={columns} 
            dataSource={filteredLogs} 
            rowKey="id" 
            loading={loading}
            expandable={{ expandedRowRender, expandRowByClick: true }}
            pagination={{ pageSize: 15 }}
            className="main-audit-table"
            scroll={{ x: 'max-content' }} // 🔥 XỬ LÝ LỖI ÉP CHỮ TRÊN MOBILE (Vuốt ngang)
        />

      </Card>

      <style>{`
        /* Style cho bảng chính */
        .main-audit-table .ant-table-thead > tr > th {
            background-color: #f8fafc !important;
            border-bottom: 1px solid #e2e8f0;
        }
        .main-audit-table .ant-table-row { cursor: pointer; }
        
        /* Style cho bảng chi tiết (Nested) */
        .nested-audit-table .ant-table-thead > tr > th {
            background-color: #e2e8f0 !important;
            color: #475569 !important;
            font-weight: 600;
            border-bottom: none;
        }
        .nested-audit-table .ant-table-tbody > tr > td {
            background-color: transparent !important;
            border-bottom: 1px solid #f1f5f9;
        }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
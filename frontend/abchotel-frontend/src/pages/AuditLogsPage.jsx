import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Space, Tag, Modal, Button, Select, Row, Col, Input } from 'antd';
import { ListMagnifyingGlass, Eye, Database, Clock, UserCircle, ArrowsLeftRight } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { reportApi } from '../api/reportApi';

const { Title, Text } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Bộ lọc
  const [tableName, setTableName] = useState(null);
  const [top, setTop] = useState(100); // Mặc định lấy 100 dòng mới nhất

  // Modal xem chi tiết sự thay đổi (Old/New Value)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      // Gửi params { tableName, top } xuống Backend
      const params = { top };
      if (tableName) params.tableName = tableName;

      const res = await reportApi.getAuditLogs(params);
      setLogs(res || []);
    } catch (error) {
      console.error("Lỗi tải lịch sử", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tableName, top]);

  // Hàm làm đẹp chuỗi JSON (Nếu Backend lưu dưới dạng chuỗi JSON)
  const formatJson = (str) => {
    if (!str) return 'Không có dữ liệu / NULL';
    try {
      const obj = JSON.parse(str);
      return JSON.stringify(obj, null, 4); // Thụt lề 4 khoảng trắng cho đẹp
    } catch (e) {
      return str; // Nếu không phải JSON thì in ra chuỗi bình thường
    }
  };

  // Cấu hình màu sắc cho từng loại Hành động
  const getActionTag = (action) => {
    switch (action?.toUpperCase()) {
      case 'CREATE': return <Tag color="success">THÊM MỚI</Tag>;
      case 'UPDATE': return <Tag color="processing">CẬP NHẬT</Tag>;
      case 'DELETE': return <Tag color="error">XÓA</Tag>;
      default: return <Tag>{action}</Tag>;
    }
  };

  const columns = [
    {
      title: 'Thời gian', dataIndex: 'createdAt', key: 'createdAt', width: 160,
      render: (time) => (
        <Space direction="vertical" size={0}>
          <Text strong style={{ color: MIDNIGHT_BLUE }}>{dayjs(time).format('DD/MM/YYYY')}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}><Clock size={12}/> {dayjs(time).format('HH:mm:ss')}</Text>
        </Space>
      )
    },
    {
      title: 'Người thực hiện', dataIndex: 'performedBy', key: 'performedBy', width: 200,
      render: (name) => <Space><UserCircle size={18} color={MIDNIGHT_BLUE} /> <Text strong>{name}</Text></Space>
    },
    {
      title: 'Hành động', dataIndex: 'action', key: 'action', width: 120,
      render: (act) => getActionTag(act)
    },
    {
      title: 'Bảng Dữ Liệu (ID)', key: 'table', width: 200,
      render: (_, record) => (
        <Space>
          <Database size={16} color="#52677D" />
          <Text strong>{record.tableName}</Text>
          <Tag style={{ borderRadius: 12 }}>ID: {record.recordId}</Tag>
        </Space>
      )
    },
    {
      title: 'Chi tiết thay đổi', key: 'details', align: 'center',
      render: (_, record) => (
        <Button 
          type="primary" 
          icon={<Eye size={18} />} 
          style={{ backgroundColor: MIDNIGHT_BLUE, borderRadius: 8 }}
          onClick={() => { setSelectedLog(record); setIsModalOpen(true); }}
        >
          Xem
        </Button>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Lịch sử Hoạt động Hệ thống</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 16 }}>
          <Text style={{ color: '#52677D', fontSize: 15 }}>
            Theo dõi mọi sự thay đổi dữ liệu trong hệ thống.
          </Text>
          
          <Space size="middle">
            <Select 
              placeholder="Lọc theo bảng dữ liệu" 
              allowClear 
              style={{ width: 200 }} 
              size="large"
              onChange={(val) => setTableName(val)}
              options={[
                { value: 'Users', label: 'Bảng Users' },
                { value: 'Roles', label: 'Bảng Roles' },
                { value: 'Shifts', label: 'Bảng Shifts' },
                { value: 'Bookings', label: 'Bảng Bookings' },
                { value: 'Invoices', label: 'Bảng Invoices' },
              ]}
            />
            <Select 
              value={top}
              style={{ width: 150 }} 
              size="large"
              onChange={(val) => setTop(val)}
              options={[
                { value: 50, label: '50 dòng mới nhất' },
                { value: 100, label: '100 dòng mới nhất' },
                { value: 500, label: '500 dòng mới nhất' },
              ]}
            />
            <Button size="large" icon={<ListMagnifyingGlass size={20} />} onClick={fetchLogs}>Làm mới</Button>
          </Space>
        </div>

        <Table 
          columns={columns} 
          dataSource={logs} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 15, showSizeChanger: false }}
          rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
        />
      </Card>

      {/* MODAL SO SÁNH SỰ THAY ĐỔI */}
      <Modal 
        title={<Space><ArrowsLeftRight size={24} color={ACCENT_RED}/><Title level={4} style={{ margin: 0, color: MIDNIGHT_BLUE }}>Chi tiết dữ liệu thay đổi</Title></Space>} 
        open={isModalOpen} 
        onCancel={() => setIsModalOpen(false)} 
        footer={[<Button key="close" type="primary" size="large" onClick={() => setIsModalOpen(false)} style={{ backgroundColor: MIDNIGHT_BLUE }}>Đóng</Button>]}
        width={900}
        centered
      >
        {selectedLog && (
          <div style={{ marginTop: 20 }}>
            <Row gutter={[16, 16]}>
              <Col span={24}>
                <Space size="large">
                  <Tag color="purple" style={{ fontSize: 14, padding: '4px 10px' }}>Bảng: {selectedLog.tableName}</Tag>
                  <Tag color="cyan" style={{ fontSize: 14, padding: '4px 10px' }}>Record ID: {selectedLog.recordId}</Tag>
                  {getActionTag(selectedLog.action)}
                </Space>
              </Col>

              {/* Dữ liệu Cũ (Chỉ hiện nếu là UPDATE hoặc DELETE) */}
              {selectedLog.action !== 'CREATE' && (
                <Col xs={24} md={selectedLog.action === 'UPDATE' ? 12 : 24}>
                  <Text strong style={{ color: '#cf1322', fontSize: 16 }}>Dữ liệu trước khi sửa/xóa:</Text>
                  <Input.TextArea 
                    value={formatJson(selectedLog.oldValue)} 
                    readOnly 
                    rows={12} 
                    style={{ marginTop: 8, backgroundColor: '#fff1f0', color: '#a8071a', fontFamily: 'monospace', fontSize: 13 }} 
                  />
                </Col>
              )}

              {/* Dữ liệu Mới (Chỉ hiện nếu là CREATE hoặc UPDATE) */}
              {selectedLog.action !== 'DELETE' && (
                <Col xs={24} md={selectedLog.action === 'UPDATE' ? 12 : 24}>
                  <Text strong style={{ color: '#389e0d', fontSize: 16 }}>Dữ liệu Mới lưu vào:</Text>
                  <Input.TextArea 
                    value={formatJson(selectedLog.newValue)} 
                    readOnly 
                    rows={12} 
                    style={{ marginTop: 8, backgroundColor: '#f6ffed', color: '#237804', fontFamily: 'monospace', fontSize: 13 }} 
                  />
                </Col>
              )}
            </Row>
          </div>
        )}
      </Modal>

      <style>{`
        .ant-table-thead > tr > th { background-color: #e9f0f8 !important; color: #1C2E4A !important; font-weight: 700 !important; }
        .table-row-light { background-color: #ffffff; }
        .table-row-dark { background-color: #fcfcfc; }
      `}</style>
    </div>
  );
}
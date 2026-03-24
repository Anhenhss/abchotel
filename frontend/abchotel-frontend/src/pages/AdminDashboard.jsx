import React from 'react';
import { Typography, Card } from 'antd';
const { Title, Text } = Typography;

export default function AdminDashboard() {
  return (
    <div>
      <Title level={2} style={{ color: '#1C2E4A', fontFamily: '"Source Serif 4", serif' }}>Tổng quan hệ thống</Title>
      <Text style={{ color: '#52677D' }}>Chào mừng bạn đến với trang quản trị ABC Hotel.</Text>
      <Card style={{ marginTop: 24, borderRadius: 12, height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Text type="secondary">Các biểu đồ thống kê sẽ được hiển thị tại đây</Text>
      </Card>
    </div>
  );
}
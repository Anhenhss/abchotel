import React from 'react';
import { Button, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const { Title } = Typography;

export default function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <div style={{ padding: '50px', textAlign: 'center', backgroundColor: '#e9f0f8', minHeight: '100vh' }}>
      <Title style={{ color: '#1C2E4A', fontFamily: '"Source Serif 4", serif' }}>TRANG CHỦ ABC HOTEL</Title>
      {isAuthenticated ? (
        <div>
          <h2>Xin chào, {user?.fullName} ({user?.roleName})</h2>
          {user?.roleName !== 'Guest' && (
            <Button type="primary" onClick={() => navigate('/admin/dashboard')} style={{ marginRight: 10 }}>
              Vào Trang Quản Trị
            </Button>
          )}
          <Button danger onClick={logout}>Đăng xuất</Button>
        </div>
      ) : (
        <Button type="primary" onClick={() => navigate('/login')} style={{ backgroundColor: '#1C2E4A' }}>
          Đăng nhập / Đăng ký
        </Button>
      )}
    </div>
  );
}
import React, { useState } from 'react';
import { Form, Input, Button, Typography, notification, Row, Col } from 'antd';
import { User, LockKey, Envelope, Phone, ArrowLeft } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

import logo from '../assets/logo.png';

const { Title, Text, Link } = Typography;

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true); 
  const [isForgot, setIsForgot] = useState(false); 
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  // ================= CÁC HÀM XỬ LÝ API =================
  const onFinishLogin = async (values) => {
    try {
      setLoading(true);
      const res = await authApi.login(values);
      localStorage.setItem('accessToken', res.accessToken);
      localStorage.setItem('refreshToken', res.refreshToken);
      const profile = await authApi.getMe();
      setAuth(profile, res.accessToken, res.refreshToken);
      notification.success({ message: 'Đăng nhập thành công!' });
      navigate('/admin/users');
    } catch (error) {
      notification.error({ message: 'Đăng nhập thất bại', description: error.response?.data?.message || 'Có lỗi xảy ra' });
    } finally { setLoading(false); }
  };

  const onFinishRegister = async (values) => {
    try {
      setLoading(true);
      const res = await authApi.register(values);
      notification.success({ message: 'Đăng ký thành công!', description: res.message });
      setIsLogin(true); 
    } catch (error) {
      notification.error({ message: 'Đăng ký thất bại', description: error.response?.data?.message });
    } finally { setLoading(false); }
  };

  const onFinishForgot = async (values) => {
    try {
      setLoading(true);
      const res = await authApi.forgotPassword({ email: values.email });
      notification.success({ message: 'Đã gửi email!', description: res.message });
      setIsForgot(false); 
    } catch (error) {
      notification.error({ message: 'Thất bại', description: error.response?.data?.message });
    } finally { setLoading(false); }
  };

  // ================= CSS STYLES DÙNG CHUNG =================
  const containerStyle = {
    position: 'relative', width: '900px', height: '550px', backgroundColor: '#FFFFFF',
    borderRadius: '24px', boxShadow: '0 15px 35px rgba(28, 46, 74, 0.15)', overflow: 'hidden', display: 'flex'
  };
  
  const formPaneStyle = {
    width: '50%', height: '100%', padding: '0 50px', display: 'flex', flexDirection: 'column', justifyContent: 'center',
    transition: 'all 0.6s ease-in-out', position: 'relative' // Thêm relative để đặt nút Quay lại
  };

  const overlayStyle = {
    position: 'absolute', top: 0, left: 0, width: '50%', height: '100%', backgroundColor: '#1C2E4A',
    zIndex: 10, transition: 'transform 0.6s ease-in-out', transform: `translateX(${isLogin ? '100%' : '0'})`,
    display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', color: '#FFFFFF'
  };

  // Nền trắng hình tròn bao quanh Logo
  const logoWrapperStyle = {
    backgroundColor: '#FFFFFF',
    borderRadius: '50%',
    width: '100px',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
    marginBottom: '20px'
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9f0f8' }}>
      <div style={containerStyle}>
        
        {/* ================= NỬA BÊN TRÁI: FORM ĐĂNG NHẬP / QUÊN MẬT KHẨU ================= */}
        <div style={{ ...formPaneStyle, opacity: isLogin ? 1 : 0, pointerEvents: isLogin ? 'auto' : 'none' }}>
          
          {/* NÚT QUAY LẠI TRANG CHỦ */}
          <div style={{ position: 'absolute', top: 24, left: 32 }}>
            <Link onClick={() => navigate('/')} style={{ color: '#52677D', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
              <ArrowLeft size={18} /> Quay lại trang chủ
            </Link>
          </div>

          {!isForgot ? (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              <Title level={3} style={{ color: '#1C2E4A', textAlign: 'center', marginBottom: 24, fontWeight: 'bold' }}>ĐĂNG NHẬP</Title>
              <Form layout="vertical" onFinish={onFinishLogin} size="large">
                <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email' }, { type: 'email' }]}>
                  <Input prefix={<Envelope color="#BDC4D4" />} placeholder="Email" />
                </Form.Item>
                <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu' }]}>
                  <Input.Password prefix={<LockKey color="#BDC4D4" />} placeholder="Mật khẩu" />
                </Form.Item>
                <div style={{ textAlign: 'right', marginBottom: 24 }}>
                  <Link onClick={() => setIsForgot(true)} style={{ color: '#52677D', fontWeight: 500 }}>Quên mật khẩu?</Link>
                </div>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ backgroundColor: '#1C2E4A', height: 45, borderRadius: 8, fontWeight: 'bold' }}>
                  ĐĂNG NHẬP
                </Button>
              </Form>
            </div>
          ) : (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              <div style={{ cursor: 'pointer', marginBottom: 16 }} onClick={() => setIsForgot(false)}>
                <ArrowLeft size={24} color="#52677D" />
              </div>
              <Title level={3} style={{ color: '#1C2E4A', textAlign: 'center', marginBottom: 8, fontWeight: 'bold' }}>KHÔI PHỤC MẬT KHẨU</Title>
              <Text style={{ display: 'block', textAlign: 'center', marginBottom: 24, color: '#52677D' }}>
                Nhập email đã đăng ký để nhận mật khẩu mới.
              </Text>
              <Form layout="vertical" onFinish={onFinishForgot} size="large">
                <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email' }, { type: 'email' }]}>
                  <Input prefix={<Envelope color="#BDC4D4" />} placeholder="Email của bạn" />
                </Form.Item>
                <Button type="primary" htmlType="submit" loading={loading} block style={{ backgroundColor: '#1C2E4A', height: 45, borderRadius: 8, fontWeight: 'bold' }}>
                  GỬI YÊU CẦU
                </Button>
              </Form>
            </div>
          )}
        </div>

        {/* ================= NỬA BÊN PHẢI: FORM ĐĂNG KÝ ================= */}
        <div style={{ ...formPaneStyle, opacity: !isLogin ? 1 : 0, pointerEvents: !isLogin ? 'auto' : 'none' }}>
          
          {/* NÚT QUAY LẠI TRANG CHỦ CHO FORM ĐĂNG KÝ */}
          <div style={{ position: 'absolute', top: 24, right: 32 }}>
            <Link onClick={() => navigate('/')} style={{ color: '#52677D', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500 }}>
               Quay lại trang chủ <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} /> 
            </Link>
          </div>

          <Title level={3} style={{ color: '#1C2E4A', textAlign: 'center', marginBottom: 24, fontWeight: 'bold' }}>TẠO TÀI KHOẢN</Title>
          <Form layout="vertical" onFinish={onFinishRegister} size="large">
            <Form.Item name="fullName" rules={[{ required: true, message: 'Vui lòng nhập Họ tên' }]} style={{ marginBottom: 16 }}>
              <Input prefix={<User color="#BDC4D4" />} placeholder="Họ và tên" />
            </Form.Item>
            <Form.Item name="email" rules={[{ required: true, message: 'Vui lòng nhập Email' }, { type: 'email' }]} style={{ marginBottom: 16 }}>
              <Input prefix={<Envelope color="#BDC4D4" />} placeholder="Email" />
            </Form.Item>
            <Form.Item name="phone" rules={[{ required: true, message: 'Vui lòng nhập SĐT' }]} style={{ marginBottom: 16 }}>
              <Input prefix={<Phone color="#BDC4D4" />} placeholder="Số điện thoại" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: 'Vui lòng nhập Mật khẩu' }, { min: 6, message: 'Tối thiểu 6 ký tự' }]} style={{ marginBottom: 24 }}>
              <Input.Password prefix={<LockKey color="#BDC4D4" />} placeholder="Mật khẩu" />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block style={{ backgroundColor: '#1C2E4A', height: 45, borderRadius: 8, fontWeight: 'bold' }}>
              ĐĂNG KÝ
            </Button>
          </Form>
        </div>

        {/* ================= TẤM NỀN TRƯỢT (SLIDING OVERLAY) ================= */}
        <div style={overlayStyle}>
          
          {/* Overlay hiển thị khi Đang ở Form Đăng Nhập (Nằm bên PHẢI) */}
          <div style={{ position: 'absolute', width: '100%', padding: '0 40px', transition: 'all 0.5s ease-in-out', transform: `translateX(${isLogin ? '0' : '20%'})`, opacity: isLogin ? 1 : 0, pointerEvents: isLogin ? 'auto' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Bọc Logo bằng vòng tròn trắng */}
            <div style={logoWrapperStyle}>
               <img src={logo} alt="ABC HOTEL Logo" style={{ width: 90, height: 90, objectFit: 'contain' }} />
            </div>
            
            <Title level={2} style={{ color: '#FFFFFF', fontFamily: '"Source Serif 4", serif', margin: 0, letterSpacing: '2px' }}>ABC HOTEL</Title>
            <Text style={{ color: '#D1CFC9', display: 'block', margin: '20px 0', fontSize: 16 }}>
              Tạo tài khoản mới
            </Text>
            <Button ghost size="large" onClick={() => { setIsLogin(false); setIsForgot(false); }} style={{ width: 160, borderRadius: 24, borderColor: '#FFFFFF', color: '#FFFFFF', fontWeight: 'bold' }}>
              ĐĂNG KÝ
            </Button>
          </div>

          {/* Overlay hiển thị khi Đang ở Form Đăng Ký (Nằm bên TRÁI) */}
          <div style={{ position: 'absolute', width: '100%', padding: '0 40px', transition: 'all 0.5s ease-in-out', transform: `translateX(${!isLogin ? '0' : '-20%'})`, opacity: !isLogin ? 1 : 0, pointerEvents: !isLogin ? 'auto' : 'none', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            
            {/* Bọc Logo bằng vòng tròn trắng */}
            <div style={logoWrapperStyle}>
               <img src={logo} alt="ABC HOTEL Logo" style={{ width: 90, height: 90, objectFit: 'contain' }} />
            </div>

            <Title level={2} style={{ color: '#FFFFFF', fontFamily: '"Source Serif 4", serif', margin: 0, letterSpacing: '2px' }}>ABC HOTEL</Title>
            <Text style={{ color: '#D1CFC9', display: 'block', margin: '20px 0', fontSize: 16 }}>
              Đăng nhập hệ thống khách sạn
            </Text>
            <Button ghost size="large" onClick={() => setIsLogin(true)} style={{ width: 160, borderRadius: 24, borderColor: '#FFFFFF', color: '#FFFFFF', fontWeight: 'bold' }}>
              ĐĂNG NHẬP
            </Button>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
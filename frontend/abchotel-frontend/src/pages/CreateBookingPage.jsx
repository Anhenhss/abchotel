import React, { useState } from 'react';
import { Card, Steps, Button, Form, Input, DatePicker, InputNumber, Row, Col, Typography, Space, notification, List, Tag, Divider, Result } from 'antd';
import { MagnifyingGlass, User, CreditCard, Bed, IdentificationCard } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { bookingApi } from '../api/bookingApi';
import { COLORS } from '../constants/theme';

const { Title, Text } = Typography;

export default function CreateBookingPage() {
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Lưu trữ dữ liệu qua các bước
  const [searchForm] = Form.useForm();
  const [guestForm] = Form.useForm();
  
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]); // Giỏ hàng phòng
  const [bookingSuccessData, setBookingSuccessData] = useState(null);

  // ================= BƯỚC 1: TÌM PHÒNG =================
  const handleSearch = async (values) => {
    try {
      setLoading(true);
      const request = {
        checkIn: values.dates[0].format('YYYY-MM-DDTHH:mm:ss'),
        checkOut: values.dates[1].format('YYYY-MM-DDTHH:mm:ss'),
        adults: values.adults,
        children: values.children,
        requestedRooms: 1,
        priceType: 'NIGHTLY'
      };
      const res = await bookingApi.searchRooms(request);
      setAvailableRooms(res || []);
      if (res.length === 0) api.warning({ message: 'Hết phòng', description: 'Không có phòng nào trống trong giai đoạn này.' });
    } catch (error) {
      api.error({ message: 'Lỗi', description: 'Lỗi tìm phòng.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoom = (roomType) => {
    // Cho phép đặt 1 phòng, nếu muốn nhiều hơn thì phát triển thêm mảng quantity
    setSelectedRooms([{
      roomTypeId: roomType.roomTypeId,
      roomTypeName: roomType.roomTypeName,
      quantity: 1,
      price: roomType.subTotal,
      checkInDate: searchForm.getFieldValue('dates')[0].format('YYYY-MM-DDTHH:mm:ss'),
      checkOutDate: searchForm.getFieldValue('dates')[1].format('YYYY-MM-DDTHH:mm:ss'),
      priceType: 'NIGHTLY'
    }]);
    setCurrentStep(1); // Chuyển sang bước nhập thông tin khách
  };

  // ================= BƯỚC 2: TẠO ĐƠN =================
  const handleCreateBooking = async (values) => {
    if (selectedRooms.length === 0) return api.error({ message: 'Lỗi', description: 'Chưa chọn phòng nào.' });

    try {
      setLoading(true);
      const request = {
        guestName: values.guestName,
        guestPhone: values.guestPhone.trim(),
        guestEmail: values.guestEmail,
        identityNumber: values.identityNumber, // Lễ tân gõ CCCD vào đây
        specialRequests: values.specialRequests,
        rooms: selectedRooms
      };
      
      const res = await bookingApi.createBooking(request);
      setBookingSuccessData(res);
      setCurrentStep(2); // Sang bước thành công
    } catch (error) {
        const data = error.response?.data;
        let errorMsg = 'Lỗi khi tạo đơn. Vui lòng thử lại.';
  
        if (data?.errors) {
           // Nếu lỗi do gõ sai định dạng (VD: Số điện thoại sai, thiếu trường)
           const firstError = Object.values(data.errors)[0][0];
           errorMsg = firstError;
        } else if (data?.message) {
           // Nếu lỗi do Database SQL ném ra (VD: Có người vừa giành mất phòng)
           errorMsg = data.message;
        }
  
        api.error({ message: 'Lỗi Dữ liệu', description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = selectedRooms.reduce((sum, r) => sum + r.price, 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 1000, margin: '0 auto' }}>
      {contextHolder}
      <Title level={3} style={{ color: COLORS.MIDNIGHT_BLUE, marginBottom: 24 }}>Lễ tân: Đặt phòng trực tiếp (Walk-in)</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 24 }}>
        <Steps current={currentStep} items={[
          { title: 'Tìm phòng', icon: <MagnifyingGlass size={24} /> },
          { title: 'Khách hàng', icon: <User size={24} /> },
          { title: 'Hoàn tất', icon: <CreditCard size={24} /> },
        ]} />
      </Card>

      {/* ================= GIAO DIỆN BƯỚC 1 ================= */}
      {currentStep === 0 && (
        <Card variant="borderless" style={{ borderRadius: 12 }}>
          <Form form={searchForm} layout="vertical" onFinish={handleSearch} initialValues={{ adults: 2, children: 0 }}>
            <Row gutter={16}>
              <Col xs={24} md={12}>
                <Form.Item name="dates" label="Ngày Nhận - Trả phòng" rules={[{ required: true, message: 'Chọn ngày' }]}>
                  <DatePicker.RangePicker size="large" style={{ width: '100%' }} format="DD/MM/YYYY" />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="adults" label="Người lớn"><InputNumber size="large" min={1} style={{ width: '100%' }} /></Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="children" label="Trẻ em"><InputNumber size="large" min={0} style={{ width: '100%' }} /></Form.Item>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" size="large" icon={<MagnifyingGlass/>} loading={loading} style={{ backgroundColor: COLORS.MIDNIGHT_BLUE, width: '100%' }}>TÌM PHÒNG TRỐNG</Button>
          </Form>

          {availableRooms.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Divider>Kết quả tìm kiếm</Divider>
              <Row gutter={[16, 16]}>
                {availableRooms.map((item, index) => (
                  <Col xs={24} sm={12} md={12} lg={8} key={index}>
                    <Card size="small" hoverable style={{ border: `2px solid ${COLORS.LIGHTEST}` }}>
                      <Title level={5} style={{ color: COLORS.MIDNIGHT_BLUE }}>{item.roomTypeName}</Title>
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text>Trống: <Tag color="green">{item.remainingRooms} phòng</Tag></Text>
                        {item.isUrgent && <Text type="danger" style={{fontSize: 12}}>Sắp hết phòng!</Text>}
                        <Text strong style={{ color: COLORS.ACCENT_RED, fontSize: 18, display: 'block', marginTop: 8 }}>
                          {new Intl.NumberFormat('vi-VN').format(item.subTotal)}đ
                        </Text>
                        <Button type="primary" block onClick={() => handleSelectRoom(item)} style={{ marginTop: 8, backgroundColor: COLORS.MIDNIGHT_BLUE }}>
                          Chọn phòng này
                        </Button>
                      </Space>
                    </Card>
                  </Col>
                ))}
              </Row>
            </div>
          )}
        </Card>
      )}

      {/* ================= GIAO DIỆN BƯỚC 2 ================= */}
      {currentStep === 1 && (
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card title="Thông tin khách nhận phòng" variant="borderless" style={{ borderRadius: 12 }}>
              <Form form={guestForm} layout="vertical" onFinish={handleCreateBooking}>
                <Row gutter={16}>
                  <Col xs={24} md={12}>
                    <Form.Item name="guestName" label="Họ và Tên" rules={[{ required: true }]}>
                      <Input size="large" prefix={<User color={COLORS.MUTED}/>} placeholder="VD: Nguyễn Văn A" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="guestEmail" label="Email">
                      <Input size="large" placeholder="VD: email@domain.com" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="guestPhone" label="Số điện thoại" rules={[{ required: true }]}>
                      <Input size="large" placeholder="09xxxx" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item name="identityNumber" label="Số CCCD / Passport (Bắt buộc theo Luật)">
                      <Input size="large" prefix={<IdentificationCard color={COLORS.MUTED}/>} placeholder="Nhập 12 số CCCD" />
                    </Form.Item>
                  </Col>
                  <Col span={24}>
                    <Form.Item name="specialRequests" label="Ghi chú thêm"><Input.TextArea rows={2} /></Form.Item>
                  </Col>
                </Row>
                
                <Space style={{ marginTop: 16 }}>
                  <Button size="large" onClick={() => setCurrentStep(0)}>Quay lại</Button>
                  <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }}>Xác nhận Đặt phòng</Button>
                </Space>
              </Form>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card title="Tóm tắt đơn" variant="borderless" style={{ borderRadius: 12, backgroundColor: '#f8fafc' }}>
               {selectedRooms.map((r, idx) => (
                 <div key={idx} style={{ marginBottom: 16 }}>
                   <Text strong>{r.roomTypeName}</Text><br/>
                   <Text type="secondary">{dayjs(r.checkInDate).format('DD/MM')} - {dayjs(r.checkOutDate).format('DD/MM')}</Text>
                 </div>
               ))}
               <Divider style={{ margin: '12px 0' }}/>
               <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                 <Text strong>Tổng tiền:</Text>
                 <Text strong style={{ color: COLORS.ACCENT_RED, fontSize: 18 }}>{new Intl.NumberFormat('vi-VN').format(totalAmount)}đ</Text>
               </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* ================= GIAO DIỆN BƯỚC 3 ================= */}
      {currentStep === 2 && (
        <Card variant="borderless" style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
          <Result
            status="success"
            title="Tạo Đơn Đặt Phòng Thành Công!"
            subTitle={`Mã đơn hệ thống: ${bookingSuccessData?.bookingCode}. Hệ thống đã tự động khóa phòng để tránh trùng lặp.`}
            extra={[
              <Button type="primary" key="console" size="large" onClick={() => navigate('/admin/bookings')} style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }}>
                Về danh sách Lễ tân
              </Button>,
              <Button key="buy" size="large" onClick={() => { setCurrentStep(0); searchForm.resetFields(); guestForm.resetFields(); setAvailableRooms([]); }}>
                Tạo thêm đơn khác
              </Button>
            ]}
          />
        </Card>
      )}
    </div>
  );
}
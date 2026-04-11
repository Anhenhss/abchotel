import React, { useState } from 'react';
import { Card, Steps, Button, Form, Input, DatePicker, InputNumber, Row, Col, Typography, Space, notification, Tag, Divider, Result, Select, Radio } from 'antd';
import { MagnifyingGlass, User, CreditCard, IdentificationCard, Door, Clock } from '@phosphor-icons/react';
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

  const [searchForm] = Form.useForm();
  const [guestForm] = Form.useForm();
  
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([]); 
  const [bookingSuccessData, setBookingSuccessData] = useState(null);
  
  const [specificRoomsList, setSpecificRoomsList] = useState([]);

  // ================= BƯỚC 1: TÌM HẠNG PHÒNG (ĐÃ NÂNG CẤP HOURLY/NIGHTLY) =================
  const handleSearch = async (values) => {
    try {
      setLoading(true);
      const request = {
        checkIn: values.dates[0].format('YYYY-MM-DDTHH:mm:ss'),
        checkOut: values.dates[1].format('YYYY-MM-DDTHH:mm:ss'),
        adults: values.adults,
        children: values.children,
        requestedRooms: 1,
        priceType: values.priceType // 🔥 ĐÃ LẤY TỪ FORM THAY VÌ HARDCODE
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

  const handleSelectRoom = async (roomType) => {
    const checkIn = searchForm.getFieldValue('dates')[0].format('YYYY-MM-DDTHH:mm:ss');
    const checkOut = searchForm.getFieldValue('dates')[1].format('YYYY-MM-DDTHH:mm:ss');
    const currentPriceType = searchForm.getFieldValue('priceType'); // 🔥 Lấy loại giá hiện tại
    
    try {
        setLoading(true);
        // Lấy số phòng vật lý trống
        const specificRooms = await bookingApi.getSpecificRooms(roomType.roomTypeId, checkIn, checkOut);
        setSpecificRoomsList(specificRooms);

        setSelectedRooms([{
            roomTypeId: roomType.roomTypeId,
            roomTypeName: roomType.roomTypeName,
            roomId: null, 
            quantity: 1,
            price: roomType.subTotal,
            checkInDate: checkIn,
            checkOutDate: checkOut,
            priceType: currentPriceType // 🔥 Truyền đúng loại giá xuống Giỏ hàng
        }]);
        
        setCurrentStep(1); 
    } catch (error) {
        api.error({ message: 'Lỗi', description: 'Không tải được danh sách phòng vật lý.' });
    } finally {
        setLoading(false);
    }
  };

  // ================= BƯỚC 2: TẠO ĐƠN & CHỌN SỐ PHÒNG =================
  const handleCreateBooking = async (values) => {
    try {
      setLoading(true);
      
      const finalRooms = [...selectedRooms];
      finalRooms[0].roomId = values.selectedRoomId; 

      const request = {
        guestName: values.guestName,
        guestPhone: values.guestPhone.trim(),
        guestEmail: values.guestEmail ? values.guestEmail.trim() : null,
        identityNumber: values.identityNumber ? values.identityNumber.trim() : null,
        specialRequests: values.specialRequests || "",
        rooms: finalRooms 
      };
      
      const res = await bookingApi.createBooking(request);
      setBookingSuccessData(res);
      setCurrentStep(2); 
    } catch (error) {
        const data = error.response?.data;
        let errorMsg = 'Lỗi khi tạo đơn. Vui lòng thử lại.';
        if (data?.errors) errorMsg = Object.values(data.errors)[0][0];
        else if (data?.message) errorMsg = data.message;
        api.error({ message: 'Lỗi Dữ liệu', description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = selectedRooms.reduce((sum, r) => sum + r.price, 0);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 1000, margin: '0 auto' }}>
      {contextHolder}
      <Title level={3} style={{ color: COLORS.MIDNIGHT_BLUE, marginBottom: 24 }}>Lễ tân: Đặt phòng trực tiếp</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', marginBottom: 24 }}>
        <Steps current={currentStep} items={[
          { title: 'Tìm phòng', icon: <MagnifyingGlass size={24} /> },
          { title: 'Khách & Xếp phòng', icon: <User size={24} /> },
          { title: 'Nhận chìa khóa', icon: <CreditCard size={24} /> },
        ]} />
      </Card>

      {currentStep === 0 && (
        <Card variant="borderless" style={{ borderRadius: 12 }}>
          {/* 🔥 FORM ĐÃ ĐƯỢC NÂNG CẤP */}
          <Form form={searchForm} layout="vertical" onFinish={handleSearch} initialValues={{ adults: 2, children: 0, priceType: 'NIGHTLY' }}>
            <Row gutter={16}>
              <Col span={24} style={{ marginBottom: 16 }}>
                 {/* Nút chọn Theo Ngày / Theo Giờ */}
                 <Form.Item name="priceType" noStyle>
                    <Radio.Group optionType="button" buttonStyle="solid" size="large">
                      <Radio.Button value="NIGHTLY"><Door size={18} style={{ verticalAlign: 'middle', marginRight: 8 }}/>Thuê Theo Đêm</Radio.Button>
                      <Radio.Button value="HOURLY"><Clock size={18} style={{ verticalAlign: 'middle', marginRight: 8 }}/>Thuê Theo Giờ</Radio.Button>
                    </Radio.Group>
                 </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="dates" label="Ngày (và Giờ) Nhận - Trả phòng" rules={[{ required: true, message: 'Chọn thời gian' }]}>
                  <DatePicker.RangePicker 
                    size="large" 
                    style={{ width: '100%' }} 
                    format="DD/MM/YYYY HH:mm" 
                    showTime={{ format: 'HH:mm' }} 
                    
                    // 🔥 THÊM ĐÚNG 1 DÒNG NÀY ĐỂ BÔI ĐEN NGÀY QUÁ KHỨ
                    disabledDate={(current) => current && current < dayjs().startOf('day')} 
                  />
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
                        <Text type="secondary">
                            Giá {searchForm.getFieldValue('priceType') === 'HOURLY' ? 'mỗi giờ' : 'mỗi đêm'}: {new Intl.NumberFormat('vi-VN').format(item.pricePerUnit)}đ
                        </Text>
                        <Text strong style={{ color: COLORS.ACCENT_RED, fontSize: 18, display: 'block', marginTop: 8 }}>
                          Tổng: {new Intl.NumberFormat('vi-VN').format(item.subTotal)}đ
                        </Text>
                        <Button type="primary" block onClick={() => handleSelectRoom(item)} style={{ marginTop: 8, backgroundColor: COLORS.MIDNIGHT_BLUE }}>
                          Chọn hạng này
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

      {currentStep === 1 && (
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card title="Khách hàng & Gán phòng cụ thể" variant="borderless" style={{ borderRadius: 12 }}>
              <Form form={guestForm} layout="vertical" onFinish={handleCreateBooking}>
                
                {/* 🔥 GIAO DIỆN CHỌN SỐ PHÒNG CỤ THỂ */}
                <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, marginBottom: 24 }}>
                    <Title level={5} style={{ color: '#166534', marginTop: 0 }}><Door size={20} style={{ verticalAlign: 'middle' }}/> Gán Số Phòng (Check-in)</Title>
                    <Form.Item 
                        name="selectedRoomId" 
                        label="Chọn phòng trống" 
                        rules={[{ required: true, message: 'Bắt buộc chọn 1 phòng cho khách vãng lai' }]}
                    >
                        {/* Map dữ liệu từ API lên Select */}
                        <Select size="large" placeholder="-- Click để chọn phòng --" options={specificRoomsList.map(r => ({ value: r.roomId, label: `Phòng ${r.roomNumber}` }))} />
                    </Form.Item>
                </div>

                <Row gutter={16}>
                  <Col xs={24} md={12}><Form.Item name="guestName" label="Họ và Tên" rules={[{ required: true }]}><Input size="large" placeholder="VD: Nguyễn Văn A" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="guestPhone" label="Số điện thoại" rules={[{ required: true }]}><Input size="large" placeholder="09xxxx" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="guestEmail" label="Email (Tùy chọn)"><Input size="large" placeholder="VD: email@domain.com" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="identityNumber" label="Số CCCD / Passport (Tùy chọn)"><Input size="large" prefix={<IdentificationCard color={COLORS.MUTED}/>} placeholder="Nhập 12 số CCCD" /></Form.Item></Col>
                  <Col span={24}><Form.Item name="specialRequests" label="Ghi chú thêm"><Input.TextArea rows={2} /></Form.Item></Col>
                </Row>
                
                <Space style={{ marginTop: 16 }}>
                  <Button size="large" onClick={() => setCurrentStep(0)}>Quay lại</Button>
                  <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: COLORS.MIDNIGHT_BLUE }}>Tạo Đơn & Check-in</Button>
                </Space>
              </Form>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card title="Tóm tắt đơn" variant="borderless" style={{ borderRadius: 12, backgroundColor: '#f8fafc' }}>
               {selectedRooms.map((r, idx) => (
                 <div key={idx} style={{ marginBottom: 16 }}>
                   <Text strong>{r.roomTypeName}</Text><br/>
                   <Tag color="blue">{r.priceType === 'HOURLY' ? 'Thuê Theo Giờ' : 'Thuê Theo Đêm'}</Tag>
                   <div style={{ marginTop: 8 }}>
                     <Text type="secondary">{dayjs(r.checkInDate).format('DD/MM/YY HH:mm')} - {dayjs(r.checkOutDate).format('DD/MM/YY HH:mm')}</Text>
                   </div>
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

      {currentStep === 2 && (
        <Card variant="borderless" style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0' }}>
          <Result
            status="success"
            title="Nhận Phòng Thành Công!"
            subTitle={`Đơn ${bookingSuccessData?.bookingCode} đã được tạo và Tự động Check-in. Hãy giao chìa khóa cho khách.`}
            extra={[
              <Button type="primary" key="console" size="large" onClick={() => navigate('/admin/rooms')} style={{ backgroundColor: COLORS.SUCCESS }}>
                Xem Sơ Đồ Phòng
              </Button>,
              <Button key="buy" size="large" onClick={() => { setCurrentStep(0); searchForm.resetFields(); guestForm.resetFields(); setAvailableRooms([]); setSpecificRoomsList([]); }}>
                Tạo Đơn Mới
              </Button>
            ]}
          />
        </Card>
      )}
    </div>
  );
}
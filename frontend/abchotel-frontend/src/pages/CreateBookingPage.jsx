import React, { useState } from 'react';
import { Card, Steps, Button, Form, DatePicker, InputNumber, Row, Col, Typography, Space, notification, Tag, Divider, Result, Radio, Input } from 'antd';
import { MagnifyingGlass, User, CreditCard, IdentificationCard, Door, Clock, Bed } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';

import { bookingApi } from '../api/bookingApi';

const { Title, Text } = Typography;

const LUXURY_COLORS = {
    DARKEST: '#0D1821', NAVY: '#344966', MUTED_BLUE: '#7D92AD', 
    LIGHT_BLUE: '#B4CDED', LIGHTEST: '#E9F0F8', WHITE: '#FFFFFF', 
    GOLD: '#D4AF37', ACCENT_RED: '#8A1538', SUCCESS: '#52c41a'
};

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

  // 🔥 THUẬT TOÁN CHẶN GIỜ QUÁ KHỨ TRONG NGÀY HÔM NAY
  const disabledTime = (current) => {
    if (current && current.isSame(dayjs(), 'day')) {
      return {
        disabledHours: () => Array.from({ length: dayjs().hour() }, (_, i) => i),
        disabledMinutes: (selectedHour) => {
          if (selectedHour === dayjs().hour()) {
            return Array.from({ length: dayjs().minute() }, (_, i) => i);
          }
          return [];
        },
      };
    }
    return {};
  };

  const handleSearch = async (values) => {
    const checkInDate = values.dates[0];
    const checkOutDate = values.dates[1];
    
    // Kiểm tra giờ thuê theo giờ có bị quá 24h không
    const hoursDiff = checkOutDate.diff(checkInDate, 'hour');
    if (values.priceType === 'HOURLY' && hoursDiff > 24) {
        return api.warning({ 
            message: 'Sai nghiệp vụ', 
            description: 'Thuê theo giờ chỉ tối đa 24 tiếng. Vui lòng chọn Thuê Theo Đêm.' 
        });
    }

    try {
      setLoading(true);
      const request = {
        checkIn: checkInDate.format('YYYY-MM-DDTHH:mm:ss'),
        checkOut: checkOutDate.format('YYYY-MM-DDTHH:mm:ss'),
        adults: values.adults,
        children: values.children,
        requestedRooms: 1,
        priceType: values.priceType 
      };
      const res = await bookingApi.searchRooms(request);
      setAvailableRooms(res || []);
      if (res.length === 0) api.warning({ message: 'Hết phòng', description: 'Không có phòng nào trống.' });
    } catch (error) { api.error({ message: 'Lỗi', description: 'Lỗi tìm phòng.' }); } 
    finally { setLoading(false); }
  };

  const handleSelectRoom = async (roomType) => {
    const checkIn = searchForm.getFieldValue('dates')[0].format('YYYY-MM-DDTHH:mm:ss');
    const checkOut = searchForm.getFieldValue('dates')[1].format('YYYY-MM-DDTHH:mm:ss');
    const currentPriceType = searchForm.getFieldValue('priceType'); 
    
    try {
        setLoading(true);
        const specificRooms = await bookingApi.getSpecificRooms(roomType.roomTypeId, checkIn, checkOut);
        
        const roomsWithFloor = specificRooms.map(r => ({
            ...r, floor: r.roomNumber.replace(/\D/g, '').charAt(0) 
        }));
        
        setSpecificRoomsList(roomsWithFloor);

        setSelectedRooms([{
            roomTypeId: roomType.roomTypeId, roomTypeName: roomType.roomTypeName,
            roomId: null, quantity: 1, price: roomType.subTotal,
            checkInDate: checkIn, checkOutDate: checkOut,
            priceType: currentPriceType, pricePerUnit: roomType.pricePerUnit
        }]);
        
        guestForm.setFieldsValue({ selectedRoomId: null });
        setCurrentStep(1); 
    } catch (error) { api.error({ message: 'Lỗi', description: 'Không tải được danh sách phòng.' }); } 
    finally { setLoading(false); }
  };

  const handleCreateBooking = async (values) => {
    try {
      setLoading(true);
      const finalRooms = [...selectedRooms];
      finalRooms[0].roomId = values.selectedRoomId; 

      const request = {
        guestName: values.guestName, guestPhone: values.guestPhone.trim(),
        guestEmail: values.guestEmail ? values.guestEmail.trim() : null,
        identityNumber: values.identityNumber ? values.identityNumber.trim() : null,
        specialRequests: values.specialRequests || "", rooms: finalRooms 
      };
      
      const res = await bookingApi.createBooking(request);
      setBookingSuccessData(res);
      setCurrentStep(2); 
    } catch (error) {
        const data = error.response?.data;
        let errorMsg = 'Lỗi tạo đơn. Thử lại.';
        if (data?.errors) errorMsg = Object.values(data.errors)[0][0];
        else if (data?.message) errorMsg = data.message;
        api.error({ message: 'Lỗi Dữ liệu', description: errorMsg });
    } finally { setLoading(false); }
  };

  const totalAmount = selectedRooms.reduce((sum, r) => sum + r.price, 0);

  const groupedRooms = specificRoomsList.reduce((acc, room) => {
      const floorStr = `Tầng ${room.floor || 'Chưa rõ'}`;
      if (!acc[floorStr]) acc[floorStr] = [];
      acc[floorStr].push(room); return acc;
  }, {});

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out', maxWidth: 1000, margin: '0 auto' }}>
      {contextHolder}
      <Title level={3} style={{ color: LUXURY_COLORS.DARKEST, marginBottom: 24, fontWeight: 700 }}>Lễ tân: Đặt phòng trực tiếp</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(13,24,33,0.05)', marginBottom: 24, backgroundColor: LUXURY_COLORS.WHITE }}>
        <Steps current={currentStep} items={[
          { title: 'Tìm phòng', icon: <MagnifyingGlass size={24} /> },
          { title: 'Khách & Xếp phòng', icon: <User size={24} /> },
          { title: 'Nhận chìa khóa', icon: <CreditCard size={24} /> },
        ]} />
      </Card>

      {currentStep === 0 && (
        <Card variant="borderless" style={{ borderRadius: 12, backgroundColor: LUXURY_COLORS.WHITE, boxShadow: '0 4px 12px rgba(13,24,33,0.05)' }}>
          <Form form={searchForm} layout="vertical" onFinish={handleSearch} initialValues={{ adults: 2, children: 0, priceType: 'NIGHTLY' }}>
            <Row gutter={16}>
              <Col span={24} style={{ marginBottom: 16 }}>
                 <Form.Item name="priceType" noStyle>
                    <Radio.Group optionType="button" buttonStyle="solid" size="large" className="luxury-radio-group">
                      <Radio.Button value="NIGHTLY"><Door size={18} style={{ verticalAlign: 'middle', marginRight: 8 }}/>Thuê Theo Đêm</Radio.Button>
                      <Radio.Button value="HOURLY"><Clock size={18} style={{ verticalAlign: 'middle', marginRight: 8 }}/>Thuê Theo Giờ</Radio.Button>
                    </Radio.Group>
                 </Form.Item>
              </Col>

              <Col xs={24} md={12}>
                <Form.Item name="dates" label={<Text strong style={{ color: LUXURY_COLORS.DARKEST }}>Ngày (và Giờ) Nhận - Trả phòng</Text>} rules={[{ required: true, message: 'Chọn thời gian' }]}>
                  <DatePicker.RangePicker 
                    size="large" 
                    style={{ width: '100%', borderColor: LUXURY_COLORS.LIGHT_BLUE }} 
                    format="DD/MM/YYYY HH:mm" 
                    showTime={{ format: 'HH:mm', defaultValue: [dayjs('14:00', 'HH:mm'), dayjs('12:00', 'HH:mm')] }} 
                    disabledDate={(current) => current && current < dayjs().startOf('day')} 
                    disabledTime={disabledTime} // 🔥 GẮN HÀM CHẶN GIỜ VÀO ĐÂY
                  />
                </Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="adults" label={<Text strong style={{ color: LUXURY_COLORS.DARKEST }}>Người lớn</Text>}><InputNumber size="large" min={1} style={{ width: '100%', borderColor: LUXURY_COLORS.LIGHT_BLUE }} /></Form.Item>
              </Col>
              <Col xs={12} md={6}>
                <Form.Item name="children" label={<Text strong style={{ color: LUXURY_COLORS.DARKEST }}>Trẻ em</Text>}><InputNumber size="large" min={0} style={{ width: '100%', borderColor: LUXURY_COLORS.LIGHT_BLUE }} /></Form.Item>
              </Col>
            </Row>
            <Button type="primary" htmlType="submit" size="large" icon={<MagnifyingGlass/>} loading={loading} style={{ backgroundColor: LUXURY_COLORS.NAVY, width: '100%', marginTop: 8 }}>TÌM PHÒNG TRỐNG</Button>
          </Form>

          {availableRooms.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <Divider style={{ borderColor: LUXURY_COLORS.LIGHT_BLUE }}>KẾT QUẢ TÌM KIẾM</Divider>
              <Row gutter={[16, 16]}>
                {availableRooms.map((item, index) => (
                  <Col xs={24} sm={12} md={12} lg={8} key={index}>
                    <Card size="small" hoverable style={{ border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}`, backgroundColor: LUXURY_COLORS.LIGHTEST }}>
                      <Title level={5} style={{ color: LUXURY_COLORS.DARKEST, marginTop: 4 }}>{item.roomTypeName}</Title>
                      <Space direction="vertical" size={2} style={{ width: '100%' }}>
                        <Text>Trống: <Tag color="cyan" style={{ color: LUXURY_COLORS.NAVY, borderColor: LUXURY_COLORS.LIGHT_BLUE, backgroundColor: LUXURY_COLORS.WHITE }}>{item.remainingRooms} phòng</Tag></Text>
                        <Text style={{ color: LUXURY_COLORS.MUTED_BLUE }}>
                            Giá {searchForm.getFieldValue('priceType') === 'HOURLY' ? 'mỗi giờ' : 'mỗi đêm'}: <Text strong style={{ color: LUXURY_COLORS.DARKEST }}>{new Intl.NumberFormat('vi-VN').format(item.pricePerUnit)}đ</Text>
                        </Text>
                        <Text strong style={{ color: LUXURY_COLORS.ACCENT_RED, fontSize: 18, display: 'block', marginTop: 8 }}>
                          Tổng: {new Intl.NumberFormat('vi-VN').format(item.subTotal)}đ
                        </Text>
                        <Button type="primary" block onClick={() => handleSelectRoom(item)} style={{ marginTop: 8, backgroundColor: LUXURY_COLORS.NAVY }}>
                          Chọn hạng phòng này
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
            <Card title={<span style={{ color: LUXURY_COLORS.DARKEST, fontSize: 18 }}>Thông tin Khách & Gán phòng cụ thể</span>} variant="borderless" style={{ borderRadius: 12, backgroundColor: LUXURY_COLORS.WHITE, boxShadow: '0 4px 12px rgba(13,24,33,0.05)' }}>
              <Form form={guestForm} layout="vertical" onFinish={handleCreateBooking}>
                
                <div style={{ padding: '20px', backgroundColor: LUXURY_COLORS.LIGHTEST, border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}`, borderRadius: 8, marginBottom: 24 }}>
                    <Title level={5} style={{ color: LUXURY_COLORS.NAVY, marginTop: 0, marginBottom: 16 }}>
                        <Door size={20} style={{ verticalAlign: 'middle', marginRight: 8 }}/> Chọn Chìa Khóa Phòng Bàn Giao
                    </Title>
                    
                    <Form.Item name="selectedRoomId" rules={[{ required: true, message: 'Vui lòng chọn 1 phòng trên sơ đồ' }]} style={{ marginBottom: 0 }}>
                        <Radio.Group style={{ width: '100%' }}>
                            {Object.entries(groupedRooms).map(([floor, rooms]) => (
                                <div key={floor} style={{ marginBottom: 16 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 8, color: LUXURY_COLORS.MUTED_BLUE, borderBottom: `1px dashed ${LUXURY_COLORS.LIGHT_BLUE}`, paddingBottom: 4 }}>{floor}</Text>
                                    <Row gutter={[12, 12]}>
                                        {rooms.map((room) => (
                                            <Col span={8} sm={6} md={6} lg={4} key={room.roomId}>
                                                <Radio.Button 
                                                    value={room.roomId} 
                                                    style={{ width: '100%', height: 'auto', padding: '12px 0', textAlign: 'center', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}`, boxShadow: '0 2px 4px rgba(13,24,33,0.02)' }}
                                                    className="luxury-room-card"
                                                >
                                                    <Bed size={26} weight="regular" className="bed-icon" />
                                                    <Text strong style={{ fontSize: 16, display: 'block', marginTop: 4 }} className="room-number-text">{room.roomNumber}</Text>
                                                </Radio.Button>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                            ))}
                        </Radio.Group>
                    </Form.Item>
                </div>

                <Row gutter={16}>
                  <Col xs={24} md={12}><Form.Item name="guestName" label={<Text strong style={{color: LUXURY_COLORS.DARKEST}}>Họ và Tên</Text>} rules={[{ required: true }]}><Input size="large" placeholder="VD: Nguyễn Văn A" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="guestPhone" label={<Text strong style={{color: LUXURY_COLORS.DARKEST}}>Số điện thoại</Text>} rules={[{ required: true }]}><Input size="large" placeholder="09xxxx" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="guestEmail" label={<Text strong style={{color: LUXURY_COLORS.MUTED_BLUE}}>Email (Tùy chọn)</Text>}><Input size="large" placeholder="VD: email@domain.com" /></Form.Item></Col>
                  <Col xs={24} md={12}><Form.Item name="identityNumber" label={<Text strong style={{color: LUXURY_COLORS.MUTED_BLUE}}>Số CCCD / Passport (Tùy chọn)</Text>}><Input size="large" prefix={<IdentificationCard color={LUXURY_COLORS.MUTED_BLUE}/>} placeholder="Nhập 12 số CCCD" /></Form.Item></Col>
                  <Col span={24}><Form.Item name="specialRequests" label={<Text strong style={{color: LUXURY_COLORS.MUTED_BLUE}}>Ghi chú thêm</Text>}><Input.TextArea rows={2} /></Form.Item></Col>
                </Row>
                
                <Space style={{ marginTop: 16 }}>
                  <Button size="large" onClick={() => setCurrentStep(0)} style={{ borderColor: LUXURY_COLORS.MUTED_BLUE, color: LUXURY_COLORS.DARKEST }}>Quay lại</Button>
                  <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: LUXURY_COLORS.NAVY }}>Xác nhận Tạo Đơn & Bàn Giao Phòng</Button>
                </Space>
              </Form>
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card title={<span style={{ color: LUXURY_COLORS.DARKEST, fontSize: 18 }}>Tóm tắt đơn</span>} variant="borderless" style={{ borderRadius: 12, backgroundColor: LUXURY_COLORS.LIGHTEST, border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}` }}>
               {selectedRooms.map((r, idx) => (
                 <div key={idx} style={{ marginBottom: 16 }}>
                   <Text strong style={{ color: LUXURY_COLORS.NAVY, fontSize: 16 }}>{r.roomTypeName}</Text><br/>
                   <Tag color={r.priceType === 'HOURLY' ? 'purple' : 'blue'} style={{ marginTop: 6, border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}` }}>
                       {r.priceType === 'HOURLY' ? 'Thuê Theo Giờ' : 'Thuê Theo Đêm'}
                   </Tag>
                   <div style={{ marginTop: 12 }}>
                     <Text style={{ color: LUXURY_COLORS.MUTED_BLUE, display: 'block' }}>Vào: <Text strong style={{ color: LUXURY_COLORS.DARKEST }}>{dayjs(r.checkInDate).format('DD/MM/YY HH:mm')}</Text></Text>
                     <Text style={{ color: LUXURY_COLORS.MUTED_BLUE, display: 'block' }}>Ra: &nbsp;&nbsp;<Text strong style={{ color: LUXURY_COLORS.DARKEST }}>{dayjs(r.checkOutDate).format('DD/MM/YY HH:mm')}</Text></Text>
                   </div>
                 </div>
               ))}
               <Divider style={{ borderColor: LUXURY_COLORS.LIGHT_BLUE }}/>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <Text strong style={{ color: LUXURY_COLORS.MUTED_BLUE }}>Tổng thanh toán:</Text>
                 <Text strong style={{ color: LUXURY_COLORS.ACCENT_RED, fontSize: 22 }}>{new Intl.NumberFormat('vi-VN').format(totalAmount)}đ</Text>
               </div>
            </Card>
          </Col>
        </Row>
      )}

      {currentStep === 2 && (
        <Card variant="borderless" style={{ borderRadius: 12, textAlign: 'center', padding: '40px 0', backgroundColor: LUXURY_COLORS.WHITE, border: `1px solid ${LUXURY_COLORS.LIGHT_BLUE}` }}>
          <Result
            status="success"
            title={<span style={{ color: LUXURY_COLORS.NAVY }}>Nhận Phòng Thành Công!</span>}
            subTitle={`Đơn ${bookingSuccessData?.bookingCode} đã được hệ thống tự động Check-in. Lễ tân vui lòng giao chìa khóa cho khách.`}
            extra={[
              <Button type="primary" key="console" size="large" onClick={() => navigate('/admin/rooms')} style={{ backgroundColor: LUXURY_COLORS.NAVY }}>
                Tới trang Sơ Đồ Phòng
              </Button>,
              <Button key="buy" size="large" onClick={() => { setCurrentStep(0); searchForm.resetFields(); guestForm.resetFields(); setAvailableRooms([]); setSpecificRoomsList([]); }} style={{ borderColor: LUXURY_COLORS.MUTED_BLUE, color: LUXURY_COLORS.DARKEST }}>
                Tạo Đơn Khác
              </Button>
            ]}
          />
        </Card>
      )}

      <style>{`
        .luxury-radio-group .ant-radio-button-wrapper-checked { background-color: ${LUXURY_COLORS.NAVY} !important; border-color: ${LUXURY_COLORS.NAVY} !important; color: #fff !important; }
        .luxury-room-card { transition: all 0.2s ease; background-color: ${LUXURY_COLORS.WHITE} !important; }
        .luxury-room-card:hover { border-color: ${LUXURY_COLORS.NAVY} !important; box-shadow: 0 4px 8px rgba(52, 73, 102, 0.15) !important; }
        .luxury-room-card .bed-icon { fill: ${LUXURY_COLORS.MUTED_BLUE} !important; }
        .luxury-room-card .room-number-text { color: ${LUXURY_COLORS.DARKEST} !important; }
        
        .ant-radio-button-wrapper-checked.luxury-room-card {
            background-color: ${LUXURY_COLORS.NAVY} !important; border-color: ${LUXURY_COLORS.DARKEST} !important; 
            box-shadow: 0 4px 12px rgba(52, 73, 102, 0.3) !important; transform: scale(1.03); z-index: 10;
        }
        .ant-radio-button-wrapper-checked.luxury-room-card .bed-icon { fill: ${LUXURY_COLORS.WHITE} !important; }
        .ant-radio-button-wrapper-checked.luxury-room-card .room-number-text { color: ${LUXURY_COLORS.WHITE} !important; }
        .ant-radio-button-wrapper::before { display: none !important; }
      `}</style>
    </div>
  );
}
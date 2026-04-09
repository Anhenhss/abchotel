import React, { useState, useEffect } from 'react';
import { Card, Typography, Space, Tag, Select, Row, Col, Grid, List, Avatar } from 'antd';
import { Database, Clock, UserCircle, Plus, PencilSimple, Trash } from '@phosphor-icons/react';
import dayjs from 'dayjs';
import { reportApi } from '../api/reportApi';
import { COLORS } from '../constants/theme';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

export default function AuditLogsPage() {
  const screens = useBreakpoint();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableName, setTableName] = useState(null);
  const [top, setTop] = useState(100);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params = { top };
      if (tableName) params.tableName = tableName;

      const res = await reportApi.getAuditLogs(params);
      
      // Lọc bỏ bảng Notifications để tránh rác màn hình
      const filteredLogs = res.filter(log => log.tableName !== 'Notifications');
      setLogs(filteredLogs || []);
    } catch (error) {
      console.error("Lỗi tải lịch sử", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [tableName, top]);

  // 🔥 BỘ NÃO CỦA TRANG: THUẬT TOÁN "DỊCH" JSON THÀNH TIẾNG VIỆT (ĐÃ NÂNG CẤP)
  const generateHumanReadableLog = (record) => {
    let newObj = {};
    let oldObj = {};
    try {
      if (record.newValue) newObj = JSON.parse(record.newValue);
      if (record.oldValue) oldObj = JSON.parse(record.oldValue);
    } catch (e) {}

    // Đồng bộ hóa các từ khóa của Entity Framework Core (ADDED, MODIFIED, DELETED)
    const rawAction = record.action?.toUpperCase() || '';
    let action = rawAction;
    if (rawAction === 'MODIFIED') action = 'UPDATE';
    if (rawAction === 'ADDED') action = 'CREATE';
    if (rawAction === 'DELETED') action = 'DELETE';

    const table = record.tableName;
    const id = record.recordId;

    // 1. Phân tích log của bảng Phòng
    if (table === 'Rooms') {
      if (action === 'UPDATE') {
        if (newObj.status || newObj.Status) return <span>Đã chuyển trạng thái kinh doanh của phòng (Mã: {id}) thành: <Tag color="blue" style={{margin:0}}>{newObj.status || newObj.Status}</Tag></span>;
        if (newObj.cleaningStatus || newObj.CleaningStatus) return <span>Đã chuyển trạng thái dọn phòng (Mã: {id}) thành: <Tag color="orange" style={{margin:0}}>{newObj.cleaningStatus || newObj.CleaningStatus}</Tag></span>;
      }
    }

    // 2. Phân tích log của bảng Người dùng
    if (table === 'Users') {
      if (action === 'UPDATE') {
        if (newObj.RoleId !== undefined || newObj.role_id !== undefined) return <span>Đã thay đổi <b>Chức vụ / Phân quyền</b> của nhân viên (Mã: {id}).</span>;
        if (newObj.Status !== undefined || newObj.status !== undefined) return <span>Đã <b>{newObj.Status || newObj.status ? 'mở khóa' : 'khóa'}</b> tài khoản người dùng (Mã: {id}).</span>;
      }
    }

    // 3. Phân tích log của bảng Hạng phòng
    if (table === 'Room_Types') {
      if (action === 'UPDATE' && (newObj.basePrice || newObj.price)) {
        return <span>Đã cập nhật <b>Giá qua đêm</b> của Hạng phòng (Mã: {id}) thành: <Text strong style={{color: COLORS.ACCENT_RED}}>{new Intl.NumberFormat('vi-VN').format(newObj.basePrice || newObj.price)}đ</Text></span>;
      }
      if (action === 'UPDATE' && newObj.pricePerHour) {
        return <span>Đã cập nhật <b>Giá theo giờ</b> của Hạng phòng (Mã: {id}) thành: <Text strong style={{color: COLORS.ACCENT_RED}}>{new Intl.NumberFormat('vi-VN').format(newObj.pricePerHour)}đ</Text></span>;
      }
    }

    // 4. Phân tích log của bảng Đặt phòng (Bookings)
    if (table === 'Bookings') {
      if (action === 'UPDATE' && (newObj.status || newObj.Status)) {
        return <span>Đã cập nhật đơn đặt phòng (Mã: {id}) sang trạng thái: <Tag color="green" style={{margin:0}}>{newObj.status || newObj.Status}</Tag></span>;
      }
    }

    // 5. Nếu không thuộc case đặc biệt, tự động so sánh JSON để tìm ra cột bị đổi
    let changedFields = "";
    if (action === 'UPDATE' && Object.keys(newObj).length > 0) {
      const diffs = [];
      Object.keys(newObj).forEach(key => {
        // So sánh giá trị cũ và mới, nếu khác nhau thì đưa vào mảng diffs
        if (oldObj[key] !== newObj[key]) {
          diffs.push(key);
        }
      });
      if (diffs.length > 0) {
        changedFields = ` (Đổi thông tin: ${diffs.join(', ')})`;
      } else {
        changedFields = ` (Đã cập nhật: ${Object.keys(newObj).join(', ')})`;
      }
    }

    // 6. Tên bảng chuẩn Tiếng Việt
    const tableVn = 
      table === 'Invoices' ? 'Hóa đơn' :
      table === 'Services' ? 'Dịch vụ' :
      table === 'Roles' ? 'Vai trò nhân sự' :
      table === 'Role_Permissions' ? 'Phân quyền hệ thống' :
      table === 'Articles' ? 'Bài viết / Tin tức' :
      table === 'Attractions' ? 'Điểm du lịch' :
      table === 'Vouchers' ? 'Mã khuyến mãi' :
      table === 'Equipments' ? 'Kho Vật tư' :
      table === 'Loss_And_Damages' ? 'Biên bản Hư hỏng/Mất mát' :
      table === 'Users' ? 'Tài khoản nhân sự' :
      table === 'Rooms' ? 'Danh sách Phòng' :
      table === 'Bookings' ? 'Đơn đặt phòng' : table;

    switch (action) {
      case 'CREATE': return <span>Đã tạo mới hồ sơ <b>{tableVn}</b> (Mã ID: {id}).</span>;
      case 'UPDATE': return <span>Đã cập nhật hồ sơ <b>{tableVn}</b> (Mã ID: {id}) <Text type="secondary">{changedFields}</Text>.</span>;
      case 'DELETE': return <span>Đã xóa dữ liệu khỏi <b>{tableVn}</b> (Mã ID: {id}).</span>;
      default: return <span>Đã thao tác trên <b>{tableVn}</b> (Mã ID: {id}).</span>;
    }
  };

  const getActionIcon = (actionStr) => {
    const action = actionStr?.toUpperCase() || '';
    if (action === 'CREATE' || action === 'ADDED') return <Avatar style={{ backgroundColor: '#f6ffed', color: '#52c41a' }} icon={<Plus weight="bold" />} />;
    if (action === 'UPDATE' || action === 'MODIFIED') return <Avatar style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }} icon={<PencilSimple weight="bold" />} />;
    if (action === 'DELETE' || action === 'DELETED') return <Avatar style={{ backgroundColor: '#fff1f0', color: '#f5222d' }} icon={<Trash weight="bold" />} />;
    return <Avatar style={{ backgroundColor: '#f0f0f0', color: '#595959' }} icon={<Database weight="bold" />} />;
  };

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <Title level={3} style={{ color: COLORS.MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Nhật ký Hoạt động Hệ thống (Audit Logs)</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }} bodyStyle={{ padding: screens.xs ? 12 : 24 }}>
        <div style={{ display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: screens.xs ? 'stretch' : 'center', marginBottom: 20, gap: 16 }}>
          <Text style={{ color: '#52677D', fontSize: 15 }}>
            Theo dõi tự động mọi thao tác thêm, sửa, xóa dữ liệu của nhân viên trên hệ thống cơ sở dữ liệu.
          </Text>
          
          <Space direction={screens.xs ? 'vertical' : 'horizontal'} size={screens.xs ? 'small' : 'middle'} style={{ width: screens.xs ? '100%' : 'auto' }}>
            <Select 
              placeholder="Lọc theo phân hệ" 
              allowClear 
              style={{ width: screens.xs ? '100%' : 200 }} 
              size="large"
              onChange={(val) => setTableName(val)}
              options={[
                { value: 'Users', label: 'Quản lý Nhân sự' },
                { value: 'Rooms', label: 'Quản lý Phòng' },
                { value: 'Bookings', label: 'Quản lý Đặt phòng' },
                { value: 'Invoices', label: 'Quản lý Hóa đơn' },
                { value: 'Equipments', label: 'Quản lý Kho vật tư' },
                { value: 'Role_Permissions', label: 'Phân quyền hệ thống' },
              ]}
            />
            <Select 
              value={top}
              style={{ width: screens.xs ? '100%' : 150 }} 
              size="large"
              onChange={(val) => setTop(val)}
              options={[
                { value: 50, label: '50 dòng mới nhất' },
                { value: 100, label: '100 dòng mới nhất' },
                { value: 500, label: '500 dòng mới nhất' },
              ]}
            />
          </Space>
        </div>

        {/* HIỂN THỊ DẠNG LIST TIMELINE SẠCH SẼ */}
        <List
          loading={loading}
          itemLayout="horizontal"
          dataSource={logs}
          renderItem={(record) => (
            <List.Item style={{ padding: '16px 0', borderBottom: '1px solid #f0f0f0' }}>
              <List.Item.Meta
                avatar={getActionIcon(record.action)}
                title={
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <Space>
                      <UserCircle size={20} color={COLORS.MIDNIGHT_BLUE} weight="fill" />
                      <Text strong style={{ fontSize: 15, color: COLORS.MIDNIGHT_BLUE }}>{record.performedBy}</Text>
                    </Space>
                    <Space style={{ color: '#8c8c8c' }}>
                      <Clock size={14}/>
                      <Text type="secondary" style={{ fontSize: 13 }}>
                        {dayjs(record.createdAt).format('HH:mm:ss - DD/MM/YYYY')}
                      </Text>
                    </Space>
                  </div>
                }
                description={
                  <div style={{ marginTop: 8, fontSize: 14, color: COLORS.DARKEST }}>
                    {generateHumanReadableLog(record)}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  );
}
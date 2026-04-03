import React, { useState, useEffect, useCallback } from 'react';
import { Card, Table, Input, Select, Button, Space, Typography, Tag, Modal, Form, notification, Tooltip, Popconfirm, Switch, Row, Col, Divider, Grid, Pagination, Empty } from 'antd';
import { Plus, MagnifyingGlass, PencilSimple, IdentificationCard, FunnelX, Eye, CheckCircle, LockKey, Key } from '@phosphor-icons/react';
import { userApi } from '../api/userApi';
import { roleApi } from '../api/roleApi';
import { useAuthStore } from '../store/authStore';
import { useSignalR } from '../hooks/useSignalR'; // 🔥 Đã thêm Hook Realtime

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

export default function UserManagementPage() {
  const screens = useBreakpoint();
  const { user: currentUser } = useAuthStore();
  const canManage = currentUser?.permissions?.includes("MANAGE_USERS");

  // 🔥 Khai báo 1 Context duy nhất, ép vị trí xuống bottomRight ở các hàm gọi api
  const [api, contextHolder] = notification.useNotification();

  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState({ page: 1, pageSize: 10, search: '', roleId: null, isActive: null });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [roleForm] = Form.useForm();
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState(null);

  // 🔥 Dùng useCallback để bọc hàm, giúp SignalR gọi lại mà không lỗi
  const fetchUsers = useCallback(async (isRealtime = false) => {
    try {
      if (!isRealtime) setLoading(true);
      const queryParams = { 
        page: filters.page, 
        pageSize: filters.pageSize,
        search: filters.search,
        roleId: filters.roleId,
        isActive: filters.isActive
      };

      const res = await userApi.getUsers(queryParams);
      setUsers(res.items || res.data || res || []);
      setTotal(res.totalCount || res.total || 0);
    } catch (error) {
      if (!isRealtime) {
        api.error({ placement: 'bottomRight', message: 'Lỗi', description: 'Không thể tải danh sách người dùng.' });
      }
    } finally { 
      if (!isRealtime) setLoading(false); 
    }
  }, [filters, api]);

  const fetchRoles = async () => {
    try {
      const res = await roleApi.getRoles();
      setRoles(res || []);
    } catch (error) { console.error('Lỗi tải Role'); }
  };

  useEffect(() => { fetchRoles(); }, []);
  useEffect(() => { fetchUsers(false); }, [fetchUsers]);

  // 🔥 Tự động tải lại bảng dữ liệu khi có ai đó thêm/sửa/xóa User
  useSignalR(() => {
    fetchUsers(true);
  });

  const handleTableChange = (pagination) => setFilters({ ...filters, page: pagination.current, pageSize: pagination.pageSize });
  const handlePageChange = (page, pageSize) => setFilters({ ...filters, page, pageSize });
  const handleSearch = (value) => setFilters({ ...filters, search: value, page: 1 });
  const handleClearFilters = () => setFilters({ page: 1, pageSize: 10, search: '', roleId: null, isActive: null });

  const onFinish = async (values) => {
    try {
      setLoading(true);
      if (editingUser) {
        const payload = { ...values, avatarUrl: editingUser.avatarUrl };
        await userApi.updateUser(editingUser.id, payload);
        api.success({ placement: 'bottomRight', message: 'Thành công', description: 'Cập nhật tài khoản thành công!' });
      } else {
        await userApi.createUser(values);
        api.success({ placement: 'bottomRight', message: 'Thành công', description: 'Tạo tài khoản thành công, mật khẩu đã gửi qua email!' });
      }
      setIsModalOpen(false);
      fetchUsers(false);
    } catch (error) {
      api.error({ placement: 'bottomRight', message: 'Lỗi', description: error.response?.data?.message || 'Có lỗi xảy ra!' });
    } finally { setLoading(false); }
  };

  const handleToggleStatus = async (id, checked) => {
    try {
      await userApi.toggleStatus(id);
      api.success({ placement: 'bottomRight', message: 'Thành công', description: `Đã ${checked ? 'mở khóa' : 'khóa'} tài khoản thành công!` });
      fetchUsers(false);
    } catch (error) {
      api.error({ placement: 'bottomRight', message: 'Lỗi', description: 'Thay đổi trạng thái thất bại.' });
    }
  };

  const onChangeRoleSubmit = async (values) => {
    try {
      setLoading(true);
      await userApi.changeRole(selectedUserId, values.newRoleId);
      api.success({ placement: 'bottomRight', message: 'Thành công', description: 'Đã cập nhật chức vụ thành công!' });
      setIsRoleModalOpen(false);
      fetchUsers(false);
    } catch (error) {
      api.error({ placement: 'bottomRight', message: 'Lỗi', description: 'Lỗi khi đổi chức vụ' });
    } finally { setLoading(false); }
  };

  const handleResetPassword = async (userId) => {
    try {
      setResetLoading(true);
      await userApi.resetPassword(userId);
      api.success({ placement: 'bottomRight', message: 'Thành công', description: 'Đã tạo và gửi mật khẩu mới qua Email!' });
      setIsViewModalOpen(false);
    } catch (error) {
      api.error({ placement: 'bottomRight', message: 'Lỗi', description: error.response?.data?.message || 'Lỗi cấp lại mật khẩu' });
    } finally {
      setResetLoading(false);
    }
  };

  const handleViewUser = (user) => {
    const userRoleData = roles.find(r => r.name === user.roleName);
    setViewingUser({ ...user, permissions: userRoleData?.permissions || [] });
    setIsViewModalOpen(true);
  };

  const columns = [
    {
      title: 'Họ và tên', dataIndex: 'fullName', key: 'fullName',
      render: (text, record) => (
        <Space style={{ opacity: record.isActive ? 1 : 0.5 }}>
          <div style={{ backgroundColor: record.isActive ? '#e9f0f8' : '#d9d9d9', color: MIDNIGHT_BLUE, width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {text ? text.charAt(0).toUpperCase() : 'U'}
          </div>
          <Text style={{ fontWeight: 500, color: MIDNIGHT_BLUE }}>{text}</Text>
          {!record.isActive && <LockKey size={16} color={ACCENT_RED} weight="fill" />}
        </Space>
      )
    },
    { title: 'Email', dataIndex: 'email', key: 'email', render: (t, r) => <Text style={{ color: r.isActive ? 'inherit' : '#bfbfbf' }}>{t}</Text> },
    {
      title: 'Chức vụ', dataIndex: 'roleName', key: 'roleName',
      render: (role, record) => <Tag color={!record.isActive ? 'default' : (role === 'Admin' ? ACCENT_RED : role === 'Guest' ? 'blue' : 'processing')} style={{ borderRadius: 12, padding: '2px 12px', fontWeight: 600 }}>{role}</Tag>
    },
    {
      title: 'Trạng thái', dataIndex: 'isActive', key: 'isActive', align: 'center',
      render: (isActive, record) => (
        <Popconfirm 
          disabled={!canManage} 
          title={`Bạn chắc chắn muốn ${isActive ? 'khóa' : 'mở khóa'} tài khoản này?`} 
          onConfirm={() => handleToggleStatus(record.id, !isActive)} 
          okText="Đồng ý" cancelText="Hủy" placement="topRight"
        >
          <Switch 
            disabled={!canManage}
            checked={isActive} 
            checkedChildren="Hoạt động" 
            unCheckedChildren="Bị khóa" 
            style={{ backgroundColor: isActive ? '#344966' : '#780000' }}
          />
        </Popconfirm>
      )
    },
    {
      title: 'Thao tác', key: 'actions', align: 'right',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Xem chi tiết">
            <Button type="text" icon={<Eye size={20} color="#1890ff" />} onClick={() => handleViewUser(record)} />
          </Tooltip>

          {canManage && (
            <>
              <Tooltip title={record.isActive ? "Chỉnh sửa" : "Tài khoản đang bị khóa - Không thể sửa"}>
                <Button 
                  type="text" 
                  disabled={!record.isActive}
                  icon={<PencilSimple size={20} color={record.isActive ? "#52677D" : "#d9d9d9"} />} 
                  onClick={() => { setEditingUser(record); form.setFieldsValue(record); setIsModalOpen(true); }} 
                />
              </Tooltip>

              <Tooltip title={record.isActive ? "Đổi chức vụ" : "Tài khoản đang bị khóa - Không thể đổi chức vụ"}>
                <Button 
                  type="text" 
                  disabled={!record.isActive}
                  icon={<IdentificationCard size={20} color={record.isActive ? MIDNIGHT_BLUE : "#d9d9d9"} />} 
                  onClick={() => { setSelectedUserId(record.id); roleForm.setFieldsValue({ newRoleId: roles.find(r => r.name === record.roleName)?.id }); setIsRoleModalOpen(true); }} 
                />
              </Tooltip>
            </>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      {/* HIỂN THỊ THÔNG BÁO Ở GÓC DƯỚI */}
      {contextHolder}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', margin: 0 }}>Quản lý Người dùng</Title>
        {canManage && (
          <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => { setEditingUser(null); form.resetFields(); setIsModalOpen(true); }} style={{ backgroundColor: ACCENT_RED, borderRadius: 8, fontWeight: 'bold', boxShadow: '0 4px 10px rgba(138, 21, 56, 0.3)', width: screens.xs ? '100%' : 'auto' }}>
            THÊM NHÂN VIÊN
          </Button>
        )}
      </div>

      <Card variant="borderless" style={{ marginBottom: 24, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={10}>
            <Input.Search 
              placeholder="Tìm tên, email, SĐT..." 
              allowClear 
              value={filters.search} 
              onChange={(e) => setFilters({ ...filters, search: e.target.value })} 
              onSearch={handleSearch} 
              enterButton={<Button style={{ backgroundColor: MIDNIGHT_BLUE, color: '#fff' }}><MagnifyingGlass /></Button>} 
              size="large" 
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select 
              placeholder="Lọc theo Chức vụ" 
              allowClear 
              value={filters.roleId} 
              size="large" 
              onChange={(val) => setFilters({ ...filters, roleId: val, page: 1 })} 
              options={roles.map(r => ({ value: r.id, label: r.name }))} 
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={5}>
            <Select 
              placeholder="Lọc Trạng thái" 
              allowClear 
              value={filters.isActive} 
              size="large" 
              onChange={(val) => setFilters({ ...filters, isActive: val, page: 1 })} 
              options={[{ value: true, label: 'Hoạt động' }, { value: false, label: 'Bị khóa' }]} 
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={4}>
            <Tooltip title="Xóa toàn bộ bộ lọc">
              <Button size="large" icon={<FunnelX size={20} />} onClick={handleClearFilters} style={{ color: '#52677D', width: '100%' }}>Xóa lọc</Button>
            </Tooltip>
          </Col>
        </Row>
      </Card>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', overflow: 'hidden', padding: screens.md ? 0 : '16px 0' }}>
        {screens.md ? (
          <Table 
            columns={columns} 
            dataSource={users} 
            rowKey="id" 
            loading={loading} 
            scroll={{ x: 800 }}
            pagination={{ 
              current: filters.page, pageSize: filters.pageSize, total: total, 
              showSizeChanger: true, pageSizeOptions: ['5', '10', '20', '50'], 
              showTotal: (total, range) => `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} tài khoản`, 
              style: { paddingRight: 24 } 
            }} 
            onChange={handleTableChange} 
            rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'} 
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
            {users.length === 0 && !loading ? (
              <Empty description="Không có dữ liệu" style={{ margin: '40px 0' }} />
            ) : (
              users.map(record => (
                <div key={record.id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, backgroundColor: record.isActive ? '#fff' : '#fafafa', opacity: record.isActive ? 1 : 0.6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <Space>
                      <div style={{ backgroundColor: record.isActive ? '#e9f0f8' : '#d9d9d9', color: MIDNIGHT_BLUE, width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 16 }}>
                        {record.fullName ? record.fullName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <Text strong style={{ fontSize: 16, color: MIDNIGHT_BLUE, display: 'block' }}>{record.fullName}</Text>
                        <Tag color={!record.isActive ? 'default' : (record.roleName === 'Admin' ? ACCENT_RED : record.roleName === 'Guest' ? 'blue' : 'processing')} style={{ marginTop: 4, borderRadius: 12 }}>{record.roleName}</Tag>
                      </div>
                    </Space>
                    <Popconfirm disabled={!canManage} title={`${record.isActive ? 'Khóa' : 'Mở khóa'} tài khoản?`} onConfirm={() => handleToggleStatus(record.id, !record.isActive)}>
                      <Switch disabled={!canManage} checked={record.isActive} size="small" style={{ backgroundColor: record.isActive ? '#344966' : '#780000' }} />
                    </Popconfirm>
                  </div>
                  
                  <div style={{ marginBottom: 12 }}>
                    <Text type="secondary" style={{ display: 'block' }}>{record.email}</Text>
                    <Text type="secondary">{record.phone || 'Chưa có SĐT'}</Text>
                  </div>

                  <Divider style={{ margin: '8px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <Button size="small" icon={<Eye />} onClick={() => handleViewUser(record)}>Xem</Button>
                    {canManage && (
                      <>
                        <Button size="small" disabled={!record.isActive} icon={<PencilSimple />} onClick={() => { setEditingUser(record); form.setFieldsValue(record); setIsModalOpen(true); }}>Sửa</Button>
                        <Button size="small" disabled={!record.isActive} icon={<IdentificationCard />} onClick={() => { setSelectedUserId(record.id); roleForm.setFieldsValue({ newRoleId: roles.find(r => r.name === record.roleName)?.id }); setIsRoleModalOpen(true); }}>Chức vụ</Button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
            
            {total > 0 && (
              <div style={{ textAlign: 'center', marginTop: 16 }}>
                <Pagination 
                  size="small" 
                  current={filters.page} 
                  pageSize={filters.pageSize} 
                  total={total} 
                  onChange={handlePageChange} 
                />
              </div>
            )}
          </div>
        )}
      </Card>

      <Modal title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>Hồ sơ Nhân viên</Title>} open={isViewModalOpen} onCancel={() => setIsViewModalOpen(false)} footer={[<Button key="close" onClick={() => setIsViewModalOpen(false)} style={{ borderRadius: 8 }}>Đóng lại</Button>]} width={600} centered>
        {viewingUser && (
          <div style={{ marginTop: 20 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}><Text type="secondary">Họ và tên:</Text></Col>
              <Col span={16}><Text strong>{viewingUser.fullName}</Text></Col>
              <Col span={8}><Text type="secondary">Email:</Text></Col>
              <Col span={16}><Text strong>{viewingUser.email}</Text></Col>
              <Col span={8}><Text type="secondary">Số điện thoại:</Text></Col>
              <Col span={16}><Text strong>{viewingUser.phone || 'Chưa cập nhật'}</Text></Col>
              <Col span={8}><Text type="secondary">Chức vụ hiện tại:</Text></Col>
              <Col span={16}><Tag color={ACCENT_RED} style={{ fontWeight: 'bold' }}>{viewingUser.roleName}</Tag></Col>
            </Row>

            <Divider dashed style={{ margin: '16px 0' }} />
            
            <Title level={5} style={{ color: MIDNIGHT_BLUE, marginBottom: 16 }}>Quyền hạn truy cập hệ thống:</Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {viewingUser.permissions && viewingUser.permissions.length > 0 ? (
                viewingUser.permissions.map(perm => (
                  <Tag key={perm} icon={<CheckCircle size={14} />} color="blue" style={{ borderRadius: 12, padding: '4px 10px' }}>
                    {perm}
                  </Tag>
                ))
              ) : (
                <Text type="secondary" italic>Người dùng này chưa được gán quyền hạn nào.</Text>
              )}
            </div>

            {canManage && viewingUser.roleName !== 'Guest' && (
              <>
                <Divider dashed style={{ margin: '16px 0' }} />
                <div style={{ display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: screens.xs ? 'flex-start' : 'center', gap: 12, backgroundColor: '#fff1f0', padding: 12, borderRadius: 8, border: '1px dashed #ffa39e' }}>
                  <Text style={{ color: ACCENT_RED }}>Nhân viên quên mật khẩu đăng nhập?</Text>
                  <Popconfirm title="Xác nhận cấp lại mật khẩu?" description="Hệ thống sẽ tạo mật khẩu mới và gửi thẳng vào email của nhân viên này." onConfirm={() => handleResetPassword(viewingUser.id)} okText="Đồng ý gửi" cancelText="Hủy" placement="topRight">
                    <Button type="primary" danger icon={<Key size={18} />} loading={resetLoading} style={{ width: screens.xs ? '100%' : 'auto' }}>
                      Cấp lại mật khẩu
                    </Button>
                  </Popconfirm>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <Modal title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>{editingUser ? 'Cập nhật Thông tin' : 'Thêm Nhân viên Mới'}</Title>} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} centered>
        <Form form={form} layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }}>
          <Form.Item name="fullName" label="Họ và tên" rules={[{ required: true, message: 'Vui lòng nhập họ tên' }]}><Input size="large" placeholder="Nguyễn Văn A" /></Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: 'Vui lòng nhập email' }, { type: 'email' }]}><Input size="large" placeholder="abc@hotel.com" disabled={!!editingUser} /></Form.Item>
          <Form.Item name="phone" label="Số điện thoại" rules={[{ pattern: /^0\d{9}$/, message: 'SĐT không hợp lệ (10 số, bắt đầu bằng 0)' }]}><Input size="large" placeholder="0901234567" /></Form.Item>
          {!editingUser && <Form.Item name="roleId" label="Chức vụ" rules={[{ required: true }]}><Select size="large" placeholder="Chọn chức vụ..." options={roles.map(r => ({ value: r.id, label: r.name }))} /></Form.Item>}
          <div style={{ textAlign: 'right', marginTop: 24 }}><Space><Button size="large" onClick={() => setIsModalOpen(false)}>Hủy</Button><Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: ACCENT_RED }}>{editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}</Button></Space></div>
        </Form>
      </Modal>

      <Modal title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>Đổi Chức vụ</Title>} open={isRoleModalOpen} onCancel={() => setIsRoleModalOpen(false)} footer={null} centered width={400}>
        <Form form={roleForm} layout="vertical" onFinish={onChangeRoleSubmit} style={{ marginTop: 20 }}>
          <Form.Item name="newRoleId" label="Chọn chức vụ mới" rules={[{ required: true, message: 'Vui lòng chọn chức vụ' }]}><Select size="large" placeholder="Chọn chức vụ..." options={roles.map(r => ({ value: r.id, label: r.name }))} /></Form.Item>
          <Button size="large" type="primary" htmlType="submit" loading={loading} block style={{ backgroundColor: MIDNIGHT_BLUE }}>Cập nhật Chức vụ</Button>
        </Form>
      </Modal>

      <style>{`
        .ant-table-thead > tr > th { background-color: #e9f0f8 !important; color: #1C2E4A !important; font-weight: 700 !important; }
        .table-row-light { background-color: #ffffff; }
        .table-row-dark { background-color: #fcfcfc; }
        .ant-table-tbody > tr:hover > td { background-color: #f0f4f8 !important; }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, notification, Tooltip, Popconfirm, Checkbox, Row, Col } from 'antd';
import { Plus, PencilSimple, Trash, ShieldCheck } from '@phosphor-icons/react';
import { roleApi } from '../api/roleApi';

const { Title, Text } = Typography;
const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // State cho Modal Thêm/Sửa Role
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm] = Form.useForm();

  // State cho Modal Phân quyền (Assign Permissions)
  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState(null);
  const [permForm] = Form.useForm();

  // ================= 1. FETCH DỮ LIỆU =================
  const fetchData = async () => {
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        roleApi.getRoles(),
        roleApi.getPermissions()
      ]);
      setRoles(rolesRes || []);
      setAllPermissions(permsRes || []);
    } catch (error) {
      notification.error({ message: 'Lỗi tải dữ liệu chức vụ và quyền hạn', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ================= 2. THAO TÁC THÊM / SỬA ROLE =================
  const openRoleModal = (role = null) => {
    setEditingRole(role);
    if (role) {
      roleForm.setFieldsValue(role);
    } else {
      roleForm.resetFields();
    }
    setIsRoleModalOpen(true);
  };

  const onRoleFormSubmit = async (values) => {
    try {
      setLoading(true);
      if (editingRole) {
        await roleApi.updateRole(editingRole.id, values);
        notification.success({ message: 'Cập nhật chức vụ thành công!', placement: 'bottomRight' });
      } else {
        await roleApi.createRole(values);
        notification.success({ message: 'Tạo chức vụ mới thành công!', placement: 'bottomRight' });
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (error) {
      notification.error({ message: 'Có lỗi xảy ra', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id) => {
    try {
      setLoading(true);
      await roleApi.deleteRole(id);
      notification.success({ message: 'Đã xóa chức vụ thành công!', placement: 'bottomRight' });
      fetchData();
    } catch (error) {
      // Bắt lỗi C# quăng ra khi Role đang có nhân viên
      const errorMsg = error.response?.data?.message || 'Không thể xóa chức vụ này';
      notification.error({ message: 'Xóa thất bại', description: errorMsg, placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  // ================= 3. THAO TÁC PHÂN QUYỀN (MA TRẬN) =================
  const openPermissionModal = (role) => {
    setSelectedRoleForPerms(role);
    
    // RoleResponse của Backend trả về mảng chuỗi Tên Quyền (Permissions: ["MANAGE_USERS", ...])
    // Form Checkbox cần mảng ID quyền. Nên ta map (ánh xạ) Tên sang ID:
    const checkedIds = allPermissions
      .filter(p => role.permissions?.includes(p.name))
      .map(p => p.id);

    permForm.setFieldsValue({ permissionIds: checkedIds });
    setIsPermModalOpen(true);
  };

  const onPermFormSubmit = async (values) => {
    try {
      setLoading(true);
      const payload = {
        roleId: selectedRoleForPerms.id,
        permissionIds: values.permissionIds || []
      };
      await roleApi.assignPermissions(payload);
      notification.success({ message: `Đã cập nhật quyền cho [${selectedRoleForPerms.name}]`, placement: 'bottomRight' });
      setIsPermModalOpen(false);
      fetchData();
    } catch (error) {
      notification.error({ message: 'Phân quyền thất bại', placement: 'bottomRight' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllPerms = () => {
    const allIds = allPermissions.map(p => p.id);
    permForm.setFieldsValue({ permissionIds: allIds });
  };

  const handleClearAllPerms = () => {
    permForm.setFieldsValue({ permissionIds: [] });
  };

  // ================= 4. CẤU HÌNH CỘT CHO BẢNG =================
  const columns = [
    {
      title: 'Tên Vai trò', dataIndex: 'name', key: 'name', width: '20%',
      render: (text) => <Text style={{ fontWeight: 'bold', color: MIDNIGHT_BLUE, fontSize: 15 }}>{text}</Text>
    },
    {
      title: 'Mô tả', dataIndex: 'description', key: 'description', width: '25%',
      render: (text) => <Text type="secondary">{text || 'Không có mô tả'}</Text>
    },
    {
      title: 'Quyền hạn thao tác', dataIndex: 'permissions', key: 'permissions',
      render: (perms) => (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {perms && perms.length > 0 ? (
            // Chỉ hiện 4 quyền đầu tiên, còn lại gom vào tag "+X nữa" cho gọn bảng
            <>
              {perms.slice(0, 4).map(p => (
                <Tag key={p} color="blue" style={{ borderRadius: 12 }}>{p}</Tag>
              ))}
              {perms.length > 4 && <Tag style={{ borderRadius: 12 }}>+{perms.length - 4} nữa...</Tag>}
            </>
          ) : (
            <Text type="secondary" italic>Chưa có quyền nào</Text>
          )}
        </div>
      )
    },
    {
      title: 'Thao tác', key: 'actions', width: '15%', align: 'center',
      render: (_, record) => (
        <Space size="middle">
          {/* NÚT PHÂN QUYỀN */}
          <Tooltip title="Cài đặt Quyền hạn">
            <Button type="text" icon={<ShieldCheck size={22} color={ACCENT_RED} weight="fill" />} onClick={() => openPermissionModal(record)} />
          </Tooltip>
          <Tooltip title="Sửa Vai trò">
            <Button type="text" icon={<PencilSimple size={20} color="#52677D" />} onClick={() => openRoleModal(record)} />
          </Tooltip>
          {/* Không cho phép xóa Role Admin (Bảo vệ hệ thống) */}
          {record.name !== 'Admin' && (
            <Tooltip title="Xóa Vai trò">
              <Popconfirm title="Bạn có chắc muốn xóa chức vụ này?" onConfirm={() => handleDeleteRole(record.id)} okText="Xóa" cancelText="Hủy" placement="topRight">
                <Button type="text" danger icon={<Trash size={20} />} />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Quản lý Vai trò & Phân quyền</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
          <Text style={{ color: '#52677D', fontSize: 16 }}>
            Định nghĩa các chức vụ và gán quyền thao tác trên hệ thống.
          </Text>
          <Button type="primary" size="large" icon={<Plus size={18} />} onClick={() => openRoleModal()} style={{ backgroundColor: ACCENT_RED, borderRadius: 8, fontWeight: 'bold' }}>
            TẠO VAI TRÒ MỚI
          </Button>
        </div>

        <Table 
          columns={columns} 
          dataSource={roles} 
          rowKey="id" 
          loading={loading}
          pagination={false} // Thường bảng Role không quá nhiều nên không cần phân trang
          rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
        />
      </Card>

      {/* MODAL 1: THÊM / SỬA VAI TRÒ */}
      <Modal title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>{editingRole ? 'Sửa Vai trò' : 'Tạo Vai trò mới'}</Title>} open={isRoleModalOpen} onCancel={() => setIsRoleModalOpen(false)} footer={null} centered>
        <Form form={roleForm} layout="vertical" onFinish={onRoleFormSubmit} style={{ marginTop: 20 }}>
          <Form.Item name="name" label="Tên Vai trò (Chức vụ)" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}>
            <Input size="large" placeholder="VD: Lễ tân, Kế toán..." disabled={editingRole?.name === 'Admin'} />
          </Form.Item>
          <Form.Item name="description" label="Mô tả công việc">
            <Input.TextArea rows={3} placeholder="Mô tả quyền hạn của chức vụ này..." />
          </Form.Item>
          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button size="large" onClick={() => setIsRoleModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: ACCENT_RED }}>Lưu Vai trò</Button>
            </Space>
          </div>
        </Form>
      </Modal>

      {/* MODAL 2: MA TRẬN PHÂN QUYỀN */}
      <Modal title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>Phân quyền cho: <span style={{ color: ACCENT_RED }}>{selectedRoleForPerms?.name}</span></Title>} open={isPermModalOpen} onCancel={() => setIsPermModalOpen(false)} footer={null} width={700} centered>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <Button size="small" onClick={handleSelectAllPerms}>Chọn tất cả</Button>
          <Button size="small" onClick={handleClearAllPerms} danger>Bỏ chọn tất cả</Button>
        </div>
        
        <Form form={permForm} onFinish={onPermFormSubmit}>
          <Form.Item name="permissionIds">
            <Checkbox.Group style={{ width: '100%' }}>
              <div style={{ backgroundColor: '#f9fbfd', padding: 20, borderRadius: 12, border: '1px solid #e9f0f8' }}>
                <Row gutter={[16, 16]}>
                  {allPermissions.map(perm => (
                    <Col span={12} key={perm.id}>
                      {/* Dùng Checkbox bọc trong thẻ div có hiệu ứng hover để dễ tick */}
                      <div className="perm-checkbox-item" style={{ padding: '8px 12px', borderRadius: 6, transition: 'background 0.3s' }}>
                        <Checkbox value={perm.id}>
                          <Text style={{ fontWeight: 500, color: MIDNIGHT_BLUE }}>{perm.name}</Text>
                        </Checkbox>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Checkbox.Group>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space>
              <Button size="large" onClick={() => setIsPermModalOpen(false)}>Hủy</Button>
              <Button size="large" type="primary" htmlType="submit" loading={loading} style={{ backgroundColor: MIDNIGHT_BLUE, fontWeight: 'bold' }}>
                Lưu Quyền Hạn
              </Button>
            </Space>
          </div>
        </Form>
      </Modal>

      <style>{`
        .ant-table-thead > tr > th { background-color: #e9f0f8 !important; color: #1C2E4A !important; font-weight: 700 !important; }
        .table-row-light { background-color: #ffffff; }
        .table-row-dark { background-color: #fcfcfc; }
        .ant-table-tbody > tr:hover > td { background-color: #f0f4f8 !important; }
        .perm-checkbox-item:hover { background-color: #e9f0f8; }
      `}</style>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Space, Typography, Tag, Modal, Form, Input, notification, Tooltip, Popconfirm, Checkbox, Row, Col, Divider, Grid, Empty } from 'antd';
import { Plus, PencilSimple, Trash, ShieldCheck, LockKey } from '@phosphor-icons/react';
import { roleApi } from '../api/roleApi';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;
const { useBreakpoint } = Grid;

const ACCENT_RED = '#8A1538';
const MIDNIGHT_BLUE = '#1C2E4A';

export default function RolesPage() {
  const screens = useBreakpoint();
  const { user: currentUser } = useAuthStore();
  const canManage = currentUser?.permissions?.includes("MANAGE_ROLES");

  // 🔥 Đồng bộ thông báo nằm ở góc dưới bên phải
  const [api, contextHolder] = notification.useNotification({ placement: 'bottomRight' });

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [roleForm] = Form.useForm();

  const [isPermModalOpen, setIsPermModalOpen] = useState(false);
  const [selectedRoleForPerms, setSelectedRoleForPerms] = useState(null);
  const [permForm] = Form.useForm();

  // 🛡️ State lưu lại mảng quyền trước đó để tính toán logic Auto-tick
  const [prevPerms, setPrevPerms] = useState([]);

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
      api.error({ message: 'Lỗi tải dữ liệu chức vụ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
        api.success({ message: 'Cập nhật thành công!' });
      } else {
        await roleApi.createRole(values);
        api.success({ message: 'Tạo vai trò mới thành công!' });
      }
      setIsRoleModalOpen(false);
      fetchData();
    } catch (error) {
      api.error({ message: 'Lỗi xử lý vai trò' });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id) => {
    try {
      setLoading(true);
      await roleApi.deleteRole(id);
      api.success({ message: 'Xóa vai trò thành công!' });
      fetchData();
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Không thể xóa chức vụ này';
      api.error({ message: 'Xóa thất bại', description: errorMsg });
    } finally {
      setLoading(false);
    }
  };

  const openPermissionModal = (role) => {
    setSelectedRoleForPerms(role);
    const checkedIds = allPermissions
      .filter(p => role.permissions?.includes(p.name))
      .map(p => p.id);

    permForm.setFieldsValue({ permissionIds: checkedIds });
    setPrevPerms(checkedIds); // Lưu lại vết
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
      api.success({ message: `Cập nhật quyền cho [${selectedRoleForPerms.name}]` });
      setIsPermModalOpen(false);
      fetchData();
    } catch (error) {
      api.error({ message: 'Phân quyền thất bại' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAllPerms = () => {
    const allIds = allPermissions.map(p => p.id);
    permForm.setFieldsValue({ permissionIds: allIds });
    setPrevPerms(allIds);
  };

  const handleClearAllPerms = () => {
    if (selectedRoleForPerms?.name === 'Admin') {
      const manageRolesId = allPermissions.find(p => p.name === 'MANAGE_ROLES')?.id;
      const newPerms = manageRolesId ? [manageRolesId] : [];
      permForm.setFieldsValue({ permissionIds: newPerms });
      setPrevPerms(newPerms);
      api.info({ message: 'Đã giữ lại quyền quản lý vai trò cho Admin' });
    } else {
      permForm.setFieldsValue({ permissionIds: [] });
      setPrevPerms([]);
    }
  };

  const columns = [
    {
      title: 'Tên Vai trò', dataIndex: 'name', key: 'name', width: '20%',
      render: (text) => (
        <Space>
          <Text style={{ fontWeight: 'bold', color: MIDNIGHT_BLUE, fontSize: 15 }}>{text}</Text>
          {(text === 'Admin' || text === 'Guest') && <LockKey size={16} color={ACCENT_RED} weight="fill" />}
        </Space>
      )
    },
    {
      title: 'Mô tả', dataIndex: 'description', key: 'description', width: '25%',
      render: (text) => <Text type="secondary">{text || 'Không có mô tả'}</Text>
    },
    {
      title: 'Quyền hạn thao tác', dataIndex: 'permissions', key: 'permissions',
      render: (perms, record) => {
        if (record.name === 'Guest') return <Text type="secondary" italic>Khách hàng (Không có quyền Admin)</Text>;
        return (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {perms && perms.length > 0 ? (
              <>
                {perms.slice(0, 4).map(p => (
                  <Tag key={p} color={p.startsWith('MANAGE') ? 'volcano' : 'blue'} style={{ borderRadius: 12 }}>{p}</Tag>
                ))}
                {perms.length > 4 && <Tag style={{ borderRadius: 12 }}>+{perms.length - 4} nữa...</Tag>}
              </>
            ) : (
              <Text type="secondary" italic>Chưa có quyền nào</Text>
            )}
          </div>
        );
      }
    },
    {
      title: 'Thao tác', key: 'actions', width: '15%', align: 'center',
      render: (_, record) => (
        <Space size="middle">
          {canManage ? (
            <>
              {record.name !== 'Guest' ? (
                <Tooltip title="Cài đặt Quyền hạn">
                  <Button type="text" icon={<ShieldCheck size={22} color={ACCENT_RED} weight="fill" />} onClick={() => openPermissionModal(record)} />
                </Tooltip>
              ) : (
                <Tooltip title="Chức vụ này không được phép phân quyền">
                  <Button type="text" disabled icon={<ShieldCheck size={22} color="#d9d9d9" weight="fill" />} />
                </Tooltip>
              )}

              <Tooltip title="Sửa Vai trò">
                <Button type="text" icon={<PencilSimple size={20} color="#52677D" />} onClick={() => openRoleModal(record)} />
              </Tooltip>

              {(record.name !== 'Admin' && record.name !== 'Guest') && (
                <Tooltip title="Xóa Vai trò">
                  <Popconfirm title="Bạn có chắc muốn xóa chức vụ này?" onConfirm={() => handleDeleteRole(record.id)} okText="Xóa" cancelText="Hủy" placement="topRight">
                    <Button type="text" danger icon={<Trash size={20} />} />
                  </Popconfirm>
                </Tooltip>
              )}
            </>
          ) : (
            <Text type="secondary" style={{ fontSize: 12 }}>Chỉ xem</Text>
          )}
        </Space>
      )
    }
  ];

  return (
    <div>
      {contextHolder}
      <Title level={3} style={{ color: MIDNIGHT_BLUE, fontFamily: '"Source Serif 4", serif', marginBottom: 24 }}>Quản lý Vai trò & Phân quyền</Title>

      <Card variant="borderless" style={{ borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.03)', padding: screens.md ? 0 : '16px 0' }}>
        <div style={{ display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', marginBottom: 20, gap: 16, padding: screens.md ? '0' : '0 16px' }}>
          <Text style={{ color: '#52677D', fontSize: 16 }}>
            Định nghĩa các chức vụ và gán quyền thao tác trên hệ thống.
          </Text>
          {canManage && (
            <Button 
              type="primary" 
              size="large" 
              icon={<Plus size={18} />} 
              onClick={() => openRoleModal()} 
              style={{ backgroundColor: ACCENT_RED, borderRadius: 8, fontWeight: 'bold', width: screens.xs ? '100%' : 'auto' }}
            >
              TẠO VAI TRÒ MỚI
            </Button>
          )}
        </div>

        {/* 🔥 HIỂN THỊ BẢNG TRÊN PC VÀ CARD TRÊN MOBILE */}
        {screens.md ? (
          <Table 
            columns={columns} 
            dataSource={roles} 
            rowKey="id" 
            loading={loading}
            pagination={false} 
            rowClassName={(record, index) => index % 2 === 0 ? 'table-row-light' : 'table-row-dark'}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 16px' }}>
            {roles.length === 0 && !loading ? (
              <Empty description="Không có dữ liệu" style={{ margin: '40px 0' }} />
            ) : (
              roles.map(record => (
                <div key={record.id} style={{ border: '1px solid #f0f0f0', borderRadius: 8, padding: 16, backgroundColor: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Space>
                      <Text style={{ fontWeight: 'bold', color: MIDNIGHT_BLUE, fontSize: 16 }}>{record.name}</Text>
                      {(record.name === 'Admin' || record.name === 'Guest') && <LockKey size={16} color={ACCENT_RED} weight="fill" />}
                    </Space>
                  </div>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>{record.description || 'Không có mô tả'}</Text>
                  
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: 16 }}>
                    {record.name === 'Guest' ? (
                      <Text type="secondary" italic>Khách hàng (Không có quyền Admin)</Text>
                    ) : record.permissions && record.permissions.length > 0 ? (
                      <>
                        {record.permissions.slice(0, 4).map(p => (
                          <Tag key={p} color={p.startsWith('MANAGE') ? 'volcano' : 'blue'} style={{ borderRadius: 12, margin: 0 }}>{p}</Tag>
                        ))}
                        {record.permissions.length > 4 && <Tag style={{ borderRadius: 12, margin: 0 }}>+{record.permissions.length - 4} nữa...</Tag>}
                      </>
                    ) : (
                      <Text type="secondary" italic>Chưa có quyền nào</Text>
                    )}
                  </div>
                  
                  <Divider style={{ margin: '8px 0' }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    {canManage ? (
                      <>
                        {record.name !== 'Guest' ? (
                          <Button size="small" icon={<ShieldCheck color={ACCENT_RED} weight="fill" />} onClick={() => openPermissionModal(record)}>Quyền</Button>
                        ) : (
                          <Button size="small" disabled icon={<ShieldCheck color="#d9d9d9" weight="fill" />}>Quyền</Button>
                        )}
                        <Button size="small" icon={<PencilSimple />} onClick={() => openRoleModal(record)}>Sửa</Button>
                        {(record.name !== 'Admin' && record.name !== 'Guest') && (
                          <Popconfirm title="Xóa chức vụ này?" onConfirm={() => handleDeleteRole(record.id)} okText="Xóa" cancelText="Hủy">
                            <Button size="small" danger icon={<Trash />}>Xóa</Button>
                          </Popconfirm>
                        )}
                      </>
                    ) : (
                      <Text type="secondary" style={{ fontSize: 12 }}>Chỉ xem</Text>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </Card>

      {/* MODAL 1: THÊM / SỬA VAI TRÒ */}
      <Modal title={<Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>{editingRole ? 'Sửa Vai trò' : 'Tạo Vai trò mới'}</Title>} open={isRoleModalOpen} onCancel={() => setIsRoleModalOpen(false)} footer={null} centered>
        <Form form={roleForm} layout="vertical" onFinish={onRoleFormSubmit} style={{ marginTop: 20 }}>
          <Form.Item name="name" label="Tên Vai trò (Chức vụ)" rules={[{ required: true, message: 'Vui lòng nhập tên vai trò' }]}>
            <Input size="large" placeholder="VD: Lễ tân, Kế toán..." disabled={editingRole?.name === 'Admin' || editingRole?.name === 'Guest'} />
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
      <Modal 
        title={<Space><ShieldCheck size={24} color={ACCENT_RED}/><Title level={4} style={{ color: MIDNIGHT_BLUE, margin: 0 }}>Phân quyền cho: <span style={{ color: ACCENT_RED }}>{selectedRoleForPerms?.name}</span></Title></Space>} 
        open={isPermModalOpen} 
        onCancel={() => setIsPermModalOpen(false)} 
        footer={null} 
        width={700} 
        centered
      >
        <div style={{ marginBottom: 16, display: 'flex', flexDirection: screens.xs ? 'column' : 'row', justifyContent: 'space-between', alignItems: screens.xs ? 'flex-start' : 'center', gap: 12 }}>
          <Text type="secondary" style={{ fontSize: screens.xs ? 13 : 14 }}>* Quyền <Text strong>MANAGE_ROLES</Text> của Admin luôn được giữ lại.</Text>
          <Space>
            <Button size="small" onClick={handleSelectAllPerms}>Chọn tất cả</Button>
            <Button size="small" onClick={handleClearAllPerms} danger>Bỏ chọn tất cả</Button>
          </Space>
        </div>
        
        <Form form={permForm} onFinish={onPermFormSubmit}>
          <Form.Item name="permissionIds">
            <Checkbox.Group 
              style={{ width: '100%' }}
              onChange={(checkedValues) => {
                let newCheckedValues = [...checkedValues];

                const added = newCheckedValues.find(x => !prevPerms.includes(x));
                const removed = prevPerms.find(x => !newCheckedValues.includes(x));

                if (added) {
                  const addedPerm = allPermissions.find(p => p.id === added);
                  if (addedPerm?.name.startsWith('MANAGE_')) {
                    const viewPermName = addedPerm.name.replace('MANAGE_', 'VIEW_');
                    const viewPerm = allPermissions.find(p => p.name === viewPermName);
                    if (viewPerm && !newCheckedValues.includes(viewPerm.id)) {
                      newCheckedValues.push(viewPerm.id);
                    }
                  }
                }

                if (removed) {
                  const removedPerm = allPermissions.find(p => p.id === removed);
                  if (removedPerm?.name.startsWith('VIEW_')) {
                    const managePermName = removedPerm.name.replace('VIEW_', 'MANAGE_');
                    const managePerm = allPermissions.find(p => p.name === managePermName);
                    if (managePerm && newCheckedValues.includes(managePerm.id)) {
                      newCheckedValues = newCheckedValues.filter(id => id !== managePerm.id);
                    }
                  }
                }

                permForm.setFieldsValue({ permissionIds: newCheckedValues });
                setPrevPerms(newCheckedValues);
              }}
            >
              <div style={{ backgroundColor: '#f9fbfd', padding: screens.xs ? 12 : 20, borderRadius: 12, border: '1px solid #e9f0f8', maxHeight: screens.xs ? '60vh' : 'auto', overflowY: screens.xs ? 'auto' : 'visible' }}>
                <Row gutter={[16, 16]}>
                  {allPermissions.map(perm => {
                    const isAdminLock = selectedRoleForPerms?.name === 'Admin' && perm.name === 'MANAGE_ROLES';
                    
                    return (
                      // 🔥 Responsive 2 cột trên PC, 1 cột trên Mobile
                      <Col xs={24} md={12} key={perm.id}>
                        <div className="perm-checkbox-item" style={{ padding: '8px 12px', borderRadius: 6, backgroundColor: isAdminLock ? '#fff1f0' : 'transparent' }}>
                          <Checkbox value={perm.id} disabled={isAdminLock}>
                            <Text style={{ fontWeight: 500, color: isAdminLock ? ACCENT_RED : MIDNIGHT_BLUE, fontSize: screens.xs ? 13 : 14 }}>
                              {perm.name} {isAdminLock && <Tooltip title="Quyền này là bắt buộc đối với Admin"><LockKey size={14} weight="fill" /></Tooltip>}
                            </Text>
                          </Checkbox>
                        </div>
                      </Col>
                    );
                  })}
                </Row>
              </div>
            </Checkbox.Group>
          </Form.Item>

          <div style={{ textAlign: 'right', marginTop: 24 }}>
            <Space style={{ width: screens.xs ? '100%' : 'auto', justifyContent: screens.xs ? 'flex-end' : 'flex-start' }}>
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
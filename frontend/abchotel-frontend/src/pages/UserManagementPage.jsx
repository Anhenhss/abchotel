import { Table, Input, Select, Button, Space, Tag, Card, Row, Col } from 'antd';
import { MagnifyingGlass, Plus, LockKey, LockKeyOpen } from '@phosphor-icons/react';
import { useState, useEffect } from 'react';

const { Search } = Input;

export default function UserManagementPage() {
  // States cho Bảng và Bộ lọc
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    roleId: null,
    isActive: null,
    page: 1,
    pageSize: 10,
  });

  // Giả lập gọi API (Sau này em sẽ thay bằng hàm axios gọi Backend)
  const fetchUsers = async () => {
    setLoading(true);
    // Ví dụ: const res = await userApi.getUsers(filters);
    // setUsers(res.data.items);
    setTimeout(() => {
        setUsers([
            { id: 1, fullName: 'Nguyễn Văn A', email: 'a@gmail.com', phone: '0901234567', roleName: 'Manager', isActive: true },
            { id: 2, fullName: 'Lê Thị B', email: 'b@gmail.com', phone: '0987654321', roleName: 'Receptionist', isActive: false },
        ]);
        setLoading(false);
    }, 500);
  };

  // Gọi lại API khi filters thay đổi
  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const columns = [
    { title: 'Họ tên', dataIndex: 'fullName', key: 'fullName' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'SĐT', dataIndex: 'phone', key: 'phone' },
    { 
      title: 'Vai trò', 
      dataIndex: 'roleName', 
      key: 'roleName',
      render: (role) => <Tag color="#1C2E4A">{role}</Tag> 
    },
    { 
      title: 'Trạng thái', 
      dataIndex: 'isActive', 
      key: 'isActive',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Bị Khóa'}
        </Tag>
      )
    },
    {
      title: 'Thao tác',
      key: 'actions',
      render: (_, record) => (
        <Space>
           {/* Nút chỉ đổi màu, logic xử lý phân quyền tính sau */}
          <Button type="default" size="small">Phân quyền</Button> 
          {record.isActive ? (
             <Button danger size="small" icon={<LockKey />}>Khóa</Button>
          ) : (
             <Button type="primary" size="small" icon={<LockKeyOpen />}>Mở khóa</Button>
          )}
        </Space>
      )
    }
  ];

  return (
    <Card title="Quản lý Nhân sự" bordered={false} extra={<Button type="primary" icon={<Plus />}>Thêm nhân viên</Button>}>
      {/* BỘ LỌC */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={8}>
          <Search 
            placeholder="Tìm theo Tên, Email, SĐT" 
            onSearch={(val) => setFilters({...filters, search: val, page: 1})}
            enterButton={<MagnifyingGlass />}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select 
            style={{ width: '100%' }} 
            placeholder="Lọc theo Vai trò" 
            allowClear
            onChange={(val) => setFilters({...filters, roleId: val, page: 1})}
            options={[
              { value: 2, label: 'Manager' },
              { value: 3, label: 'Receptionist' },
            ]}
          />
        </Col>
        <Col span={6}>
          <Select 
            style={{ width: '100%' }} 
            placeholder="Lọc theo Trạng thái" 
            allowClear
            onChange={(val) => setFilters({...filters, isActive: val, page: 1})}
            options={[
              { value: true, label: 'Hoạt động' },
              { value: false, label: 'Bị khóa' },
            ]}
          />
        </Col>
      </Row>

      {/* BẢNG DỮ LIỆU */}
      <Table 
        columns={columns} 
        dataSource={users} 
        rowKey="id" 
        loading={loading}
        pagination={{
            current: filters.page,
            pageSize: filters.pageSize,
            total: 50, // Lấy từ API trả về
            onChange: (page, pageSize) => setFilters({...filters, page, pageSize})
        }}
      />
    </Card>
  );
}
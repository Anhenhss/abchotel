using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class PermissionResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class RoleResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public List<string> Permissions { get; set; } // Danh sách tên quyền để Frontend dễ hiển thị
    }

    public class AssignPermissionRequest
    {
        public int RoleId { get; set; }
        public List<int> PermissionIds { get; set; }
    }

    public class CreateRoleRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }

    public class UpdateRoleRequest
    {
        public string Name { get; set; }
        public string Description { get; set; }
    }
}
using System.Collections.Generic;

namespace abchotel.DTOs
{
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
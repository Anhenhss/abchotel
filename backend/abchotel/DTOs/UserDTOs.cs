namespace abchotel.DTOs
{
    public class UserResponse
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string AvatarUrl { get; set; }
        public string RoleName { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateUserRequest
    {
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Password { get; set; }
        public int RoleId { get; set; }
    }

    public class UpdateUserRequest
    {
        public string FullName { get; set; }
        public string Phone { get; set; }
        public string AvatarUrl { get; set; }
    }

    public class ChangeRoleRequest
    {
        public int NewRoleId { get; set; }
    }
}
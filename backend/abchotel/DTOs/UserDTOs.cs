using System;
using System.ComponentModel.DataAnnotations;

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
        [Required(ErrorMessage = "Họ tên không được để trống.")]
        [StringLength(255, MinimumLength = 2, ErrorMessage = "Họ tên phải từ 2 đến 255 ký tự.")]
        public string FullName { get; set; }
        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Định dạng Email không hợp lệ.")]
        public string Email { get; set; }
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng số 0.")]
        public string? Phone { get; set; }
        public int RoleId { get; set; }
    }

    public class UpdateUserRequest
    {
        [Required(ErrorMessage = "Họ tên không được để trống.")]
        [StringLength(255, MinimumLength = 2, ErrorMessage = "Họ tên phải từ 2 đến 255 ký tự.")]
        public string? FullName { get; set; }

        // Cho phép null để tránh lỗi Validation khi không muốn cập nhật số điện thoại
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại phải gồm 10 chữ số và bắt đầu bằng số 0.")]
        public string? Phone { get; set; } 
        
        public string? AvatarUrl { get; set; }
    }

    public class ChangeRoleRequest
    {
        public int NewRoleId { get; set; }
    }

    public class UserFilterRequest
    {
        public string? Search { get; set; }  
        public int? RoleId { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class PaginatedUserResponse
    {
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public System.Collections.Generic.List<UserResponse> Items { get; set; }
    }

}
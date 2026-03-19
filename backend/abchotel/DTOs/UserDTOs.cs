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
        public string Phone { get; set; }
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        public string Password { get; set; }
        public int RoleId { get; set; }
    }

    public class UpdateUserRequest
    {
        [Required(ErrorMessage = "Họ tên không được để trống.")]
        [StringLength(255, MinimumLength = 2, ErrorMessage = "Họ tên phải từ 2 đến 255 ký tự.")]
        public string FullName { get; set; }
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng số 0.")]
        public string Phone { get; set; }
        public string AvatarUrl { get; set; }
    }

    public class ChangeRoleRequest
    {
        public int NewRoleId { get; set; }
    }
}
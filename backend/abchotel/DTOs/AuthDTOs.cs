using System.Collections.Generic;
using System;
using System.ComponentModel.DataAnnotations;
namespace abchotel.DTOs
{
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }

    public class TokenResponse
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
    }

    public class RefreshTokenRequest
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
    }

    public class UserProfileResponse
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string AvatarUrl { get; set; }
        public string RoleName { get; set; }
        public List<string> Permissions { get; set; }
    }
    public class RegisterRequest
    {
        [Required]
        public string FullName { get; set; }
        [Required(ErrorMessage = "Email là bắt buộc.")]
        [EmailAddress(ErrorMessage = "Định dạng Email không hợp lệ.")]
        public string Email { get; set; }
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng số 0.")]
        public string Phone { get; set; }
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        public string Password { get; set; }
    }
    public class ForgotPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
    }
}
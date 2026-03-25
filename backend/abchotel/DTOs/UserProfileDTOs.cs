using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using abchotel.Attributes;

namespace abchotel.DTOs
{
    public class UserProfileDetailResponse
    {
        public int Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string AvatarUrl { get; set; }
        public string RoleName { get; set; }
        public int TotalPoints { get; set; }
        public string Gender { get; set; }
        public DateOnly? DateOfBirth { get; set; }
    }

    public class UpdateMyProfileRequest
    {
        [Required(ErrorMessage = "Họ tên không được để trống.")]
        [StringLength(255, MinimumLength = 2, ErrorMessage = "Họ tên phải từ 2 đến 255 ký tự.")]
        public string FullName { get; set; }
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ. Phải gồm 10 chữ số và bắt đầu bằng số 0.")]
        public string Phone { get; set; }
        public string Address { get; set; }
        [RegularExpression(@"^(Nam|Nữ|Khác)$", ErrorMessage = "Giới tính chỉ chấp nhận: Nam, Nữ, hoặc Khác.")]
        public string Gender { get; set; }
        [Over18YearsOld]
        public DateOnly? DateOfBirth { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; }
        [MinLength(6, ErrorMessage = "Mật khẩu phải có ít nhất 6 ký tự.")]
        public string NewPassword { get; set; }
    }

    public class UploadAvatarRequest
    {
        public string AvatarUrl { get; set; }
    }
}
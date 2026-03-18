using System.Collections.Generic;

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
    }

    public class UpdateMyProfileRequest
    {
        public string FullName { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }
        public string Gender { get; set; }
        public DateOnly? DateOfBirth { get; set; }
    }

    public class ChangePasswordRequest
    {
        public string OldPassword { get; set; }
        public string NewPassword { get; set; }
    }

    public class UploadAvatarRequest
    {
        public string AvatarUrl { get; set; }
    }
}
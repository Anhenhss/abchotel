using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserProfileService _profileService;
        public UserProfileController(IUserProfileService profileService) => _profileService = profileService;
        private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var profile = await _profileService.GetMyProfileAsync(GetCurrentUserId());
            if (profile == null) return NotFound("Không tìm thấy dữ liệu cá nhân.");
            return Ok(profile);
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateMyProfileRequest request)
        {
            var success = await _profileService.UpdateProfileAsync(GetCurrentUserId(), request);
            if (!success) return BadRequest("Lỗi cập nhật.");
            return Ok(new { message = "Cập nhật hồ sơ thành công." });
        }

        [HttpPut("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var result = await _profileService.ChangePasswordAsync(GetCurrentUserId(), request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPost("upload-avatar")]
        public async Task<IActionResult> UploadAvatar([FromBody] UploadAvatarRequest request)
        {
            var success = await _profileService.UpdateAvatarAsync(GetCurrentUserId(), request.AvatarUrl);
            if (!success) return BadRequest("Lỗi cập nhật Avatar.");
            return Ok(new { message = "Cập nhật ảnh đại diện thành công." });
        }
    }
}
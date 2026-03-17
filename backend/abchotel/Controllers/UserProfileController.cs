using Microsoft.AspNetCore.Mvc;
using abchotel.Services;
using abchotel.DTOs;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;

namespace abchotel.Controllers
{
    [Authorize]
    [Route("api/[controller]")]
    [ApiController]
    public class UserProfileController : ControllerBase
    {
        private readonly IUserService _userService;
        public UserProfileController(IUserService userService) => _userService = userService;

        [HttpGet("my-profile")]
        public async Task<IActionResult> GetMyProfile()
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var user = await _userService.GetMyProfileAsync(userId);
            return user == null ? NotFound() : Ok(user);
        }

        [HttpPut("update-profile")]
        public async Task<IActionResult> UpdateProfile(UpdateUserRequest request)
        {
            var userId = int.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "0");
            var result = await _userService.UpdateUserAsync(userId, request);
            return result ? Ok("Cập nhật thành công") : BadRequest("Thất bại");
        }

        [HttpPost("upload-avatar")]
        public IActionResult UploadAvatar() => Ok("Tính năng upload đang được xử lý...");

        [HttpPut("change-password")]
        public IActionResult ChangePassword() => Ok("Tính năng đổi mật khẩu đang được xử lý...");
    }
}
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Phải là Admin mới quản lý được nhân sự/người dùng
    public class UserManagementController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserManagementController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _userService.GetAllUsersAsync();
            return Ok(users);
        }

        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            var result = await _userService.CreateUserAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var success = await _userService.UpdateUserAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy người dùng." });
            return Ok(new { message = "Cập nhật thành công." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _userService.SoftDeleteUserAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy người dùng." });
            return Ok(new { message = "Đã thay đổi trạng thái ẩn/hiện người dùng." });
        }

        [HttpPut("{id}/change-role")]
        public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest request)
        {
            var success = await _userService.ChangeUserRoleAsync(id, request.NewRoleId);
            if (!success) return NotFound(new { message = "Không tìm thấy người dùng." });
            return Ok(new { message = "Thay đổi vai trò thành công." });
        }
    }
}
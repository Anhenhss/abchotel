using System.Linq;
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
    public class UserManagementController : ControllerBase
    {
        private readonly IUserService _userService;

        public UserManagementController(IUserService userService)
        {
            _userService = userService;
        }

        // HÀM PHỤ TRỢ KIỂM TRA QUYỀN "XEM" HOẶC "QUẢN LÝ"
        private bool HasViewOrManageUsers()
        {
            // Trích xuất danh sách quyền từ Token của user
            var permissions = User.FindAll("Permission").Select(c => c.Value);
            return permissions.Contains("VIEW_USERS") || permissions.Contains("MANAGE_USERS");
        }

        // ==========================================
        // NHÓM API LẤY DỮ LIỆU (GET) - CHO PHÉP CẢ VIEW HOẶC MANAGE
        // ==========================================
        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] UserFilterRequest filter)
        {
            // Không có quyền VIEW cũng không có MANAGE -> Báo lỗi 403 Forbidden
            if (!HasViewOrManageUsers()) return Forbid();

            var result = await _userService.GetUsersAsync(filter);
            return Ok(result);
        }

        // ==========================================
        // NHÓM API THAO TÁC (POST/PUT/DELETE) - BẮT BUỘC CHỈ CÓ MANAGE
        // ==========================================
        [HttpPost]
        [Authorize(Policy = "MANAGE_USERS")] // 🔒 Ép buộc: Phải có quyền quản lý
        public async Task<IActionResult> CreateUser([FromBody] CreateUserRequest request)
        {
            var result = await _userService.CreateUserAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_USERS")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
        {
            var success = await _userService.UpdateUserAsync(id, request);
            if (!success) 
                return BadRequest(new { message = "Không tìm thấy người dùng hoặc tài khoản đang bị khóa, không thể chỉnh sửa." });
            
            return Ok(new { message = "Cập nhật thành công." });
        }

        [HttpPut("{id}/change-role")]
        [Authorize(Policy = "MANAGE_USERS")]
        public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest request)
        {
            var success = await _userService.ChangeUserRoleAsync(id, request.NewRoleId);
            if (!success) 
                return BadRequest(new { message = "Không tìm thấy người dùng hoặc tài khoản đang bị khóa, không thể đổi chức vụ." });

            return Ok(new { message = "Thay đổi vai trò thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_USERS")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            var success = await _userService.SoftDeleteUserAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy người dùng." });
            return Ok(new { message = "Đã thay đổi trạng thái ẩn/hiện người dùng." });
        }
    }
}
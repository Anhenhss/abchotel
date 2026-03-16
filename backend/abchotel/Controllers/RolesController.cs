using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "Admin")] // Chỉ Admin mới được can thiệp vào Role
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            var roles = await _roleService.GetAllRolesAsync();
            return Ok(roles);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
        {
            var role = await _roleService.CreateRoleAsync(request);
            return Ok(new { message = "Tạo Role thành công.", data = role });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
        {
            var role = await _roleService.UpdateRoleAsync(id, request);
            if (role == null) return NotFound(new { message = "Không tìm thấy Role." });
            return Ok(new { message = "Cập nhật Role thành công.", data = role });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            var success = await _roleService.DeleteRoleAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy Role." });
            return Ok(new { message = "Xóa Role thành công." });
        }

        [HttpPost("assign-permission")]
        public async Task<IActionResult> AssignPermission([FromBody] AssignPermissionRequest request)
        {
            var success = await _roleService.AssignPermissionsAsync(request.RoleId, request.PermissionIds);
            if (!success) return BadRequest(new { message = "Lỗi khi gán quyền." });
            return Ok(new { message = "Phân quyền thành công." });
        }
    }
}
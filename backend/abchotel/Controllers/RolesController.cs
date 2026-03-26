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
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        // HÀM PHỤ TRỢ KIỂM TRA QUYỀN "XEM" HOẶC "QUẢN LÝ"
        private bool HasViewOrManageRoles()
        {
            // Trích xuất danh sách quyền từ Token của user
            var permissions = User.FindAll("Permission").Select(c => c.Value);
            return permissions.Contains("VIEW_ROLES") || permissions.Contains("MANAGE_ROLES");
        }

        // ==========================================
        // NHÓM API LẤY DỮ LIỆU (GET) - CHO PHÉP CẢ VIEW HOẶC MANAGE
        // ==========================================

        [HttpGet]
        public async Task<IActionResult> GetRoles()
        {
            // Nếu không có VIEW cũng không có MANAGE -> Đá văng ra (Lỗi 403 Forbidden)
            if (!HasViewOrManageRoles()) return Forbid();

            var roles = await _roleService.GetAllRolesAsync();
            return Ok(roles);
        }

        [HttpGet("permissions")]
        public async Task<IActionResult> GetPermissions()
        {
            if (!HasViewOrManageRoles()) return Forbid();

            var permissions = await _roleService.GetAllPermissionsAsync();
            return Ok(permissions);
        }

        // ==========================================
        // NHÓM API THAO TÁC (POST/PUT/DELETE) - BẮT BUỘC CHỈ CÓ MANAGE
        // ==========================================

        [HttpPost]
        [Authorize(Policy = "MANAGE_ROLES")] // 🔒 Ép buộc khắt khe: Phải có MANAGE_ROLES
        public async Task<IActionResult> CreateRole([FromBody] CreateRoleRequest request)
        {
            var role = await _roleService.CreateRoleAsync(request);
            return Ok(new { message = "Tạo Role thành công.", data = role });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_ROLES")]
        public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
        {
            var success = await _roleService.UpdateRoleAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy Role." });
            return Ok(new { message = "Cập nhật Role thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_ROLES")]
        public async Task<IActionResult> DeleteRole(int id)
        {
            try
            {
                var success = await _roleService.DeleteRoleAsync(id);
                if (!success) return NotFound(new { message = "Không tìm thấy Role." });
                return Ok(new { message = "Xóa Role thành công." });
            }
            catch (System.Exception ex)
            {
                // Bắt lỗi khóa ngoại hoặc lỗi logic và trả về HTTP 400
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("assign-permission")]
        [Authorize(Policy = "MANAGE_ROLES")]
        public async Task<IActionResult> AssignPermission([FromBody] AssignPermissionRequest request)
        {
            var success = await _roleService.AssignPermissionsAsync(request.RoleId, request.PermissionIds);
            if (!success) return BadRequest(new { message = "Lỗi khi gán quyền." });
            return Ok(new { message = "Phân quyền thành công." });
        }
    }
}
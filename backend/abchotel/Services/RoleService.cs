using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // Đọc Token
using System.Security.Claims;    // Đọc Claims
using abchotel.Data;
using abchotel.Models;
using abchotel.DTOs;

namespace abchotel.Services
{
    public interface IRoleService
    {
        Task<List<RoleResponse>> GetAllRolesAsync();
        Task<List<PermissionResponse>> GetAllPermissionsAsync(); 
        Task<RoleResponse> CreateRoleAsync(CreateRoleRequest request);
        Task<bool> UpdateRoleAsync(int id, UpdateRoleRequest request);
        Task<bool> DeleteRoleAsync(int id);
        Task<bool> AssignPermissionsAsync(int roleId, List<int> permissionIds);
    }

    public class RoleService : IRoleService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RoleService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        // HÀM LẤY TÊN NGƯỜI ĐANG THAO TÁC (Giống bên UserService)
        private async Task<string> GetCurrentUserNameAsync()
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId))
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.FullName ?? "Một quản trị viên";
            }
            return "Hệ thống";
        }

        public async Task<List<RoleResponse>> GetAllRolesAsync()
        {
            return await _context.Roles
                .Include(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .Select(r => new RoleResponse
                {
                    Id = r.Id,
                    Name = r.Name,
                    Description = r.Description,
                    Permissions = r.RolePermissions.Select(rp => rp.Permission.Name).ToList()
                }).ToListAsync();
        }

        public async Task<List<PermissionResponse>> GetAllPermissionsAsync()
        {
            return await _context.Permissions
                .Select(p => new PermissionResponse { Id = p.Id, Name = p.Name })
                .ToListAsync();
        }

        public async Task<RoleResponse> CreateRoleAsync(CreateRoleRequest request)
        {
            var role = new Role { Name = request.Name, Description = request.Description };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            
            // BẮN THÔNG BÁO CHO NHỮNG AI CÓ QUYỀN MANAGE_ROLES
            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_ROLES", 
                "Vai trò mới", 
                $"Quản trị viên [{currentUserName}] vừa tạo chức vụ mới: {role.Name}."
            );

            return new RoleResponse 
            { 
                Id = role.Id, 
                Name = role.Name, 
                Description = role.Description,
                Permissions = new List<string>() 
            };
        }

        public async Task<bool> UpdateRoleAsync(int id, UpdateRoleRequest request)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return false;

            role.Name = request.Name;
            role.Description = request.Description;
            await _context.SaveChangesAsync();

            // BẮN THÔNG BÁO
            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_ROLES", 
                "Cập nhật Vai trò", 
                $"Quản trị viên [{currentUserName}] vừa cập nhật thông tin chức vụ {role.Name}."
            );

            return true;
        }

        public async Task<bool> DeleteRoleAsync(int id)
        {
            var role = await _context.Roles
                .Include(r => r.RolePermissions)
                .Include(r => r.Users)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (role == null) return false;

            if (role.Users != null && role.Users.Any())
            {
                throw new System.Exception($"Không thể xóa! Đang có {role.Users.Count} nhân viên giữ chức vụ này.");
            }

            if (role.RolePermissions != null && role.RolePermissions.Any())
            {
                _context.RolePermissions.RemoveRange(role.RolePermissions);
            }

            string roleName = role.Name; // Lưu tên lại trước khi xóa để báo chuông
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();

            // BẮN THÔNG BÁO
            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_ROLES", 
                "Xóa Vai trò", 
                $"Quản trị viên [{currentUserName}] vừa xóa chức vụ: {roleName}."
            );

            return true;
        }

        public async Task<bool> AssignPermissionsAsync(int roleId, List<int> permissionIds)
        {
            var role = await _context.Roles.Include(r => r.RolePermissions).FirstOrDefaultAsync(r => r.Id == roleId);
            if (role == null) return false;

            _context.RolePermissions.RemoveRange(role.RolePermissions);

            var newPermissions = permissionIds.Select(pId => new RolePermission
            {
                RoleId = roleId,
                PermissionId = pId
            }).ToList();

            _context.RolePermissions.AddRange(newPermissions);
            await _context.SaveChangesAsync();

            // BẮN THÔNG BÁO
            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_ROLES", 
                "Cập nhật Phân quyền", 
                $"Quản trị viên [{currentUserName}] vừa thay đổi bộ quyền hạn của chức vụ {role.Name}."
            );

            return true;
        }
    }
}
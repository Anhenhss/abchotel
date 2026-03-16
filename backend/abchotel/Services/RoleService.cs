using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.Models;
using abchotel.DTOs;

namespace abchotel.Services
{
    public interface IRoleService
    {
        Task<List<Role>> GetAllRolesAsync();
        Task<Role> CreateRoleAsync(CreateRoleRequest request);
        Task<Role> UpdateRoleAsync(int id, UpdateRoleRequest request);
        Task<bool> DeleteRoleAsync(int id);
        Task<bool> AssignPermissionsAsync(int roleId, List<int> permissionIds);
    }

    public class RoleService : IRoleService
    {
        private readonly HotelDbContext _context;

        public RoleService(HotelDbContext context)
        {
            _context = context;
        }

        public async Task<List<Role>> GetAllRolesAsync()
        {
            return await _context.Roles.ToListAsync();
        }

        public async Task<Role> CreateRoleAsync(CreateRoleRequest request)
        {
            var role = new Role { Name = request.Name, Description = request.Description };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            return role;
        }

        public async Task<Role> UpdateRoleAsync(int id, UpdateRoleRequest request)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return null;

            role.Name = request.Name;
            role.Description = request.Description;
            await _context.SaveChangesAsync();
            return role;
        }

        public async Task<bool> DeleteRoleAsync(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return false;

            // Chú ý: Vì DB hiện tại bảng Roles không có is_active nên ta dùng Hard Delete.
            // Nếu muốn Soft Delete, em cần thêm cột is_active vào bảng Roles trong SQL.
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
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
            return true;
        }
    }
}
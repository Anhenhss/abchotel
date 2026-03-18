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

        public RoleService(HotelDbContext context)
        {
            _context = context;
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
            // Trả về danh sách tất cả các quyền cho Frontend vẽ Checkbox
            return await _context.Permissions
                .Select(p => new PermissionResponse
                {
                    Id = p.Id,
                    Name = p.Name
                }).ToListAsync();
        }

        public async Task<RoleResponse> CreateRoleAsync(CreateRoleRequest request)
        {
            var role = new Role { Name = request.Name, Description = request.Description };
            _context.Roles.Add(role);
            await _context.SaveChangesAsync();
            
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
            return true;
        }

        public async Task<bool> DeleteRoleAsync(int id)
        {
            var role = await _context.Roles.FindAsync(id);
            if (role == null) return false;

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
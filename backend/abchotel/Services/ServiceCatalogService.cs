using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IServiceCatalogService
    {
        // Category
        Task<List<ServiceCategoryResponse>> GetCategoriesAsync();
        Task<(bool IsSuccess, string Message)> CreateCategoryAsync(ServiceCategoryRequest request);
        Task<(bool IsSuccess, string Message)> UpdateCategoryAsync(int id, ServiceCategoryRequest request);
        Task<bool> DeleteCategoryAsync(int id);

        // Service
        Task<List<ServiceResponse>> GetServicesAsync(bool onlyActive = false);
        Task<(bool IsSuccess, string Message)> CreateServiceAsync(CreateServiceRequest request);
        Task<(bool IsSuccess, string Message)> UpdateServiceAsync(int id, UpdateServiceRequest request);
        Task<bool> ToggleServiceStatusAsync(int id);
    }

    public class ServiceCatalogService : IServiceCatalogService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ServiceCatalogService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        private async Task<string> GetCurrentUserNameAsync()
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId))
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.FullName ?? "Quản trị viên";
            }
            return "Hệ thống";
        }

        // ================= CATEGORIES =================
        public async Task<List<ServiceCategoryResponse>> GetCategoriesAsync()
        {
            return await _context.ServiceCategories.OrderBy(c => c.Name).Select(c => new ServiceCategoryResponse
            {
                Id = c.Id,
                Name = c.Name
            }).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> CreateCategoryAsync(ServiceCategoryRequest request)
        {
            if (await _context.ServiceCategories.AnyAsync(c => c.Name.ToLower() == request.Name.ToLower()))
                return (false, "Tên danh mục này đã tồn tại.");

            var category = new ServiceCategory { Name = request.Name, CreatedAt = DateTime.Now };
            _context.ServiceCategories.Add(category);
            await _context.SaveChangesAsync();
            return (true, "Tạo danh mục thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> UpdateCategoryAsync(int id, ServiceCategoryRequest request)
        {
            var cat = await _context.ServiceCategories.FindAsync(id);
            if (cat == null) return (false, "Không tìm thấy danh mục.");

            if (await _context.ServiceCategories.AnyAsync(c => c.Id != id && c.Name.ToLower() == request.Name.ToLower()))
                return (false, "Tên danh mục này đã tồn tại.");

            cat.Name = request.Name;
            cat.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();
            return (true, "Cập nhật thành công.");
        }

        public async Task<bool> DeleteCategoryAsync(int id)
        {
            var cat = await _context.ServiceCategories.Include(c => c.Services).FirstOrDefaultAsync(c => c.Id == id);
            if (cat == null) return false;
            
            // Không cho xóa nếu đang chứa dịch vụ
            if (cat.Services.Any()) throw new Exception("Không thể xóa danh mục đang có chứa dịch vụ bên trong.");

            _context.ServiceCategories.Remove(cat);
            await _context.SaveChangesAsync();
            return true;
        }

        // ================= SERVICES =================
        public async Task<List<ServiceResponse>> GetServicesAsync(bool onlyActive = false)
        {
            var query = _context.Services.Include(s => s.Category).AsQueryable();
            if (onlyActive) query = query.Where(s => s.IsActive);

            return await query.OrderBy(s => s.CategoryId).ThenBy(s => s.Name).Select(s => new ServiceResponse
            {
                Id = s.Id,
                CategoryId = s.CategoryId,
                CategoryName = s.Category != null ? s.Category.Name : "Khác",
                Name = s.Name,
                Price = s.Price,
                Unit = s.Unit,
                IsActive = s.IsActive
            }).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> CreateServiceAsync(CreateServiceRequest request)
        {
            var service = new Service
            {
                CategoryId = request.CategoryId,
                Name = request.Name,
                Price = request.Price,
                Unit = request.Unit,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Services.Add(service);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_SERVICES", "Dịch vụ mới", $"[{userName}] vừa thêm dịch vụ: {service.Name}.");

            return (true, "Thêm dịch vụ thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> UpdateServiceAsync(int id, UpdateServiceRequest request)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null) return (false, "Không tìm thấy dịch vụ.");

            service.CategoryId = request.CategoryId;
            service.Name = request.Name;
            service.Price = request.Price;
            service.Unit = request.Unit;
            service.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_SERVICES", "Cập nhật Dịch vụ", $"[{userName}] vừa cập nhật thông tin dịch vụ: {service.Name}.");

            return (true, "Cập nhật dịch vụ thành công.");
        }

        public async Task<bool> ToggleServiceStatusAsync(int id)
        {
            var service = await _context.Services.FindAsync(id);
            if (service == null) return false;

            service.IsActive = !service.IsActive;
            await _context.SaveChangesAsync();

            string statusStr = service.IsActive ? "mở lại" : "tạm ngưng";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_SERVICES", "Trạng thái Dịch vụ", $"[{userName}] vừa {statusStr} dịch vụ {service.Name}.");

            return true;
        }
    }
}
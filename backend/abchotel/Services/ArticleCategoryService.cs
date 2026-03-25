using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // Bắt buộc thêm để lấy Token
using System.Security.Claims;    // Bắt buộc thêm để lấy thông tin User
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IArticleCategoryService
    {
        Task<List<CategoryResponse>> GetAllCategoriesAsync(bool onlyActive = false);
        Task<CategoryResponse> GetCategoryByIdOrSlugAsync(string idOrSlug);
        Task<(bool IsSuccess, string Message, CategoryResponse Data)> CreateCategoryAsync(CreateCategoryRequest request);
        Task<bool> UpdateCategoryAsync(int id, UpdateCategoryRequest request);
        Task<bool> ToggleCategoryStatusAsync(int id);
    }

    public class ArticleCategoryService : IArticleCategoryService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        // 1. INJECT CÁC SERVICE CẦN THIẾT VÀO CONSTRUCTOR
        public ArticleCategoryService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        // 2. HÀM LẤY TÊN NGƯỜI ĐANG THAO TÁC (Tương tự các service khác)
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

        public async Task<List<CategoryResponse>> GetAllCategoriesAsync(bool onlyActive = false)
        {
            var query = _context.ArticleCategories.AsQueryable();
            
            if (onlyActive) query = query.Where(c => c.IsActive);

            return await query.Select(c => new CategoryResponse
            {
                Id = c.Id,
                Name = c.Name,
                Slug = c.Slug,
                Description = c.Description,
                IsActive = c.IsActive
            }).ToListAsync();
        }

        public async Task<CategoryResponse> GetCategoryByIdOrSlugAsync(string idOrSlug)
        {
            ArticleCategory category;
            
            if (int.TryParse(idOrSlug, out int id))
            {
                category = await _context.ArticleCategories.FindAsync(id);
            }
            else
            {
                category = await _context.ArticleCategories.FirstOrDefaultAsync(c => c.Slug == idOrSlug);
            }

            if (category == null) return null;

            return new CategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                IsActive = category.IsActive
            };
        }

        public async Task<(bool IsSuccess, string Message, CategoryResponse Data)> CreateCategoryAsync(CreateCategoryRequest request)
        {
            if (await _context.ArticleCategories.AnyAsync(c => c.Name == request.Name))
                return (false, "Tên danh mục đã tồn tại.", null);

            var category = new ArticleCategory
            {
                Name = request.Name,
                Slug = GenerateSlug(request.Name),
                Description = request.Description,
                IsActive = true 
            };

            _context.ArticleCategories.Add(category);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO CHO QUẢN LÝ NỘI DUNG (MANAGE_CONTENT)
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Tạo Danh mục mới", 
                $"[{userName}] vừa tạo danh mục bài viết mới: {category.Name}."
            );

            var response = new CategoryResponse
            {
                Id = category.Id,
                Name = category.Name,
                Slug = category.Slug,
                Description = category.Description,
                IsActive = category.IsActive
            };

            return (true, "Tạo danh mục thành công.", response);
        }

        public async Task<bool> UpdateCategoryAsync(int id, UpdateCategoryRequest request)
        {
            var category = await _context.ArticleCategories.FindAsync(id);
            if (category == null) return false;

            category.Name = request.Name;
            category.Slug = GenerateSlug(request.Name); 
            category.Description = request.Description;

            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO 
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Cập nhật Danh mục", 
                $"[{userName}] vừa chỉnh sửa thông tin danh mục: {category.Name}."
            );

            return true;
        }

        public async Task<bool> ToggleCategoryStatusAsync(int id)
        {
            var category = await _context.ArticleCategories.FindAsync(id);
            if (category == null) return false;

            category.IsActive = !category.IsActive; 
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO 
            string statusStr = category.IsActive ? "hiển thị" : "ẩn";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Trạng thái Danh mục", 
                $"[{userName}] vừa {statusStr} danh mục bài viết: {category.Name}."
            );

            return true;
        }

        private string GenerateSlug(string phrase)
        {
            string str = phrase.ToLower();
            str = Regex.Replace(str, @"á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ", "a");
            str = Regex.Replace(str, @"é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ", "e");
            str = Regex.Replace(str, @"i|í|ì|ỉ|ĩ|ị", "i");
            str = Regex.Replace(str, @"ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ", "o");
            str = Regex.Replace(str, @"ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự", "u");
            str = Regex.Replace(str, @"ý|ỳ|ỷ|ỹ|ỵ", "y");
            str = Regex.Replace(str, @"đ", "d");
            str = Regex.Replace(str, @"[^a-z0-9\s-]", ""); 
            str = Regex.Replace(str, @"\s+", " ").Trim(); 
            str = Regex.Replace(str, @"\s", "-"); 
            return str;
        }
    }
}
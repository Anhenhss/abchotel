using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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

        public ArticleCategoryService(HotelDbContext context)
        {
            _context = context;
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
            
            // Kiểm tra xem param truyền vào là ID (số) hay Slug (chuỗi)
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
                IsActive = true // Mặc định hiển thị khi tạo mới
            };

            _context.ArticleCategories.Add(category);
            await _context.SaveChangesAsync();

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
            category.Slug = GenerateSlug(request.Name); // Cập nhật lại Slug theo tên mới
            category.Description = request.Description;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleCategoryStatusAsync(int id)
        {
            var category = await _context.ArticleCategories.FindAsync(id);
            if (category == null) return false;

            category.IsActive = !category.IsActive; // Soft delete - Ẩn/Hiện
            await _context.SaveChangesAsync();
            return true;
        }

        // Helper: Hàm chuyển đổi Tiếng Việt có dấu thành Slug (Ví dụ: "Tin Tức" -> "tin-tuc")
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
            str = Regex.Replace(str, @"[^a-z0-9\s-]", ""); // Xóa ký tự đặc biệt
            str = Regex.Replace(str, @"\s+", " ").Trim(); // Xóa khoảng trắng thừa
            str = Regex.Replace(str, @"\s", "-"); // Thay khoảng trắng bằng gạch ngang
            return str;
        }
    }
}
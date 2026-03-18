using System;
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
    public interface IArticleService
    {
        Task<List<ArticleResponse>> GetAllArticlesAsync(bool onlyPublished = false, int? categoryId = null);
        Task<ArticleDetailResponse> GetArticleBySlugAsync(string slug);
        
        Task<(bool IsSuccess, string Message, int ArticleId)> CreateArticleAsync(int authorId, CreateArticleRequest request);
        Task<bool> UpdateArticleAsync(int id, UpdateArticleRequest request);
        Task<bool> ToggleSoftDeleteAsync(int id);
        Task<bool> TogglePublishStatusAsync(int id);
        Task<bool> UpdateThumbnailAsync(int id, string thumbnailUrl);
    }

    public class ArticleService : IArticleService
    {
        private readonly HotelDbContext _context;

        public ArticleService(HotelDbContext context) => _context = context;

        public async Task<List<ArticleResponse>> GetAllArticlesAsync(bool onlyPublished = false, int? categoryId = null)
        {
            var query = _context.Articles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .AsQueryable();

            if (onlyPublished)
            {
                query = query.Where(a => a.IsActive && a.PublishedAt != null);
            }

            // lọc theo danh mục
            if (categoryId.HasValue)
            {
                query = query.Where(a => a.CategoryId == categoryId.Value);
            }

            return await query.OrderByDescending(a => a.CreatedAt).Select(a => new ArticleResponse
            {
                Id = a.Id,
                Title = a.Title,
                Slug = a.Slug,
                ThumbnailUrl = a.ThumbnailUrl,
                CategoryName = a.Category != null ? a.Category.Name : "Không phân loại",
                AuthorName = a.Author != null ? a.Author.FullName : "Ẩn danh",
                PublishedAt = a.PublishedAt,
                ViewCount = a.ViewCount,
                IsActive = a.IsActive
            }).ToListAsync();
        }

        public async Task<ArticleDetailResponse> GetArticleBySlugAsync(string slug)
        {
            var article = await _context.Articles
                .Include(a => a.Category)
                .Include(a => a.Author)
                .FirstOrDefaultAsync(a => a.Slug == slug);

            if (article == null) return null;

            // Tăng lượt xem mỗi khi có người đọc bài
            article.ViewCount += 1;
            await _context.SaveChangesAsync();

            return new ArticleDetailResponse
            {
                Id = article.Id,
                Title = article.Title,
                Slug = article.Slug,
                ThumbnailUrl = article.ThumbnailUrl,
                Content = article.Content,
                ShortDescription = article.ShortDescription,
                MetaTitle = article.MetaTitle,
                MetaDescription = article.MetaDescription,
                CategoryName = article.Category?.Name,
                AuthorName = article.Author?.FullName,
                PublishedAt = article.PublishedAt,
                ViewCount = article.ViewCount,
                IsActive = article.IsActive
            };
        }

        public async Task<(bool IsSuccess, string Message, int ArticleId)> CreateArticleAsync(int authorId, CreateArticleRequest request)
        {
            var baseSlug = GenerateSlug(request.Title);
            var uniqueSlug = baseSlug;
            int counter = 1;

            // Chống trùng lặp Slug trong DB
            while (await _context.Articles.AnyAsync(a => a.Slug == uniqueSlug))
            {
                uniqueSlug = $"{baseSlug}-{counter}";
                counter++;
            }

            var article = new Article
            {
                CategoryId = request.CategoryId,
                AuthorId = authorId, // Lấy từ Token JWT, cực kỳ an toàn
                Title = request.Title,
                Slug = uniqueSlug,
                Content = request.Content,
                ShortDescription = request.ShortDescription,
                MetaTitle = string.IsNullOrEmpty(request.MetaTitle) ? request.Title : request.MetaTitle,
                MetaDescription = request.MetaDescription,
                CreatedAt = DateTime.Now,
                IsActive = true, // Mặc định hiển thị
                PublishedAt = null // Mặc định là Bản nháp (Draft), chưa xuất bản
            };

            _context.Articles.Add(article);
            await _context.SaveChangesAsync();

            return (true, "Tạo bài viết thành công (Bản nháp).", article.Id);
        }

        public async Task<bool> UpdateArticleAsync(int id, UpdateArticleRequest request)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return false;

            article.CategoryId = request.CategoryId;
            article.Title = request.Title;
            article.Content = request.Content;
            article.ShortDescription = request.ShortDescription;
            article.MetaTitle = request.MetaTitle;
            article.MetaDescription = request.MetaDescription;
            article.UpdatedAt = DateTime.Now;

            // Nếu đổi Title, có thể cân nhắc đổi luôn Slug (Tùy chiến lược SEO, tạm thời giữ nguyên để tránh gãy link cũ)
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return false;

            article.IsActive = !article.IsActive; // Ẩn/Hiện khỏi hệ thống
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> TogglePublishStatusAsync(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return false;

            // Chuyển đổi giữa Bản nháp (Null) và Đã xuất bản (DateTime.Now)
            if (article.PublishedAt == null)
                article.PublishedAt = DateTime.Now;
            else
                article.PublishedAt = null;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateThumbnailAsync(int id, string thumbnailUrl)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return false;

            article.ThumbnailUrl = thumbnailUrl;
            await _context.SaveChangesAsync();
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
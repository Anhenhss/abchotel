using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // Đọc Token
using System.Security.Claims;    // Đọc Claims
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
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        private readonly IMediaService _mediaService;

        public ArticleService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor, IMediaService mediaService)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
            _mediaService = mediaService;
        }

        // HÀM PHỤ TRỢ: Lấy tên người thao tác
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

            if (categoryId.HasValue)
            {
                query = query.Where(a => a.CategoryId == categoryId.Value);
            }

            return await query.OrderByDescending(a => a.CreatedAt).Select(a => new ArticleResponse
            {
                Id = a.Id,
                CategoryId = a.CategoryId,
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

            while (await _context.Articles.AnyAsync(a => a.Slug == uniqueSlug))
            {
                uniqueSlug = $"{baseSlug}-{counter}";
                counter++;
            }

            var article = new Article
            {
                CategoryId = request.CategoryId,
                AuthorId = authorId, 
                Title = request.Title,
                Slug = uniqueSlug,
                Content = request.Content,
                ShortDescription = request.ShortDescription,
                MetaTitle = string.IsNullOrEmpty(request.MetaTitle) ? request.Title : request.MetaTitle,
                MetaDescription = request.MetaDescription,
                CreatedAt = DateTime.Now,
                IsActive = true, 
                PublishedAt = null 
            };

            _context.Articles.Add(article);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO REALTIME
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Bài viết mới", 
                $"[{userName}] vừa tạo bản nháp bài viết: \"{article.Title}\"."
            );

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

            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Cập nhật Bài viết", 
                $"[{userName}] vừa cập nhật nội dung bài viết: \"{article.Title}\"."
            );

            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return false;

            article.IsActive = !article.IsActive; 
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string statusStr = article.IsActive ? "phục hồi" : "thùng rác";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Trạng thái Bài viết", 
                $"[{userName}] vừa đưa bài viết \"{article.Title}\" vào {statusStr}."
            );

            return true;
        }

        public async Task<bool> TogglePublishStatusAsync(int id)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return false;

            if (article.PublishedAt == null)
                article.PublishedAt = DateTime.Now;
            else
                article.PublishedAt = null;

            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string pubStr = article.PublishedAt != null ? "xuất bản" : "hủy xuất bản";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Xuất bản Bài viết", 
                $"[{userName}] vừa {pubStr} bài viết: \"{article.Title}\"."
            );

            return true;
        }

        public async Task<bool> UpdateThumbnailAsync(int id, string thumbnailUrl)
        {
            var article = await _context.Articles.FindAsync(id);
            if (article == null) return false;

            // XỬ LÝ DỌN RÁC CLOUDINARY
            string oldUrl = article.ThumbnailUrl;
            if (!string.IsNullOrEmpty(oldUrl) && oldUrl.Contains("cloudinary.com"))
            {
                try
                {
                    string publicId = _mediaService.ExtractPublicIdFromUrl(oldUrl);
                    if (!string.IsNullOrEmpty(publicId))
                    {
                        await _mediaService.DeleteImageAsync(publicId);
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Lỗi dọn rác Cloudinary (Bài viết): " + ex.Message);
                }
            }

            // LƯU ẢNH MỚI VÀO DB
            article.ThumbnailUrl = thumbnailUrl;
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Cập nhật Ảnh bìa", 
                $"[{userName}] vừa thay đổi ảnh bìa bài viết: \"{article.Title}\"."
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
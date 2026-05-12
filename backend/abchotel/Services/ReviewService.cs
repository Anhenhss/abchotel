using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // Bắt buộc để đọc Token
using System.Security.Claims;    // Bắt buộc để lấy User
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IReviewService
    {
        Task<List<ReviewResponse>> GetPublicReviewsByRoomTypeAsync(int roomTypeId);
        Task<List<ReviewResponse>> GetAllReviewsForAdminAsync(bool? isVisible = null);
        Task<(bool IsSuccess, string Message)> CreateReviewAsync(int userId, CreateReviewRequest request);
        Task<bool> ApproveReviewAsync(int id);
        Task<bool> ReplyToReviewAsync(int id, string replyComment);
        Task<bool> ToggleSoftDeleteAsync(int id);
        Task<List<ReviewResponse>> GetTopPublicReviewsAsync(int count);
    }

    public class ReviewService : IReviewService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public ReviewService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        // HÀM LẤY TÊN NGƯỜI THAO TÁC
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

        public async Task<List<ReviewResponse>> GetPublicReviewsByRoomTypeAsync(int roomTypeId)
        {
            return await _context.Reviews
                .Include(r => r.User)
                .Where(r => r.RoomTypeId == roomTypeId && r.IsVisible && r.IsActive)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new ReviewResponse
                {
                    Id = r.Id,
                    GuestName = r.User != null ? r.User.FullName : "Khách ẩn danh",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    ReplyComment = r.ReplyComment,
                    CreatedAt = r.CreatedAt
                }).ToListAsync();
        }

        public async Task<List<ReviewResponse>> GetAllReviewsForAdminAsync(bool? isVisible = null)
        {
            var query = _context.Reviews
                .Include(r => r.User)
                .Include(r => r.RoomType)
                .Where(r => r.IsActive)
                .AsQueryable();

            if (isVisible.HasValue)
            {
                query = query.Where(r => r.IsVisible == isVisible.Value);
            }

            return await query.OrderByDescending(r => r.CreatedAt).Select(r => new ReviewResponse
            {
                Id = r.Id,
                RoomTypeId = r.RoomTypeId,
                RoomTypeName = r.RoomType != null ? r.RoomType.Name : "N/A",
                GuestName = r.User != null ? r.User.FullName : "Khách ẩn danh",
                Rating = r.Rating,
                Comment = r.Comment,
                ReplyComment = r.ReplyComment,
                CreatedAt = r.CreatedAt,
                IsVisible = r.IsVisible,
                IsActive = r.IsActive
            }).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> CreateReviewAsync(int userId, CreateReviewRequest request)
        {
            // 1. Kiểm tra đơn đặt phòng có tồn tại và thuộc về khách này không
            var booking = await _context.Bookings
                .Include(b => b.BookingDetails)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId && b.UserId == userId);

            if (booking == null) return (false, "Không tìm thấy kỳ nghỉ của bạn.");
            
            // 2. Chặn đánh giá 2 lần (Chỉ cho phép 1 đơn = 1 đánh giá)
            bool alreadyReviewed = await _context.Reviews.AnyAsync(r => r.BookingId == request.BookingId);
            if (alreadyReviewed) return (false, "Bạn đã gửi đánh giá cho kỳ nghỉ này rồi. Xin cảm ơn!");

            // 3. Tự động tìm Loại phòng từ chi tiết Booking (Sửa lỗi "Loại phòng không tồn tại")
            var roomTypeId = booking.BookingDetails.FirstOrDefault()?.RoomTypeId;
            if (roomTypeId == null) return (false, "Không xác định được loại phòng đã lưu trú.");

            // 4. Lưu đánh giá vào Database
            var review = new Review
            {
                UserId = userId,
                RoomTypeId = roomTypeId.Value,
                BookingId = booking.Id,
                Rating = request.Rating,
                Comment = request.Comment,
                IsVisible = false, // Mặc định ẩn, chờ Admin duyệt mới được hiện lên web
                IsActive = true,
                CreatedAt = DateTime.Now
            };
            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // 5. 🔔 BẮN THÔNG BÁO REAL-TIME CHO ADMIN (LỄ TÂN)
            var user = await _context.Users.FindAsync(userId);
            string userName = user?.FullName ?? "Khách hàng";
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT", 
                "Đánh giá mới", 
                $"{userName} vừa gửi đánh giá {request.Rating} sao cho đơn {booking.BookingCode}."
            );

            return (true, "Gửi đánh giá thành công");
        }

        public async Task<bool> ApproveReviewAsync(int id)
        {
            var review = await _context.Reviews.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.Id == id);
            if (review == null) return false;

            review.IsVisible = true; // Phê duyệt hiển thị
            await _context.SaveChangesAsync();

            // 🔔 THÔNG BÁO ADMIN
            string userName = await GetCurrentUserNameAsync();
            string roomName = review.RoomType?.Name ?? "phòng";
            await _notificationService.SendToPermissionAsync("MANAGE_CONTENT", "Đã duyệt Đánh giá", $"[{userName}] vừa duyệt hiển thị một đánh giá của {roomName}.");

            return true;
        }

        public async Task<bool> ReplyToReviewAsync(int id, string replyComment)
        {
            var review = await _context.Reviews.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.Id == id);
            if (review == null) return false;

            review.ReplyComment = replyComment;
            await _context.SaveChangesAsync();

            // 🔔 THÔNG BÁO ADMIN
            string userName = await GetCurrentUserNameAsync();
            string roomName = review.RoomType?.Name ?? "phòng";
            await _notificationService.SendToPermissionAsync("MANAGE_CONTENT", "Đã trả lời Khách hàng", $"[{userName}] vừa phản hồi lại đánh giá của khách ở {roomName}.");

            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var review = await _context.Reviews.Include(r => r.RoomType).FirstOrDefaultAsync(r => r.Id == id);
            if (review == null) return false;

            review.IsActive = !review.IsActive; // Xóa mềm
            await _context.SaveChangesAsync();

            // 🔔 THÔNG BÁO ADMIN
            string action = review.IsActive ? "phục hồi" : "xóa bỏ";
            string userName = await GetCurrentUserNameAsync();
            string roomName = review.RoomType?.Name ?? "phòng";
            await _notificationService.SendToPermissionAsync("MANAGE_CONTENT", "Quản lý Đánh giá", $"[{userName}] vừa {action} một đánh giá rác ở {roomName}.");

            return true;
        }
        public async Task<List<ReviewResponse>> GetTopPublicReviewsAsync(int count)
        {
            // Chỉ lấy review Đã duyệt (IsVisible = true), Chưa bị xóa (IsActive = true) và từ 4 sao trở lên
            return await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.RoomType)
                .Where(r => r.IsVisible && r.IsActive && r.Rating >= 4)
                .OrderByDescending(r => r.Rating).ThenByDescending(r => r.CreatedAt)
                .Take(count)
                .Select(r => new ReviewResponse
                {
                    Id = r.Id,
                    GuestName = r.User != null ? r.User.FullName : "Khách ẩn danh",
                    RoomTypeName = r.RoomType != null ? r.RoomType.Name : "Khách sạn ABCHotel",
                    Rating = r.Rating,
                    Comment = r.Comment,
                    ReplyComment = r.ReplyComment,
                    CreatedAt = r.CreatedAt
                }).ToListAsync();
        }
    }
}
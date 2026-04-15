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
            if (request.Rating < 1 || request.Rating > 5)
                return (false, "Số sao đánh giá phải từ 1 đến 5.");

            var roomType = await _context.RoomTypes.FindAsync(request.RoomTypeId);
            if (roomType == null) return (false, "Loại phòng không tồn tại.");

            // LOGIC CHECK CỰC CHUẨN: 
            // 1. Booking này phải thuộc về User đang đăng nhập.
            // 2. Booking này phải có trạng thái "Completed".
            // 3. Trong Booking này phải có đặt đúng cái RoomTypeId đó.
            var hasStayed = await _context.BookingDetails
                .Include(bd => bd.Booking)
                .AnyAsync(bd => bd.BookingId == request.BookingId
                             && bd.Booking.UserId == userId
                             && bd.RoomTypeId == request.RoomTypeId
                             && bd.Booking.Status == "Completed");

            if (!hasStayed)
            {
                return (false, "Hệ thống từ chối: Bạn chỉ có thể đánh giá loại phòng này sau khi đã hoàn tất kỳ nghỉ tại khách sạn.");
            }

            var user = await _context.Users.FindAsync(userId);
            string guestName = user?.FullName ?? "Khách hàng";

            var review = new Review
            {
                UserId = userId,
                BookingId = request.BookingId,
                RoomTypeId = request.RoomTypeId,
                Rating = request.Rating,
                Comment = request.Comment,
                IsVisible = false, // Mặc định là ẨN, chờ Admin duyệt
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO CHO NHÓM CONTENT VÀO DUYỆT BÀI
            await _notificationService.SendToPermissionAsync(
                "MANAGE_CONTENT",
                "Có đánh giá mới chờ duyệt",
                $"[{guestName}] vừa đánh giá {request.Rating} sao cho loại phòng {roomType.Name}. Vui lòng kiểm duyệt."
            );

            return (true, "Gửi đánh giá thành công. Đánh giá của bạn đang chờ kiểm duyệt.");
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
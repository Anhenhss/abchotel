using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IReviewService
    {
        // Dành cho Khách hàng xem trên web (Chỉ lấy bài đã duyệt IsVisible = true)
        Task<List<ReviewResponse>> GetPublicReviewsByRoomTypeAsync(int roomTypeId);
        
        // Dành cho CMS Admin quản lý (Lấy tất cả, có thể lọc theo trạng thái duyệt)
        Task<List<ReviewResponse>> GetAllReviewsForAdminAsync(bool? isVisible = null);
        
        Task<(bool IsSuccess, string Message)> CreateReviewAsync(int userId, CreateReviewRequest request);
        Task<bool> ApproveReviewAsync(int id);
        Task<bool> ReplyToReviewAsync(int id, string replyComment);
        Task<bool> ToggleSoftDeleteAsync(int id);
    }

    public class ReviewService : IReviewService
    {
        private readonly HotelDbContext _context;

        public ReviewService(HotelDbContext context) => _context = context;

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

            var roomTypeExists = await _context.RoomTypes.AnyAsync(rt => rt.Id == request.RoomTypeId);
            if (!roomTypeExists) return (false, "Loại phòng không tồn tại.");

            // ==============================================================
            // BỔ SUNG LOGIC: CHỈ CHO PHÉP ĐÁNH GIÁ KHI ĐÃ ĐẶT VÀ Ở XONG
            // ==============================================================
            var hasStayed = await _context.BookingDetails
                .Include(bd => bd.Booking)
                .AnyAsync(bd => bd.Booking.UserId == userId 
                             && bd.RoomTypeId == request.RoomTypeId 
                             && bd.Booking.Status == "Completed"); // Chỉ duyệt những đơn đã hoàn tất (Check-out xong)

            if (!hasStayed)
            {
                return (false, "Hệ thống từ chối: Bạn chỉ có thể đánh giá loại phòng này sau khi đã đặt và hoàn tất kỳ nghỉ tại khách sạn.");
            }
            // ==============================================================

            var review = new Review
            {
                UserId = userId, // Trích xuất từ JWT, chống mạo danh
                RoomTypeId = request.RoomTypeId,
                Rating = request.Rating,
                Comment = request.Comment,
                IsVisible = false, // Mặc định là ẨN, chờ Admin duyệt mới được hiện lên web
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Reviews.Add(review);
            await _context.SaveChangesAsync();

            return (true, "Gửi đánh giá thành công. Đánh giá của bạn đang chờ kiểm duyệt.");
        }

        public async Task<bool> ApproveReviewAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return false;

            review.IsVisible = true; // Phê duyệt cho hiển thị
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ReplyToReviewAsync(int id, string replyComment)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return false;

            review.ReplyComment = replyComment;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var review = await _context.Reviews.FindAsync(id);
            if (review == null) return false;

            review.IsActive = !review.IsActive; // Xóa mềm (chặn spam)
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
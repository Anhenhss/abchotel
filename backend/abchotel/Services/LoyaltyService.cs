using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using abchotel.Data;
using abchotel.Models;
using abchotel.DTOs;

namespace abchotel.Services
{
    public interface ILoyaltyService
    {
        // 1. Xử lý sau khi khách thanh toán xong
        Task ProcessPaymentSuccessAsync(int invoiceId);

        // 2. Tính tiền giảm giá tự động theo Hạng
        Task<decimal> CalculateTierDiscountAsync(int userId, decimal totalRoomAmount);

        // 3. Kiểm tra và tính tiền khi khách muốn dùng điểm (Redeem)
        Task<(bool IsSuccess, string Message, decimal DiscountAmount)> ValidateAndRedeemPointsAsync(int userId, int pointsToRedeem, decimal invoiceTotal);
        // 4. Hàm lấy hồ sơ điểm thưởng
        Task<UserLoyaltyProfileResponse> GetUserProfileAsync(int userId);
    }

    public class LoyaltyService : ILoyaltyService
    {
        private readonly HotelDbContext _context;
        private readonly ILogger<LoyaltyService> _logger;

        public LoyaltyService(HotelDbContext context, ILogger<LoyaltyService> logger)
        {
            _context = context;
            _logger = logger;
        }

        // ==========================================
        // 1. TÍCH ĐIỂM & TỰ ĐỘNG NÂNG HẠNG (Chạy khi Invoice = "Paid")
        // ==========================================
        public async Task ProcessPaymentSuccessAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Booking)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            // Bỏ qua nếu hóa đơn chưa thanh toán hoặc khách vãng lai (không có UserId)
            if (invoice == null || invoice.Status != "Paid" || invoice.Booking?.UserId == null) return;

            var user = await _context.Users.FindAsync(invoice.Booking.UserId);
            if (user == null) return;

            // Cập nhật ngày hoạt động cuối cùng
            user.LastActivityDate = DateTime.Now;

            // A. CÔNG THỨC TÍCH ĐIỂM: 1 điểm / 10.000đ từ số tiền THANH TOÁN THỰC TẾ
            // Dùng Math.Floor để làm tròn xuống (Ví dụ: 99k được 9 điểm)
            int pointsEarned = (int)Math.Floor((invoice.FinalTotal ?? 0) / 10000m);

            if (pointsEarned > 0)
            {
                user.TotalPoints += pointsEarned;

                // Lưu lịch sử
                _context.PointHistories.Add(new PointHistory
                {
                    UserId = user.Id,
                    InvoiceId = invoice.Id,
                    PointsEarned = pointsEarned,
                    Description = $"Tích điểm từ hóa đơn #{invoice.Id}",
                    CreatedAt = DateTime.Now
                });
            }

            // B. TỰ ĐỘNG NÂNG HẠNG THÀNH VIÊN
            // Lấy hạng cao nhất mà số điểm hiện tại của user thỏa mãn
            var eligibleTier = await _context.Memberships
                .Where(m => m.MinPoints <= user.TotalPoints)
                .OrderByDescending(m => m.MinPoints)
                .FirstOrDefaultAsync();

            if (eligibleTier != null && user.MembershipId != eligibleTier.Id)
            {
                user.MembershipId = eligibleTier.Id;
                _logger.LogInformation($"User {user.Id} đã được tự động nâng lên hạng: {eligibleTier.TierName}");

                // Ở đây thực tế sẽ gọi hàm SendEmailAsync("Chúc mừng nâng hạng")
            }

            await _context.SaveChangesAsync();
        }

        // ==========================================
        // 2. LẤY PHẦN TRĂM GIẢM GIÁ TỰ ĐỘNG CỦA HẠNG
        // ==========================================
        public async Task<decimal> CalculateTierDiscountAsync(int userId, decimal totalRoomAmount)
        {
            var user = await _context.Users
                .Include(u => u.Membership)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user?.Membership?.DiscountPercent == null) return 0;

            // Bronze (0%), Silver (5%), Gold (10%)
            return totalRoomAmount * (user.Membership.DiscountPercent.Value / 100m);
        }

        // ==========================================
        // 3. XỬ LÝ TIÊU ĐIỂM (REDEEM POINTS) LÚC ĐẶT PHÒNG
        // ==========================================
        public async Task<(bool IsSuccess, string Message, decimal DiscountAmount)> ValidateAndRedeemPointsAsync(int userId, int pointsToRedeem, decimal invoiceTotal)
        {
            if (pointsToRedeem <= 0) return (false, "Số điểm muốn đổi không hợp lệ.", 0);

            var user = await _context.Users.FindAsync(userId);
            if (user == null || user.TotalPoints < pointsToRedeem)
            {
                return (false, "Bạn không có đủ điểm tích lũy.", 0);
            }

            // Theo tài liệu: Quy đổi điểm thành tiền (VD: 100 điểm = 10.000₫ -> 1 điểm = 100đ)
            decimal discountFromPoints = pointsToRedeem * 100m;

            // Kiểm tra ràng buộc: Tối đa % hóa đơn được thanh toán bằng điểm (VD: <= 30%)
            decimal maxAllowedDiscount = invoiceTotal * 0.30m;

            if (discountFromPoints > maxAllowedDiscount)
            {
                return (false, $"Bạn chỉ được dùng điểm thanh toán tối đa 30% giá trị đơn hàng ({maxAllowedDiscount:N0}đ).", 0);
            }

            return (true, "Đổi điểm thành công!", discountFromPoints);
        }
        // 4. LẤY HỒ SƠ ĐIỂM
        public async Task<UserLoyaltyProfileResponse> GetUserProfileAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Membership)
                .Include(u => u.PointHistories)
                .FirstOrDefaultAsync(u => u.Id == userId);

            // Nếu không có user, ném về null để Controller biết đường báo lỗi 404
            if (user == null) return null;

            var response = new UserLoyaltyProfileResponse
            {
                TotalPoints = user.TotalPoints,
                TierName = user.Membership?.TierName ?? "Khách Mới",
                TierDiscountPercent = user.Membership?.DiscountPercent ?? 0,
                
                // Lấy 10 biến động điểm gần nhất
                History = user.PointHistories
                    .OrderByDescending(h => h.CreatedAt)
                    .Take(10)
                    .Select(h => new PointHistoryDto
                    {
                        PointsEarned = h.PointsEarned,
                        PointsRedeemed = h.PointsRedeemed,
                        PointsExpired = h.PointsExpired,
                        Description = h.Description,
                        CreatedAt = h.CreatedAt ?? DateTime.Now
                    }).ToList()
            };

            return response;
        }
    }
}
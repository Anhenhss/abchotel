using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.DTOs;

namespace abchotel.Services
{
    public interface IDashboardService
    {
        Task<DashboardResponse> GetDashboardDataAsync();
    }

    public class DashboardService : IDashboardService
    {
        private readonly HotelDbContext _context;

        public DashboardService(HotelDbContext context)
        {
            _context = context;
        }

        public async Task<DashboardResponse> GetDashboardDataAsync()
        {
            var response = new DashboardResponse();
            var today = DateTime.Today;
            var startOfMonth = new DateTime(today.Year, today.Month, 1);

            // 1. LẤY THỐNG KÊ (STATS)
            response.Stats.Revenue = await _context.Invoices
                .Include(i => i.Booking)
                .Where(i => i.CreatedAt >= startOfMonth && (i.Status == "Paid" || i.Booking.Status == "CheckedOut"))
                .SumAsync(i => i.FinalTotal ?? 0);

            response.Stats.NewBookings = await _context.Bookings
                .CountAsync(b => b.CreatedAt >= today);

            response.Stats.PendingIssues = await _context.LossAndDamages
                .CountAsync(ld => ld.Status == "Pending");

            // 2. LẤY TRẠNG THÁI PHÒNG (ROOM STATUS)
            var rooms = await _context.Rooms.ToListAsync();
            response.RoomStatus.Total = rooms.Count;
            response.RoomStatus.Available = rooms.Count(r => r.Status == "Available" || r.Status == "Trống");
            response.RoomStatus.Occupied = rooms.Count(r => r.Status == "Occupied" || r.Status == "Đang thuê");
            response.RoomStatus.Cleaning = rooms.Count(r => r.Status == "Cleaning" || r.Status == "Đang dọn");
            response.RoomStatus.Maintenance = rooms.Count(r => r.Status == "Maintenance" || r.Status == "Bảo trì");
            
            response.Stats.AvailableRooms = response.RoomStatus.Available;

            // 3. LẤY 5 ĐẶT PHÒNG GẦN NHẤT (CẬP NHẬT LOGIC TÍNH GIỜ/ĐÊM)
            var recentBookings = await _context.BookingDetails
                .Include(bd => bd.Booking).ThenInclude(b => b.User)
                .Include(bd => bd.Room)
                .OrderByDescending(bd => bd.CreatedAt) 
                .Take(5)
                .ToListAsync();

            foreach (var bd in recentBookings)
            {
                decimal calculatedAmount = 0;

                // 🔥 LOGIC MỚI: PHÂN BIỆT THEO GIỜ VÀ THEO ĐÊM
                if (bd.PriceType == "HOURLY")
                {
                    int hours = (int)Math.Ceiling((bd.CheckOutDate - bd.CheckInDate).TotalMinutes / 60.0);
                    if (hours <= 0) hours = 1;
                    calculatedAmount = bd.AppliedPrice * hours; // AppliedPrice bây giờ là Giá Theo Giờ
                }
                else 
                {
                    int nights = (bd.CheckOutDate.Date - bd.CheckInDate.Date).Days;
                    if (nights <= 0) nights = 1;
                    calculatedAmount = bd.AppliedPrice * nights; // AppliedPrice bây giờ là Giá Qua Đêm
                }

                response.RecentBookings.Add(new DashboardRecentBookingResponse
                {
                    Id = $"BK{bd.BookingId}",
                    Customer = bd.Booking?.User?.FullName ?? bd.Booking?.GuestName ?? "Khách vãng lai",
                    Room = bd.Room?.RoomNumber ?? "N/A",
                    Amount = calculatedAmount,
                    Status = bd.Booking?.Status ?? "Pending",
                    Date = bd.Booking?.CreatedAt ?? DateTime.Now
                });
            }

            // 4. NHẬT KÝ HOẠT ĐỘNG
            var recentIssues = await _context.LossAndDamages
                .Include(ld => ld.RoomInventory).ThenInclude(ri => ri.Room)
                .Include(ld => ld.RoomInventory).ThenInclude(ri => ri.Equipment)
                .OrderByDescending(ld => ld.CreatedAt)
                .Take(4)
                .ToListAsync();

            int actId = 1;
            foreach (var issue in recentIssues)
            {
                string actionStr = issue.IssueType == "Damaged" ? "Hư hỏng" : "Mất mát";
                string roomStr = issue.RoomInventory?.Room?.RoomNumber ?? "N/A";
                string equipStr = issue.RoomInventory?.Equipment?.Name ?? "vật tư";
                
                response.Activities.Add(new DashboardActivityResponse
                {
                    Id = actId++,
                    Time = issue.CreatedAt?.ToString("HH:mm dd/MM") ?? "",
                    Desc = $"Ghi nhận sự cố {actionStr} ({equipStr}) tại phòng {roomStr}",
                    Color = issue.Status == "Pending" ? "red" : "green"
                });
            }

            var recentReviews = await _context.Reviews
                .Include(r => r.User)
                .Include(r => r.RoomType)
                // CHỈ LẤY BÀI CHƯA DUYỆT (IsVisible == false) HOẶC CHƯA PHẢN HỒI (ReplyComment == null)
                .Where(r => r.IsVisible == false || r.ReplyComment == null) 
                .OrderByDescending(r => r.CreatedAt)
                .Take(5)
                .ToListAsync();

            foreach (var rv in recentReviews)
            {
                response.RecentReviews.Add(new DashboardReviewResponse
                {
                    Id = rv.Id,
                    CustomerName = rv.User?.FullName ?? "Khách ẩn danh",
                    RoomTypeName = rv.RoomType?.Name ?? "Phòng",
                    Rating = rv.Rating ?? 5,
                    Comment = rv.Comment ?? "Không có bình luận.",
                    Date = rv.CreatedAt ?? DateTime.Now
                });
            }

            return response;
        }
    }
}
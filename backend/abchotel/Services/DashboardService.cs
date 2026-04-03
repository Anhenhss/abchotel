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

            // ==========================================
            // 1. LẤY THỐNG KÊ (STATS)
            // ==========================================
            
            // 🔥 ĐÃ SỬA: Lấy Doanh thu từ bảng Invoice (Cột FinalTotal) thay vì bảng Booking
            response.Stats.Revenue = await _context.Invoices
                .Include(i => i.Booking)
                .Where(i => i.CreatedAt >= startOfMonth && (i.Status == "Paid" || i.Booking.Status == "CheckedOut"))
                .SumAsync(i => i.FinalTotal ?? 0);

            response.Stats.NewBookings = await _context.Bookings
                .CountAsync(b => b.CreatedAt >= today);

            response.Stats.PendingIssues = await _context.LossAndDamages
                .CountAsync(ld => ld.Status == "Pending");

            // ==========================================
            // 2. LẤY TRẠNG THÁI PHÒNG (ROOM STATUS)
            // ==========================================
            var rooms = await _context.Rooms.ToListAsync();
            response.RoomStatus.Total = rooms.Count;
            response.RoomStatus.Available = rooms.Count(r => r.Status == "Available" || r.Status == "Trống");
            response.RoomStatus.Occupied = rooms.Count(r => r.Status == "Occupied" || r.Status == "Đang thuê");
            response.RoomStatus.Cleaning = rooms.Count(r => r.Status == "Cleaning" || r.Status == "Đang dọn");
            response.RoomStatus.Maintenance = rooms.Count(r => r.Status == "Maintenance" || r.Status == "Bảo trì");
            
            response.Stats.AvailableRooms = response.RoomStatus.Available;

            // ==========================================
            // 3. LẤY 5 ĐẶT PHÒNG GẦN NHẤT
            // ==========================================
            var recentBookings = await _context.BookingDetails
                .Include(bd => bd.Booking).ThenInclude(b => b.User)
                .Include(bd => bd.Room)
                .OrderByDescending(bd => bd.CreatedAt) // Sắp xếp theo ngày tạo chi tiết
                .Take(5)
                .ToListAsync();

            foreach (var bd in recentBookings)
            {
                // 🔥 ĐÃ SỬA: Tính tổng tiền phòng = Giá mỗi đêm * Số đêm
                int nights = (bd.CheckOutDate.Date - bd.CheckInDate.Date).Days;
                if (nights <= 0) nights = 1; // Đảm bảo ít nhất là 1 đêm nếu đi về trong ngày
                decimal calculatedAmount = bd.PricePerNight * nights;

                response.RecentBookings.Add(new DashboardRecentBookingResponse
                {
                    Id = $"BK{bd.BookingId}",
                    Customer = bd.Booking?.User?.FullName ?? bd.Booking?.GuestName ?? "Khách vãng lai",
                    Room = bd.Room?.RoomNumber ?? "N/A",
                    Amount = calculatedAmount, // Dùng số tiền vừa tính
                    Status = bd.Booking?.Status ?? "Pending",
                    Date = bd.Booking?.CreatedAt ?? DateTime.Now
                });
            }

            // ==========================================
            // 4. NHẬT KÝ HOẠT ĐỘNG
            // ==========================================
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

            return response;
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.Models;
using System.Text.Json.Nodes; // THÊM THƯ VIỆN NÀY ĐỂ BÓC TÁCH JSON LOG

namespace abchotel.Services
{
    public interface IDashboardService
    {
        Task<string> GetDashboardConfigAsync(int roleId);

        // --- NHÓM CHỈ SỐ STATISTIC CARDS ---
        Task<object> GetRevenueStatsAsync();          
        Task<object> GetNewBookingsCountAsync();      
        Task<object> GetArticleCountAsync();          
        Task<object> GetInventoryCountAsync();        
        Task<object> GetDamagedItemsCountAsync();     
        Task<object> GetUserCountAsync();             
        Task<object> GetAvailableRoomsCountAsync();   
        Task<object> GetPendingIssuesCountAsync();    

        // --- NHÓM CẢNH BÁO QUẢN TRỊ (ACTIONABLE) ---
        Task<object> GetAdminAlertsAsync();           

        // --- NHÓM BIỂU ĐỒ (CHARTS) ---
        Task<object> GetRevenueChartAsync();          
        Task<object> GetRoomStatusPieAsync();         
        Task<object> GetInventoryPieAsync();          
        Task<object> GetRoleMembershipDistAsync();    
        Task<object> GetRevenueByMethodPieAsync();    

        // --- NHÓM BẢNG & FEED (TABLES & ACTIVITY) ---
        Task<object> GetRecentBookingsTableAsync();   
        Task<object> GetTodayCheckInTableAsync();     
        Task<object> GetSystemLogsAsync();            
        Task<object> GetCleaningQueueTableAsync();    
        Task<object> GetMaintenanceListAsync();       
        Task<object> GetLiveServiceOrdersTableAsync();
    }

    public class DashboardService : IDashboardService
    {
        private readonly HotelDbContext _context;

        public DashboardService(HotelDbContext context)
        {
            _context = context;
        }

        public async Task<string> GetDashboardConfigAsync(int roleId)
        {
            var config = await _context.RoleDashboards
                .AsNoTracking()
                .Where(r => r.RoleId == roleId && r.IsActive)
                .Select(r => r.LayoutConfig)
                .FirstOrDefaultAsync();
            return config ?? "{}";
        }

        // =========================================================================
        // 1. CÁC CHỈ SỐ TỔNG QUÁT (STATISTICS)
        // =========================================================================

        public async Task<object> GetRevenueStatsAsync()
        {
            var now = DateTime.Now;
            var totalRevenue = await _context.Invoices
                // Đã xóa điều kiện i.CreatedAt.Value.Month == now.Month
                .Where(i => i.Status == "Paid" && i.CreatedAt.HasValue && i.CreatedAt.Value.Year == now.Year)
                .SumAsync(i => i.FinalTotal);
                
            return new { value = totalRevenue, unit = "VNĐ", trend = "Năm nay" };
        }

        public async Task<object> GetNewBookingsCountAsync()
        {
            var count = await _context.Bookings.AsNoTracking().CountAsync(b => b.CreatedAt >= DateTime.Today);
            return new { value = count };
        }

        public async Task<object> GetArticleCountAsync()
        {
            var count = await _context.Articles.AsNoTracking().CountAsync();
            return new { value = count };
        }

        public async Task<object> GetInventoryCountAsync()
        {
            var count = await _context.Equipments.AsNoTracking().SumAsync(e => e.InStockQuantity);
            return new { value = count };
        }

        public async Task<object> GetDamagedItemsCountAsync()
        {
            var count = await _context.Equipments.AsNoTracking().SumAsync(e => e.DamagedQuantity);
            return new { value = count };
        }

        public async Task<object> GetUserCountAsync()
        {
            var count = await _context.Users.AsNoTracking().CountAsync();
            return new { value = count };
        }

        public async Task<object> GetAvailableRoomsCountAsync()
        {
            var count = await _context.Rooms.AsNoTracking().CountAsync(r => r.Status == "Available" || r.Status == "Trống");
            return new { value = count };
        }

        public async Task<object> GetPendingIssuesCountAsync()
        {
            var count = await _context.LossAndDamages.AsNoTracking().CountAsync(ld => ld.Status == "PENDING" || ld.Status == "Pending");
            return new { value = count };
        }

        // =========================================================================
        // 2. TRUNG TÂM CẢNH BÁO (ACTIONABLE ALERTS)
        // =========================================================================

        public async Task<object> GetAdminAlertsAsync()
        {
            var lowInventory = await _context.Equipments.AsNoTracking().CountAsync(e => e.InStockQuantity <= 5);
            var unpaidInvoices = await _context.Invoices.AsNoTracking().CountAsync(i => i.Status == "Unpaid" || i.Status == "Pending");
            var unrepliedReviews = await _context.Reviews.AsNoTracking().CountAsync(r => string.IsNullOrEmpty(r.ReplyComment));
            var unpublishedArticles = await _context.Articles.AsNoTracking().CountAsync(a => a.PublishedAt == null);

            return new { lowInventory, unpaidInvoices, unrepliedReviews, unpublishedArticles };
        }

        // =========================================================================
        // 3. BIỂU ĐỒ VÀ PHÂN TÍCH (CHARTS)
        // =========================================================================

        public async Task<object> GetRevenueChartAsync()
        {
            var sevenDaysAgo = DateTime.Today.AddDays(-6);
            var rawData = await _context.Invoices.AsNoTracking()
                .Where(i => i.CreatedAt >= sevenDaysAgo && i.Status == "Paid")
                .Select(i => new { Date = (i.CreatedAt ?? DateTime.Today).Date, Amount = i.FinalTotal ?? 0 })
                .ToListAsync();

            return Enumerable.Range(0, 7)
                .Select(offset => sevenDaysAgo.AddDays(offset))
                .Select(date => new {
                    name = date.ToString("dd/MM"),
                    value = rawData.Where(d => d.Date == date).Sum(d => d.Amount)
                }).ToList();
        }

        public async Task<object> GetRoomStatusPieAsync()
        {
            return await _context.Rooms.AsNoTracking()
                .GroupBy(r => r.Status)
                .Select(g => new { name = g.Key, value = g.Count() })
                .ToListAsync();
        }

        public async Task<object> GetInventoryPieAsync()
        {
            var stats = await _context.Equipments.AsNoTracking()
                .GroupBy(e => 1)
                .Select(g => new {
                    InStock = g.Sum(x => x.InStockQuantity),
                    InUse = g.Sum(x => x.InUseQuantity),
                    Damaged = g.Sum(x => x.DamagedQuantity)
                }).FirstOrDefaultAsync();

            if (stats == null) return Array.Empty<object>();

            return new object[] {
                new { name = "Trong kho", value = stats.InStock ?? 0 },
                new { name = "Đang sử dụng", value = stats.InUse },
                new { name = "Báo hỏng", value = stats.Damaged }
            };
        }

        public async Task<object> GetRoleMembershipDistAsync()
        {
            return await _context.Users
                .Include(u => u.Membership)
                .Where(u => u.MembershipId != null && u.Membership != null)
                .GroupBy(u => u.Membership.TierName) 
                .Select(g => new { name = g.Key, value = g.Count() })
                .ToListAsync();
        }

        public async Task<object> GetRevenueByMethodPieAsync()
        {
            return await _context.Invoices.AsNoTracking()
                .Where(i => i.Status == "Paid")
                .GroupBy(i => i.Status) 
                .Select(g => new { name = "Tiền mặt/Chuyển khoản", value = g.Count() })
                .ToListAsync();
        }

        // =========================================================================
        // 4. NHẬT KÝ VÀ DANH SÁCH (LOGS & TABLES)
        // =========================================================================

        public async Task<object> GetRecentBookingsTableAsync()
        {
            return await _context.BookingDetails
                .Include(bd => bd.Booking).ThenInclude(b => b.User)
                .Include(bd => bd.Room)
                .AsNoTracking()
                .OrderByDescending(bd => bd.CreatedAt)
                .Take(10)
                .Select(bd => new {
                    id = bd.Booking.BookingCode ?? $"BK{bd.BookingId}",
                    name = bd.Booking.GuestName ?? (bd.Booking.User != null ? bd.Booking.User.FullName : "Khách vãng lai"),
                    info = bd.Room != null ? $"Phòng {bd.Room.RoomNumber}" : "Chưa xếp phòng",
                    status = bd.Booking.Status,
                    date = bd.Booking.CreatedAt
                }).ToListAsync();
        }

        public async Task<object> GetTodayCheckInTableAsync()
        {
            var today = DateTime.Today;
            return await _context.BookingDetails
                .Include(bd => bd.Booking)
                .Include(bd => bd.Room)
                .AsNoTracking()
                .Where(bd => bd.CheckInDate.Date == today)
                .Select(bd => new {
                    id = bd.Booking.BookingCode,
                    name = bd.Booking.GuestName ?? "Khách",
                    info = bd.Room != null ? $"Phòng {bd.Room.RoomNumber}" : "Chờ xếp",
                    status = bd.Booking.Status,
                    date = bd.CheckInDate
                }).ToListAsync();
        }

        // =========================================================================
        // 🔥 HÀM LOG ĐÃ ĐƯỢC FIX LỖI JSON - TRẢ VỀ CHUỖI ĐỌC ĐƯỢC
        // =========================================================================
        public async Task<object> GetSystemLogsAsync()
        {
            // 1. Kéo dữ liệu từ Db lên RAM (Để EF Core không bị lỗi Query)
            var rawLogs = await _context.AuditLogs
                .Include(a => a.User)
                .AsNoTracking()
                .OrderByDescending(a => a.CreatedAt)
                .Take(15)
                .ToListAsync();

            // 2. Bóc tách JSON trong bộ nhớ C#
            var processedLogs = rawLogs.Select(a => {
                string friendlyMessage = "Thực hiện hoạt động hệ thống";
                string finalActionType = a.LogType ?? "LOG"; // VD: CREATE, UPDATE...
                string entityTarget = "Dữ liệu";

                try {
                    // Dùng System.Text.Json.Nodes để parse JSON
                    var jsonNode = JsonNode.Parse(a.LogData);
                    if (jsonNode != null && jsonNode["Events"] is JsonArray eventsArray && eventsArray.Count > 0)
                    {
                        var firstEvent = eventsArray[0];
                        friendlyMessage = firstEvent["message"]?.ToString() ?? friendlyMessage;
                        finalActionType = firstEvent["actionType"]?.ToString() ?? finalActionType;
                        entityTarget = firstEvent["entityType"]?.ToString() ?? entityTarget;

                        // Nếu có nhiều thao tác gộp (như thêm 10 vật tư cùng lúc)
                        if (eventsArray.Count > 1) {
                            friendlyMessage = $"{friendlyMessage} (và {eventsArray.Count - 1} thao tác khác)";
                        }
                    }
                } 
                catch { 
                    // Nếu JSON bị lỗi, giữ nguyên chuỗi cũ hoặc bỏ qua
                    if (!a.LogData.Contains("{")) friendlyMessage = a.LogData;
                }

                // Cấu trúc trả về cho WidgetActivityFeed bên Frontend
                return new { 
                    id = a.Id, 
                    title = entityTarget,         // Bảng bị tác động (Rooms, Equipments...)
                    action = finalActionType,     // Lệnh cho UI biết vẽ icon gì (CREATE, UPDATE, DELETE)
                    desc = friendlyMessage,       // Câu chữ dễ hiểu (Đã fix lỗi JSON)
                    actor = a.User != null ? a.User.FullName : "Hệ thống", 
                    date = a.CreatedAt
                };
            }).ToList();

            return processedLogs;
        }

        public async Task<object> GetCleaningQueueTableAsync()
        {
            return await _context.Rooms
                .Include(r => r.RoomType)
                .AsNoTracking()
                .Where(r => r.Status == "Dirty" || r.Status == "Cleaning" || r.Status == "Bẩn" || r.Status == "Đang dọn")
                .OrderBy(r => r.Status)
                .Select(r => new {
                    id = r.Id.ToString(),
                    name = $"Phòng {r.RoomNumber}",
                    info = r.RoomType != null ? r.RoomType.Name : "Phòng",
                    status = r.Status,
                    date = DateTime.Now
                }).ToListAsync();
        }

        public async Task<object> GetMaintenanceListAsync()
        {
            return await _context.Equipments
                .AsNoTracking()
                .Where(e => e.DamagedQuantity > 0)
                .Select(e => new {
                    id = e.ItemCode,
                    name = e.Name,
                    info = $"Hỏng: {e.DamagedQuantity}",
                    status = "Cần sửa",
                    date = DateTime.Now
                }).ToListAsync();
        }

        public async Task<object> GetLiveServiceOrdersTableAsync()
        {
            return await _context.OrderServices
                .Include(os => os.BookingDetail)
                    .ThenInclude(bd => bd.Booking)
                .AsNoTracking()
                .Where(os => os.Status == "Pending" || os.Status == "PENDING")
                .OrderByDescending(os => os.CreatedAt)
                .Take(10)
                .Select(os => new {
                    id = $"ORD{os.Id}",
                    name = (os.BookingDetail != null && os.BookingDetail.Booking != null) 
                            ? (os.BookingDetail.Booking.GuestName ?? "Khách phòng") 
                            : "Khách",
                    info = $"Tổng: {os.TotalAmount}đ",
                    status = "Chờ giao",
                    date = os.CreatedAt
                }).ToListAsync();
        }
    }
}
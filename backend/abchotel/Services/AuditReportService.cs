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
    public interface IAuditReportService
    {
        // 🔥 Chữ ký phương thức phải có đủ 2 tham số (string, int)
        Task<List<AuditLogResponse>> GetSystemAuditLogsAsync(string? tableName = null, int top = 50);
        Task<object> GetStaffPerformanceReportAsync(DateTime? startDate = null, DateTime? endDate = null);
    }

    public class AuditReportService : IAuditReportService
    {
        private readonly HotelDbContext _context;
        public AuditReportService(HotelDbContext context) => _context = context;

        // 🔥 Cập nhật tham số ở đây để hết lỗi CS0535
        public async Task<List<AuditLogResponse>> GetSystemAuditLogsAsync(string? tableName = null, int top = 50)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            // Nếu người dùng có chọn lọc theo phân mục (Ví dụ: Bookings, Rooms...)
            if (!string.IsNullOrEmpty(tableName))
            {
                // Vì chúng ta dùng log_type để phân loại nên sẽ lọc theo LogType
                query = query.Where(a => a.LogType == tableName);
            }

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Take(top)
                .Select(a => new AuditLogResponse
                {
                    Id = a.Id,
                    PerformedBy = a.User != null ? a.User.FullName : "Hệ thống",
                    AvatarUrl = a.User != null ? a.User.AvatarUrl : null,
                    CreatedAt = a.CreatedAt,
                    LogType = a.LogType,
                    LogData = a.LogData // Trả về chuỗi JSON thô để Frontend tự parse
                })
                .ToListAsync();
        }

        public async Task<object> GetStaffPerformanceReportAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            var start = startDate ?? DateTime.Now.AddMonths(-1);
            var end = endDate ?? DateTime.Now;

            var performance = await _context.Users
                .Where(u => u.RoleId != 10 && u.IsActive == true)
                .Select(staff => new
                {
                    StaffId = staff.Id,
                    FullName = staff.FullName,
                    RoleName = staff.Role != null ? staff.Role.Name : "N/A",
                    TotalShifts = _context.Shifts.Count(s => s.UserId == staff.Id && s.CheckInTime >= start && s.CheckInTime <= end),
                    TotalBookingsHandled = _context.Bookings.Count(b => b.CreatedBy == staff.Id && b.CreatedAt >= start && b.CreatedAt <= end),
                    TotalRevenueGenerated = _context.Invoices
                        .Where(i => i.CreatedBy == staff.Id && i.Status == "Paid" && i.CreatedAt >= start && i.CreatedAt <= end)
                        .Sum(i => (decimal?)i.FinalTotal) ?? 0
                })
                .Where(report => report.TotalShifts > 0 || report.TotalBookingsHandled > 0)
                .OrderByDescending(report => report.TotalRevenueGenerated)
                .ToListAsync();

            return performance;
        }
    }
}
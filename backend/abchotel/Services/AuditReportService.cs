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
        Task<List<AuditLogResponse>> GetSystemAuditLogsAsync(string tableName = null, int top = 100);
        // Bổ sung tham số thời gian để lọc báo cáo
        Task<object> GetStaffPerformanceReportAsync(DateTime? startDate = null, DateTime? endDate = null);
    }

    public class AuditReportService : IAuditReportService
    {
        private readonly HotelDbContext _context;
        public AuditReportService(HotelDbContext context) => _context = context;

        public async Task<List<AuditLogResponse>> GetSystemAuditLogsAsync(string tableName = null, int top = 100)
        {
            var query = _context.AuditLogs
                .Include(a => a.User)
                .AsQueryable();

            if (!string.IsNullOrEmpty(tableName))
            {
                query = query.Where(a => a.TableName == tableName);
            }

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Take(top)
                .Select(a => new AuditLogResponse
                {
                    Id = a.Id,
                    Action = a.Action,
                    TableName = a.TableName,
                    RecordId = a.RecordId,
                    OldValue = a.OldValue,
                    NewValue = a.NewValue,
                    PerformedBy = a.User != null ? a.User.FullName : "System",
                    CreatedAt = a.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<object> GetStaffPerformanceReportAsync(DateTime? startDate = null, DateTime? endDate = null)
        {
            // Thiết lập mặc định là lấy dữ liệu của tháng hiện tại nếu Frontend không truyền ngày
            var start = startDate ?? new DateTime(DateTime.Now.Year, DateTime.Now.Month, 1);
            var end = endDate ?? start.AddMonths(1).AddTicks(-1);

            // Truy vấn trung tâm từ bảng Users (Chỉ lấy Nhân viên, bỏ qua Khách hàng Role = 10)
            var performance = await _context.Users
                .Where(u => u.RoleId != 10 && u.IsActive == true)
                .Select(staff => new
                {
                    StaffId = staff.Id,
                    FullName = staff.FullName,
                    RoleName = staff.Role != null ? staff.Role.Name : "N/A",
                    
                    // 1. Tính tổng số ca làm việc
                    TotalShifts = _context.Shifts
                        .Count(s => s.UserId == staff.Id && s.CheckInTime >= start && s.CheckInTime <= end),
                    
                    // 2. Tính tổng số Booking đã xử lý
                    TotalBookingsHandled = _context.Bookings
                        .Count(b => b.CreatedBy == staff.Id && b.CreatedAt >= start && b.CreatedAt <= end),
                    
                    // 3. Tính tổng doanh thu đem về từ các hóa đơn đã thanh toán
                    TotalRevenueGenerated = _context.Invoices
                        .Where(i => i.CreatedBy == staff.Id && i.Status == "Paid" && i.CreatedAt >= start && i.CreatedAt <= end)
                        .Sum(i => (decimal?)i.FinalTotal) ?? 0
                })
                .Where(report => report.TotalShifts > 0 || report.TotalBookingsHandled > 0) // Chỉ hiện nhân viên có hoạt động
                .OrderByDescending(report => report.TotalRevenueGenerated)
                .ThenByDescending(report => report.TotalBookingsHandled)
                .ToListAsync();

            return performance;
        }
    }
}
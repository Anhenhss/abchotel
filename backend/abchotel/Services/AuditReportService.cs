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
        Task<object> GetStaffPerformanceReportAsync();
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

        public async Task<object> GetStaffPerformanceReportAsync()
        {
            // Báo cáo hiệu suất giữ nguyên vì em viết logic rất tốt
            var performance = await _context.Shifts
                .Where(s => s.CheckOutTime != null)
                .Include(s => s.User)
                .GroupBy(s => new { s.UserId, s.User.FullName })
                .Select(g => new
                {
                    UserId = g.Key.UserId,
                    FullName = g.Key.FullName,
                    TotalShifts = g.Count(),
                    TotalHours = g.Sum(s => EF.Functions.DateDiffMinute(s.CheckInTime, s.CheckOutTime)) / 60.0
                })
                .OrderByDescending(p => p.TotalHours)
                .ToListAsync();

            return performance;
        }
    }
}
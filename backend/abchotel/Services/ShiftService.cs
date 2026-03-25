using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // Bắt buộc thêm để đọc Token
using System.Security.Claims;    // Bắt buộc thêm để lấy ID người dùng
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IShiftService
    {
        Task<(bool IsSuccess, string Message)> CheckInAsync(int userId);
        Task<(bool IsSuccess, string Message)> CheckOutAsync(int userId);
        Task<(bool IsSuccess, string Message)> HandoverAsync(int userId, string notes);
        Task<List<ShiftResponse>> GetShiftsAsync(DateTime? date, int? userId);
        Task<ShiftResponse> GetCurrentShiftAsync(int userId);
    }

    public class ShiftService : IShiftService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        // 1. CẬP NHẬT CONSTRUCTOR ĐỂ NHẬN DỊCH VỤ THÔNG BÁO
        public ShiftService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        // 2. HÀM PHỤ TRỢ LẤY TÊN NGƯỜI ĐANG THAO TÁC
        private async Task<string> GetCurrentUserNameAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            return user?.FullName ?? "Một nhân viên";
        }

        public async Task<(bool IsSuccess, string Message)> CheckInAsync(int userId)
        {
            var currentShift = await _context.Shifts
                .FirstOrDefaultAsync(s => s.UserId == userId && s.CheckOutTime == null);

            if (currentShift != null) return (false, "Bạn đang trong ca làm việc, chưa check-out.");

            var shift = new Shift
            {
                UserId = userId,
                CheckInTime = DateTime.Now
            };

            _context.Shifts.Add(shift);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO REALTIME CHO QUẢN LÝ
            string userName = await GetCurrentUserNameAsync(userId);
            await _notificationService.SendToPermissionAsync(
                "MANAGE_SHIFTS", 
                "Nhân viên Vào ca", 
                $"[{userName}] vừa Check-in bắt đầu ca làm việc lúc {shift.CheckInTime:HH:mm}."
            );

            return (true, "Điểm danh vào ca thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> CheckOutAsync(int userId)
        {
            var currentShift = await _context.Shifts
                .FirstOrDefaultAsync(s => s.UserId == userId && s.CheckOutTime == null);

            if (currentShift == null) return (false, "Bạn chưa check-in ca nào.");

            currentShift.CheckOutTime = DateTime.Now;
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO REALTIME CHO QUẢN LÝ
            string userName = await GetCurrentUserNameAsync(userId);
            await _notificationService.SendToPermissionAsync(
                "MANAGE_SHIFTS", 
                "Nhân viên Ra ca", 
                $"[{userName}] vừa Check-out kết thúc ca làm việc."
            );

            return (true, "Kết thúc ca làm việc thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> HandoverAsync(int userId, string notes)
        {
            var currentShift = await _context.Shifts
                .FirstOrDefaultAsync(s => s.UserId == userId && s.CheckOutTime == null);

            if (currentShift == null) return (false, "Bạn chưa check-in, không thể lập biên bản bàn giao.");

            currentShift.HandoverNotes = notes;
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO REALTIME CHO QUẢN LÝ
            string userName = await GetCurrentUserNameAsync(userId);
            await _notificationService.SendToPermissionAsync(
                "MANAGE_SHIFTS", 
                "Biên bản Bàn giao", 
                $"[{userName}] vừa lập biên bản bàn giao: \"{notes}\""
            );

            return (true, "Lập biên bản bàn giao ca thành công.");
        }

        public async Task<List<ShiftResponse>> GetShiftsAsync(DateTime? date, int? targetUserId)
        {
            var query = _context.Shifts.Include(s => s.User).AsQueryable();

            if (date.HasValue)
                query = query.Where(s => s.CheckInTime.Date == date.Value.Date);

            if (targetUserId.HasValue)
                query = query.Where(s => s.UserId == targetUserId.Value);

            return await query.OrderByDescending(s => s.CheckInTime).Select(s => new ShiftResponse
            {
                Id = s.Id,
                UserId = s.UserId,
                FullName = s.User.FullName,
                CheckInTime = s.CheckInTime,
                CheckOutTime = s.CheckOutTime,
                HandoverNotes = s.HandoverNotes,
                TotalHoursWorked = s.CheckOutTime.HasValue 
                    ? (s.CheckOutTime.Value - s.CheckInTime).TotalHours 
                    : null
            }).ToListAsync();
        }

        public async Task<ShiftResponse> GetCurrentShiftAsync(int userId)
        {
            var shift = await _context.Shifts.Include(s => s.User)
                .FirstOrDefaultAsync(s => s.UserId == userId && s.CheckOutTime == null);

            if (shift == null) return null;

            return new ShiftResponse
            {
                Id = shift.Id,
                UserId = shift.UserId,
                FullName = shift.User.FullName,
                CheckInTime = shift.CheckInTime,
                HandoverNotes = shift.HandoverNotes
            };
        }
    }
}
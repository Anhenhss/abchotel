using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IMembershipService
    {
        Task<List<MembershipResponse>> GetAllMembershipsAsync();
        Task<MembershipResponse> GetMembershipByIdAsync(int id);
        Task<(bool IsSuccess, string Message)> CreateMembershipAsync(CreateMembershipRequest request);
        Task<(bool IsSuccess, string Message)> UpdateMembershipAsync(int id, UpdateMembershipRequest request);
        Task<(bool IsSuccess, string Message)> DeleteMembershipAsync(int id);
    }

    public class MembershipService : IMembershipService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public MembershipService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

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

        public async Task<List<MembershipResponse>> GetAllMembershipsAsync()
        {
            return await _context.Memberships
                .Include(m => m.Users)
                .OrderBy(m => m.MinPoints)
                .Select(m => new MembershipResponse
                {
                    Id = m.Id,
                    TierName = m.TierName,
                    MinPoints = m.MinPoints ?? 0,
                    DiscountPercent = m.DiscountPercent ?? 0,
                    TotalUsers = m.Users.Count(u => u.IsActive && u.RoleId == 10) // Đếm số khách hàng (Guest)
                }).ToListAsync();
        }

        public async Task<MembershipResponse> GetMembershipByIdAsync(int id)
        {
            var m = await _context.Memberships.Include(x => x.Users).FirstOrDefaultAsync(x => x.Id == id);
            if (m == null) return null;

            return new MembershipResponse
            {
                Id = m.Id, TierName = m.TierName, MinPoints = m.MinPoints ?? 0,
                DiscountPercent = m.DiscountPercent ?? 0, TotalUsers = m.Users.Count(u => u.IsActive && u.RoleId == 10)
            };
        }

        public async Task<(bool IsSuccess, string Message)> CreateMembershipAsync(CreateMembershipRequest request)
        {
            // Ràng buộc: Tên hạng hoặc số điểm không được trùng lặp
            if (await _context.Memberships.AnyAsync(m => m.TierName.ToLower() == request.TierName.ToLower() || m.MinPoints == request.MinPoints))
                return (false, "Tên hạng thành viên hoặc Số điểm quy định đã tồn tại.");

            var membership = new Membership
            {
                TierName = request.TierName,
                MinPoints = request.MinPoints,
                DiscountPercent = request.DiscountPercent,
                CreatedAt = DateTime.Now
            };

            _context.Memberships.Add(membership);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_USERS", "Tạo Hạng Thành Viên", $"[{userName}] vừa tạo hạng thẻ mới: {membership.TierName}.");

            return (true, "Tạo hạng thành viên thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> UpdateMembershipAsync(int id, UpdateMembershipRequest request)
        {
            var membership = await _context.Memberships.FindAsync(id);
            if (membership == null) return (false, "Không tìm thấy hạng thành viên.");

            // Kiểm tra trùng lặp (trừ chính nó)
            if (await _context.Memberships.AnyAsync(m => m.Id != id && (m.TierName.ToLower() == request.TierName.ToLower() || m.MinPoints == request.MinPoints)))
                return (false, "Tên hạng thành viên hoặc Số điểm quy định đã tồn tại ở một hạng khác.");

            membership.TierName = request.TierName;
            membership.MinPoints = request.MinPoints;
            membership.DiscountPercent = request.DiscountPercent;
            membership.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_USERS", "Cập nhật Hạng Thành Viên", $"[{userName}] vừa cập nhật thông tin hạng: {membership.TierName}.");

            return (true, "Cập nhật thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> DeleteMembershipAsync(int id)
        {
            var membership = await _context.Memberships.Include(m => m.Users).FirstOrDefaultAsync(m => m.Id == id);
            if (membership == null) return (false, "Không tìm thấy hạng thành viên.");

            // Ràng buộc nghiệp vụ: Không cho xóa nếu đang có khách hàng mang hạng thẻ này
            if (membership.Users.Any())
                return (false, $"Không thể xóa! Đang có {membership.Users.Count} khách hàng thuộc hạng thẻ này. Vui lòng chuyển hạng cho họ trước.");

            _context.Memberships.Remove(membership);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_USERS", "Xóa Hạng Thành Viên", $"[{userName}] đã xóa hạng thẻ: {membership.TierName}.");

            return (true, "Đã xóa hạng thành viên thành công.");
        }
    }
}
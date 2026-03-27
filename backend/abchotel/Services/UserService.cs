using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // Bắt buộc thêm để đọc Token
using System.Security.Claims;    // Bắt buộc thêm để đọc Claims
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IUserService
    {
        Task<PaginatedUserResponse> GetUsersAsync(UserFilterRequest filter);
        Task<(bool IsSuccess, string Message)> CreateUserAsync(CreateUserRequest request);
        Task<bool> UpdateUserAsync(int id, UpdateUserRequest request);
        Task<bool> SoftDeleteUserAsync(int id);
        Task<bool> ChangeUserRoleAsync(int id, int newRoleId);
        Task<bool> ResetUserPasswordAsync(int id);
    }

    public class UserService : IUserService
    {
        private readonly HotelDbContext _context;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor; // Thêm biến này

        // Cập nhật Constructor
        public UserService(HotelDbContext context, IEmailService emailService, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _emailService = emailService;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        // ==========================================
        // HÀM PHỤ TRỢ: LẤY TÊN NGƯỜI ĐANG THAO TÁC
        // ==========================================
        private async Task<string> GetCurrentUserNameAsync()
        {
            // Đọc ID từ JWT Token của người đang thao tác
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId))
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.FullName ?? "Một quản trị viên";
            }
            return "Hệ thống";
        }

        public async Task<PaginatedUserResponse> GetUsersAsync(UserFilterRequest filter)
        {
            var query = _context.Users.Include(u => u.Role).AsQueryable();

            if (!string.IsNullOrEmpty(filter.Search))
            {
                query = query.Where(u => u.FullName.Contains(filter.Search) ||
                                         u.Email.Contains(filter.Search) ||
                                         u.Phone.Contains(filter.Search));
            }

            if (filter.RoleId.HasValue)
                query = query.Where(u => u.RoleId == filter.RoleId.Value);

            if (filter.IsActive.HasValue)
                query = query.Where(u => u.IsActive == filter.IsActive.Value);

            var totalItems = await query.CountAsync();

            var items = await query
                .OrderByDescending(u => u.Id)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(u => new UserResponse
                {
                    Id = u.Id,
                    FullName = u.FullName,
                    Email = u.Email,
                    Phone = u.Phone,
                    AvatarUrl = u.AvatarUrl,
                    RoleName = u.Role != null ? u.Role.Name : "Không xác định",
                    IsActive = u.IsActive
                }).ToListAsync();

            return new PaginatedUserResponse
            {
                Total = totalItems,
                Page = filter.Page,
                PageSize = filter.PageSize,
                Items = items
            };
        }

        public async Task<(bool IsSuccess, string Message)> CreateUserAsync(CreateUserRequest request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            {
                return (false, "Email này đã được sử dụng.");
            }

            // Tự sinh mật khẩu
            string rawPassword = "Abc@" + new Random().Next(1000, 9999).ToString();

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(rawPassword),
                RoleId = request.RoleId,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            // Gửi email
            string emailBody = $"<h3>Chào {user.FullName},</h3><p>Tài khoản của bạn đã được tạo.</p><p>Email: {user.Email}</p><p>Mật khẩu: <b>{rawPassword}</b></p>";
            await _emailService.SendEmailAsync(user.Email, "Tài khoản mới", emailBody);

            // Đẩy thông báo Realtime kèm tên người thao tác
            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_USERS",
                "Tài khoản mới",
                $"Quản lý [{currentUserName}] vừa tạo mới tài khoản cho nhân viên {user.FullName}.",
                "Success"
            );

            return (true, "Tạo người dùng thành công. Mật khẩu đã gửi qua mail.");
        }

        public async Task<bool> UpdateUserAsync(int id, UpdateUserRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            // CHẶN CHỈNH SỬA NẾU TÀI KHOẢN ĐANG BỊ KHÓA
            if (!user.IsActive) return false;

            user.FullName = request.FullName;
            user.Phone = request.Phone;
            user.AvatarUrl = request.AvatarUrl;

            await _context.SaveChangesAsync();

            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_USERS",
                "Cập nhật Hồ sơ",
                $"Quản lý [{currentUserName}] vừa chỉnh sửa thông tin của nhân viên {user.FullName}."
            );

            return true;
        }

        public async Task<bool> ChangeUserRoleAsync(int id, int newRoleId)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            // CHẶN ĐỔI CHỨC VỤ NẾU TÀI KHOẢN ĐANG BỊ KHÓA
            if (!user.IsActive) return false;

            user.RoleId = newRoleId;
            await _context.SaveChangesAsync();

            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_USERS",
                "Thay đổi Chức vụ",
                $"Quản lý [{currentUserName}] vừa đổi chức vụ của nhân viên {user.FullName}."
            );

            return true;
        }

        public async Task<bool> SoftDeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();

            // Đẩy thông báo Realtime
            string currentUserName = await GetCurrentUserNameAsync();
            string statusStr = user.IsActive ? "mở khóa" : "khóa";
            await _notificationService.SendToPermissionAsync(
                "MANAGE_USERS",
                "Cập nhật Trạng thái",
                $"Quản lý [{currentUserName}] vừa {statusStr} tài khoản của nhân viên {user.FullName}."
            );

            return true;
        }
        public async Task<bool> ResetUserPasswordAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null || !user.IsActive) return false;

            // Sinh mật khẩu ngẫu nhiên: Abc@ + 5 số ngẫu nhiên
            string newPassword = "Abc@" + new Random().Next(10000, 99999).ToString();
            
            // Băm mật khẩu (Hash)
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);

            await _context.SaveChangesAsync();

            // GỬI MẬT KHẨU MỚI QUA EMAIL BẰNG SMTP
            string emailBody = $@"
                <h3>Xin chào {user.FullName},</h3>
                <p>Quản trị viên vừa yêu cầu cấp lại mật khẩu đăng nhập hệ thống ABC Hotel cho bạn.</p>
                <p><b>Email đăng nhập:</b> {user.Email}</p>
                <p><b>Mật khẩu mới của bạn là:</b> <span style='color: #8A1538; font-size: 18px;'>{newPassword}</span></p>
                <p>Vui lòng đăng nhập và đổi lại mật khẩu của riêng bạn ngay lập tức để bảo đảm an toàn.</p>
                <br/><p>Trân trọng,<br/>Ban quản trị hệ thống ABC Hotel</p>";
                
            await _emailService.SendEmailAsync(user.Email, "Cấp lại mật khẩu - ABC Hotel", emailBody);

            // LƯU AUDIT LOG & ĐẨY THÔNG BÁO REALTIME
            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_USERS", 
                "Cấp lại mật khẩu", 
                $"Quản lý [{currentUserName}] vừa cấp lại mật khẩu mới cho nhân viên {user.FullName}."
            );

            return true;
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; 
using System.Security.Claims;    
using Microsoft.AspNetCore.SignalR; // Khai báo SignalR
using abchotel.Hubs;              // Khai báo Hub
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
        private readonly IHttpContextAccessor _httpContextAccessor;
        
        // 🔥 BỔ SUNG SIGNALR ĐỂ GỌI ĐÍCH DANH 1 USER
        private readonly IHubContext<NotificationHub> _hubContext;

        public UserService(HotelDbContext context, IEmailService emailService, INotificationService notificationService, IHttpContextAccessor httpContextAccessor, IHubContext<NotificationHub> hubContext)
        {
            _context = context;
            _emailService = emailService;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
            _hubContext = hubContext;
        }

        private async Task<string> GetCurrentUserNameAsync()
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId))
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.FullName ?? "Hệ thống";
            }
            return "Hệ thống";
        }

        public async Task<PaginatedUserResponse> GetUsersAsync(UserFilterRequest filter)
        {
            var query = _context.Users.Include(u => u.Role).AsQueryable();

            if (!string.IsNullOrEmpty(filter.Search))
            {
                var search = filter.Search.ToLower();
                query = query.Where(u => u.FullName.ToLower().Contains(search) || u.Email.ToLower().Contains(search) || (u.Phone != null && u.Phone.Contains(search)));
            }

            if (filter.RoleId.HasValue && filter.RoleId.Value > 0)
                query = query.Where(u => u.RoleId == filter.RoleId.Value);

            if (filter.IsActive.HasValue)
                query = query.Where(u => u.IsActive == filter.IsActive.Value);

            int totalRecords = await query.CountAsync();
            var users = await query.OrderByDescending(u => u.CreatedAt)
                                   .Skip((filter.Page - 1) * filter.PageSize)
                                   .Take(filter.PageSize)
                                   .Select(u => new UserResponse
                                   {
                                       Id = u.Id,
                                       FullName = u.FullName,
                                       Email = u.Email,
                                       Phone = u.Phone,
                                       AvatarUrl = u.AvatarUrl,
                                       RoleName = u.Role != null ? u.Role.Name : "",
                                       IsActive = u.IsActive
                                   })
                                   .ToListAsync();

            return new PaginatedUserResponse
            {
                Items = users,
                Total = totalRecords,
                Page = filter.Page,
                PageSize = filter.PageSize
            };
        }

        public async Task<(bool IsSuccess, string Message)> CreateUserAsync(CreateUserRequest request)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Email == request.Email);
            if (userExists) return (false, "Email đã tồn tại.");

            string newPassword = "Abc@" + new Random().Next(10000, 99999).ToString();
            var defaultMembership = await _context.Memberships.OrderBy(m => m.MinPoints).FirstOrDefaultAsync();
            
            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword),
                RoleId = request.RoleId != 0 ? request.RoleId : 10, 
                MembershipId = defaultMembership?.Id,
                TotalPoints = 0,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();

            string emailBody = $@"
                <h3>Xin chào {user.FullName},</h3>
                <p>Quản trị viên vừa tạo tài khoản hệ thống ABC Hotel cho bạn.</p>
                <p><b>Email đăng nhập:</b> {user.Email}</p>
                <p><b>Mật khẩu đăng nhập:</b> <span style='color: #8A1538; font-size: 18px;'>{newPassword}</span></p>
                <p>Vui lòng đăng nhập và đổi mật khẩu ngay để bảo đảm an toàn.</p>
                <br/><p>Trân trọng,<br/>Ban quản trị hệ thống ABC Hotel</p>";
                
            await _emailService.SendEmailAsync(user.Email, "Tài khoản nhân viên - ABC Hotel", emailBody);

            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_USERS",
                "Tài khoản mới",
                $"[{currentUserName}] vừa tạo tài khoản cho {user.FullName} ({user.Email})."
            );

            return (true, "Tạo tài khoản thành công. Mật khẩu đã được gửi qua email.");
        }

        public async Task<bool> UpdateUserAsync(int id, UpdateUserRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.FullName = request.FullName;
            if (request.Phone != null) user.Phone = request.Phone;
            if (request.AvatarUrl != null) user.AvatarUrl = request.AvatarUrl;
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SoftDeleteUserAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.IsActive = !user.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ChangeUserRoleAsync(int id, int newRoleId)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            var roleExists = await _context.Roles.AnyAsync(r => r.Id == newRoleId);
            if (!roleExists) return false;

            user.RoleId = newRoleId;
            
            // 🔥 KHÔNG LÀM MẤT TOKEN NỮA ĐỂ KHÁCH KHÔNG BỊ VĂNG
            // user.RefreshToken = null; 
            
            await _context.SaveChangesAsync();

            // 🔥 BẮN SIGNALR YÊU CẦU MÁY CON TỰ LÀM MỚI TOKEN (REALTIME ROLE)
            await _hubContext.Clients.User(id.ToString()).SendAsync("ForceTokenRefresh");

            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_USERS",
                "Thay đổi chức vụ",
                $"[{currentUserName}] vừa thay đổi chức vụ của {user.FullName}."
            );

            return true;
        }

        public async Task<bool> ResetUserPasswordAsync(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            string newPassword = "Abc@" + new Random().Next(10000, 99999).ToString();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _context.SaveChangesAsync();

            string emailBody = $@"
                <h3>Xin chào {user.FullName},</h3>
                <p>Quản trị viên vừa yêu cầu cấp lại mật khẩu đăng nhập hệ thống ABC Hotel cho bạn.</p>
                <p><b>Email đăng nhập:</b> {user.Email}</p>
                <p><b>Mật khẩu mới của bạn là:</b> <span style='color: #8A1538; font-size: 18px;'>{newPassword}</span></p>
                <p>Vui lòng đăng nhập và đổi lại mật khẩu của riêng bạn ngay lập tức để bảo đảm an toàn.</p>
                <br/><p>Trân trọng,<br/>Ban quản trị hệ thống ABC Hotel</p>";
                
            await _emailService.SendEmailAsync(user.Email, "Cấp lại mật khẩu - ABC Hotel", emailBody);

            string currentUserName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_USERS",
                "Reset Mật khẩu",
                $"[{currentUserName}] vừa reset mật khẩu của {user.FullName}."
            );

            return true;
        }
    }
}
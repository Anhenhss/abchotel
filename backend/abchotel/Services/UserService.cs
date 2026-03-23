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
    public interface IUserService
    {
       
        Task<PaginatedUserResponse> GetUsersAsync(UserFilterRequest filter);
        Task<(bool IsSuccess, string Message)> CreateUserAsync(CreateUserRequest request);
        Task<bool> UpdateUserAsync(int id, UpdateUserRequest request);
        Task<bool> SoftDeleteUserAsync(int id);
        Task<bool> ChangeUserRoleAsync(int id, int newRoleId);
    }

    public class UserService : IUserService
    {
        private readonly HotelDbContext _context;
        private readonly IEmailService _emailService;
        private readonly INotificationService _notificationService;

        public UserService(HotelDbContext context, IEmailService emailService, INotificationService notificationService)
        {
            _context = context;
            _emailService = emailService;
            _notificationService = notificationService;
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

            // Đẩy thông báo Realtime
            await _notificationService.SendToRolesAsync(
                new List<string> { "Admin", "Manager" },
                "Tài khoản mới",
                $"Nhân viên {user.FullName} vừa được thêm.",
                "Success"
            );

            return (true, "Tạo người dùng thành công. Mật khẩu đã gửi qua mail.");
        }

        // Các hàm khác giữ nguyên
        public async Task<bool> UpdateUserAsync(int id, UpdateUserRequest request)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) return false;

            user.FullName = request.FullName;
            user.Phone = request.Phone;
            user.AvatarUrl = request.AvatarUrl;

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

            user.RoleId = newRoleId;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
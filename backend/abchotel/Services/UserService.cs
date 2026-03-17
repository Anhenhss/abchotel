#nullable disable
using abchotel.Data;
using abchotel.Models;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Services
{
    public class UserService : IUserService
    {
        private readonly HotelDbContext _context;

        public UserService(HotelDbContext context)
        {
            _context = context;
        }

        // --- PHẦN 1: QUẢN LÝ HỒ SƠ CÁ NHÂN (USER PROFILE) ---

        // 1. Lấy thông tin cá nhân chi tiết (Dùng cho API My-Profile)
        public async Task<User> GetUserProfileAsync(int userId)
        {
            return await _context.Users
                .Include(u => u.Role) // Lấy kèm thông tin chức vụ (HR, Auditor,...)
                .FirstOrDefaultAsync(u => u.Id == userId);
        }

        // 2. Cập nhật thông tin (FullName, Phone, Avatar)
        public async Task<bool> UpdateProfileAsync(int userId, string fullName, string phone, string avatarUrl)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.FullName = fullName;
            user.Phone = phone;
            if (!string.IsNullOrEmpty(avatarUrl))
            {
                user.AvatarUrl = avatarUrl;
            }

            _context.Users.Update(user);
            return await _context.SaveChangesAsync() > 0;
        }

        // 3. Đổi mật khẩu
        public async Task<bool> ChangePasswordAsync(int userId, string newPassword)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            // Trong thực tế Ly nên dùng BCrypt để Hash mật khẩu ở đây
            user.Password = newPassword; 
            
            _context.Users.Update(user);
            return await _context.SaveChangesAsync() > 0;
        }


        // --- PHẦN 2: QUẢN LÝ NHÂN SỰ & BÁO CÁO (Dành cho vai trò HR/Auditor) ---

        // 4. Lấy danh sách nhân viên để Ly làm báo cáo hiệu suất
        public async Task<IEnumerable<User>> GetAllStaffAsync()
        {
            return await _context.Users
                .Include(u => u.Role)
                .Where(u => u.Role.Name != "Admin") // Chỉ lấy nhân viên, bỏ qua Admin
                .ToListAsync();
        }

        // 5. Kiểm tra quyền hạn của User
        public async Task<string> GetUserRoleNameAsync(int userId)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Id == userId);
            return user?.Role?.Name ?? "No Role";
        }
    }
}
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.DTOs;

namespace abchotel.Services
{
    public interface IUserProfileService
    {
        Task<UserProfileDetailResponse> GetMyProfileAsync(int userId);
        Task<bool> UpdateProfileAsync(int userId, UpdateMyProfileRequest request);
        Task<(bool IsSuccess, string Message)> ChangePasswordAsync(int userId, ChangePasswordRequest request);
        Task<bool> UpdateAvatarAsync(int userId, string avatarUrl);
    }

    public class UserProfileService : IUserProfileService
    {
        private readonly HotelDbContext _context;
        public UserProfileService(HotelDbContext context) => _context = context;

        public async Task<UserProfileDetailResponse> GetMyProfileAsync(int userId)
        {
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return null;

            return new UserProfileDetailResponse
            {
                Id = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Phone = user.Phone,
                Address = user.Address,
                AvatarUrl = user.AvatarUrl,
                RoleName = user.Role?.Name,
                TotalPoints = user.TotalPoints
            };
        }

        public async Task<bool> UpdateProfileAsync(int userId, UpdateMyProfileRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.FullName = request.FullName;
            user.Phone = request.Phone;
            user.Address = request.Address;
            user.Gender = request.Gender;
            user.DateOfBirth = request.DateOfBirth;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool IsSuccess, string Message)> ChangePasswordAsync(int userId, ChangePasswordRequest request)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return (false, "Không tìm thấy người dùng.");

            if (!BCrypt.Net.BCrypt.Verify(request.OldPassword, user.PasswordHash))
                return (false, "Mật khẩu cũ không chính xác.");

            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
            await _context.SaveChangesAsync();
            return (true, "Đổi mật khẩu thành công.");
        }

        public async Task<bool> UpdateAvatarAsync(int userId, string avatarUrl)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.AvatarUrl = avatarUrl;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
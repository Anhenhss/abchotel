using System;
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
        // 1. KHAI BÁO THÊM IMediaService
        private readonly IMediaService _mediaService; 

        // 2. INJECT VÀO HÀM KHỞI TẠO (CONSTRUCTOR)
        public UserProfileService(HotelDbContext context, IMediaService mediaService)
        {
            _context = context;
            _mediaService = mediaService;
        }

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
                TotalPoints = user.TotalPoints,
                Gender = user.Gender,
                DateOfBirth = user.DateOfBirth
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

        // ================================================================
        // 3. CẬP NHẬT LẠI HÀM NÀY ĐỂ TỰ ĐỘNG XÓA RÁC CLOUDINARY
        // ================================================================
        public async Task<bool> UpdateAvatarAsync(int userId, string avatarUrl)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            // Bước 1: Lấy cái AvatarUrl cũ của họ ra
            string oldAvatarUrl = user.AvatarUrl;

            // Bước 2 & 3: Kiểm tra nếu có ảnh cũ VÀ ảnh đó nằm trên Cloudinary thì mới tiến hành xóa
            if (!string.IsNullOrEmpty(oldAvatarUrl) && oldAvatarUrl.Contains("cloudinary.com"))
            {
                try
                {
                    // Lấy Public ID từ URL cũ
                    string publicId = _mediaService.ExtractPublicIdFromUrl(oldAvatarUrl);
                    
                    if (!string.IsNullOrEmpty(publicId))
                    {
                        // Xóa ảnh cũ trên mây
                        await _mediaService.DeleteImageAsync(publicId);
                    }
                }
                catch (Exception ex)
                {
                    // Nếu quá trình xóa mây bị lỗi (do mất mạng, api key sai...) 
                    // thì chỉ ghi log hệ thống chứ KHÔNG báo lỗi cho người dùng.
                    // Vẫn cho họ lưu ảnh mới bình thường.
                    Console.WriteLine("Lỗi dọn rác Cloudinary: " + ex.Message);
                }
            }

            // Bước 4: Lưu Link ảnh mới vào Database
            user.AvatarUrl = avatarUrl;
            await _context.SaveChangesAsync();
            
            return true;
        }
    }
}
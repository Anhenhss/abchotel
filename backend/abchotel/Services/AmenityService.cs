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
    public interface IAmenityService
    {
        Task<List<AmenityResponse>> GetAllAmenitiesAsync(bool onlyActive = false);
        Task<AmenityResponse> GetAmenityByIdAsync(int id);
        Task<(bool IsSuccess, string Message, AmenityResponse Data)> CreateAmenityAsync(CreateAmenityRequest request);
        Task<bool> UpdateAmenityAsync(int id, UpdateAmenityRequest request);
        Task<bool> ToggleSoftDeleteAsync(int id);
        
        Task<(bool IsSuccess, string Message)> AssignAmenitiesToRoomTypeAsync(AssignAmenitiesRequest request);
    }

    public class AmenityService : IAmenityService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        
        // 1. TIÊM THÊM MEDIA SERVICE VÀO ĐÂY ĐỂ DỌN RÁC
        private readonly IMediaService _mediaService;

        public AmenityService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor, IMediaService mediaService)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
            _mediaService = mediaService;
        }

        private async Task<string> GetCurrentUserNameAsync()
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId))
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.FullName ?? "Một quản trị viên";
            }
            return "Hệ thống";
        }

        public async Task<List<AmenityResponse>> GetAllAmenitiesAsync(bool onlyActive = false)
        {
            var query = _context.Amenities.AsQueryable();

            if (onlyActive) query = query.Where(a => a.IsActive);

            return await query.Select(a => new AmenityResponse
            {
                Id = a.Id,
                Name = a.Name,
                IconUrl = a.IconUrl,
                IsActive = a.IsActive
            }).ToListAsync();
        }

        public async Task<AmenityResponse> GetAmenityByIdAsync(int id)
        {
            var amenity = await _context.Amenities.FindAsync(id);
            if (amenity == null) return null;

            return new AmenityResponse
            {
                Id = amenity.Id,
                Name = amenity.Name,
                IconUrl = amenity.IconUrl,
                IsActive = amenity.IsActive
            };
        }

        public async Task<(bool IsSuccess, string Message, AmenityResponse Data)> CreateAmenityAsync(CreateAmenityRequest request)
        {
            if (await _context.Amenities.AnyAsync(a => a.Name == request.Name))
                return (false, "Tên tiện ích đã tồn tại.", null);

            var amenity = new Amenity
            {
                Name = request.Name,
                IconUrl = request.IconUrl,
                IsActive = true
            };

            _context.Amenities.Add(amenity);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Tạo Tiện ích mới", 
                $"[{userName}] vừa thêm tiện ích mới: {amenity.Name}."
            );

            var response = new AmenityResponse
            {
                Id = amenity.Id,
                Name = amenity.Name,
                IconUrl = amenity.IconUrl,
                IsActive = amenity.IsActive
            };

            return (true, "Tạo tiện ích thành công.", response);
        }

        public async Task<bool> UpdateAmenityAsync(int id, UpdateAmenityRequest request)
        {
            var amenity = await _context.Amenities.FindAsync(id);
            if (amenity == null) return false;

            // 2. LOGIC TỰ ĐỘNG DỌN RÁC CLOUDINARY KHI ĐỔI ICON MỚI
            // Nếu có link Icon mới truyền xuống VÀ nó khác với link cũ trong DB
            if (!string.IsNullOrEmpty(request.IconUrl) && amenity.IconUrl != request.IconUrl)
            {
                // Kiểm tra xem link cũ có phải của Cloudinary không
                if (!string.IsNullOrEmpty(amenity.IconUrl) && amenity.IconUrl.Contains("cloudinary.com"))
                {
                    try
                    {
                        // Rút trích PublicId và Xóa nó trên mây
                        string publicId = _mediaService.ExtractPublicIdFromUrl(amenity.IconUrl);
                        if (!string.IsNullOrEmpty(publicId))
                        {
                            await _mediaService.DeleteImageAsync(publicId);
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine("Lỗi xóa Icon Tiện ích cũ: " + ex.Message);
                    }
                }
            }

            // Cập nhật thông tin mới
            amenity.Name = request.Name;
            amenity.IconUrl = request.IconUrl;

            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Cập nhật Tiện ích", 
                $"[{userName}] vừa cập nhật thông tin tiện ích: {amenity.Name}."
            );

            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var amenity = await _context.Amenities.FindAsync(id);
            if (amenity == null) return false;

            amenity.IsActive = !amenity.IsActive;
            await _context.SaveChangesAsync();

            string statusStr = amenity.IsActive ? "mở bán" : "khóa";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Trạng thái Tiện ích", 
                $"[{userName}] vừa {statusStr} tiện ích: {amenity.Name}."
            );

            return true;
        }

        public async Task<(bool IsSuccess, string Message)> AssignAmenitiesToRoomTypeAsync(AssignAmenitiesRequest request)
        {
            var roomType = await _context.RoomTypes.FindAsync(request.RoomTypeId);
            if (roomType == null) return (false, "Loại phòng không tồn tại.");

            var existingMappings = await _context.RoomTypeAmenities
                .Where(rta => rta.RoomTypeId == request.RoomTypeId)
                .ToListAsync();
            _context.RoomTypeAmenities.RemoveRange(existingMappings);

            var newMappings = request.AmenityIds.Select(amenityId => new RoomTypeAmenity
            {
                RoomTypeId = request.RoomTypeId,
                AmenityId = amenityId
            }).ToList();

            _context.RoomTypeAmenities.AddRange(newMappings);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_ROOMS", 
                "Cập nhật Trang bị", 
                $"[{userName}] vừa cập nhật danh sách tiện ích cho phòng: {roomType.Name}."
            );

            return (true, "Gán tiện ích cho loại phòng thành công.");
        }
    }
}
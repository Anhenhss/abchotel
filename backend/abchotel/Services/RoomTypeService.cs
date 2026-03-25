using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // Bắt buộc để đọc Token
using System.Security.Claims;    // Bắt buộc để lấy User
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IRoomTypeService
    {
        Task<List<RoomTypeResponse>> GetAllRoomTypesAsync(bool onlyActive = false);
        Task<RoomTypeResponse> GetRoomTypeByIdAsync(int id);
        Task<(bool IsSuccess, string Message, RoomTypeResponse Data)> CreateRoomTypeAsync(CreateRoomTypeRequest request);
        Task<bool> UpdateRoomTypeAsync(int id, UpdateRoomTypeRequest request);
        Task<bool> ToggleSoftDeleteAsync(int id);

        // Chức năng Hình ảnh (RoomImages)
        Task<(bool IsSuccess, string Message)> AddRoomImageAsync(int roomTypeId, AddRoomImageRequest request);
        Task<bool> DeleteRoomImageAsync(int imageId);
        Task<bool> SetPrimaryImageAsync(int roomTypeId, int imageId);
    }

    public class RoomTypeService : IRoomTypeService
    {
        private readonly HotelDbContext _context;
        private readonly IMediaService _mediaService;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RoomTypeService(HotelDbContext context, IMediaService mediaService, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _mediaService = mediaService;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        // HÀM PHỤ TRỢ: Lấy tên người thao tác
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

        public async Task<List<RoomTypeResponse>> GetAllRoomTypesAsync(bool onlyActive = false)
        {
            var query = _context.RoomTypes
                .Include(rt => rt.RoomImages)
                .AsQueryable();

            if (onlyActive) query = query.Where(rt => rt.IsActive);

            return await query.Select(rt => new RoomTypeResponse
            {
                Id = rt.Id,
                Name = rt.Name,
                BasePrice = rt.BasePrice,
                CapacityAdults = rt.CapacityAdults,
                CapacityChildren = rt.CapacityChildren,
                Description = rt.Description,
                SizeSqm = rt.SizeSqm,
                BedType = rt.BedType,
                ViewDirection = rt.ViewDirection,
                IsActive = rt.IsActive,
                Images = rt.RoomImages.Where(img => !onlyActive || img.IsActive).Select(img => new RoomImageResponse
                {
                    Id = img.Id,
                    ImageUrl = img.ImageUrl,
                    IsPrimary = img.IsPrimary,
                    IsActive = img.IsActive
                }).ToList()
            }).ToListAsync();
        }

        public async Task<RoomTypeResponse> GetRoomTypeByIdAsync(int id)
        {
            var rt = await _context.RoomTypes
                .Include(r => r.RoomImages)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (rt == null) return null;

            return new RoomTypeResponse
            {
                Id = rt.Id,
                Name = rt.Name,
                BasePrice = rt.BasePrice,
                CapacityAdults = rt.CapacityAdults,
                CapacityChildren = rt.CapacityChildren,
                Description = rt.Description,
                SizeSqm = rt.SizeSqm,
                BedType = rt.BedType,
                ViewDirection = rt.ViewDirection,
                IsActive = rt.IsActive,
                Images = rt.RoomImages.Select(img => new RoomImageResponse
                {
                    Id = img.Id,
                    ImageUrl = img.ImageUrl,
                    IsPrimary = img.IsPrimary,
                    IsActive = img.IsActive
                }).ToList()
            };
        }

        public async Task<(bool IsSuccess, string Message, RoomTypeResponse Data)> CreateRoomTypeAsync(CreateRoomTypeRequest request)
        {
            var roomType = new RoomType
            {
                Name = request.Name,
                BasePrice = request.BasePrice,
                CapacityAdults = request.CapacityAdults,
                CapacityChildren = request.CapacityChildren,
                Description = request.Description,
                SizeSqm = request.SizeSqm,
                BedType = request.BedType,
                ViewDirection = request.ViewDirection,
                IsActive = true
            };

            _context.RoomTypes.Add(roomType);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Loại phòng mới", $"[{userName}] vừa tạo loại phòng: {roomType.Name}.");

            var response = await GetRoomTypeByIdAsync(roomType.Id);
            return (true, "Tạo loại phòng thành công.", response);
        }

        public async Task<bool> UpdateRoomTypeAsync(int id, UpdateRoomTypeRequest request)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null) return false;

            roomType.Name = request.Name;
            roomType.BasePrice = request.BasePrice;
            roomType.CapacityAdults = request.CapacityAdults;
            roomType.CapacityChildren = request.CapacityChildren;
            roomType.Description = request.Description;
            roomType.SizeSqm = request.SizeSqm;
            roomType.BedType = request.BedType;
            roomType.ViewDirection = request.ViewDirection;

            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Cập nhật Loại phòng", $"[{userName}] vừa cập nhật thông tin loại phòng: {roomType.Name}.");

            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null) return false;

            roomType.IsActive = !roomType.IsActive;
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string statusStr = roomType.IsActive ? "mở bán" : "ngừng bán";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Trạng thái Loại phòng", $"[{userName}] vừa {statusStr} loại phòng: {roomType.Name}.");

            return true;
        }

        // --- XỬ LÝ HÌNH ẢNH LOẠI PHÒNG ---

        public async Task<(bool IsSuccess, string Message)> AddRoomImageAsync(int roomTypeId, AddRoomImageRequest request)
        {
            var roomType = await _context.RoomTypes.FindAsync(roomTypeId);
            if (roomType == null) return (false, "Không tìm thấy loại phòng.");

            if (request.IsPrimary)
            {
                var existingImages = await _context.RoomImages.Where(img => img.RoomTypeId == roomTypeId).ToListAsync();
                foreach (var img in existingImages) img.IsPrimary = false;
            }

            var newImage = new RoomImage
            {
                RoomTypeId = roomTypeId,
                ImageUrl = request.ImageUrl,
                IsPrimary = request.IsPrimary,
                IsActive = true
            };

            _context.RoomImages.Add(newImage);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Thêm Ảnh Loại phòng", $"[{userName}] vừa thêm hình ảnh mới cho loại phòng: {roomType.Name}.");

            return (true, "Thêm ảnh thành công.");
        }

        public async Task<bool> DeleteRoomImageAsync(int imageId) 
        {
            var image = await _context.RoomImages.FindAsync(imageId);
            if (image == null) return false;

            // 1. Lưu lại thông tin trước khi xóa
            int roomTypeId = image.RoomTypeId ?? 0; // Đảm bảo lấy ID phòng
            bool wasPrimary = image.IsPrimary == true; 
            var roomType = await _context.RoomTypes.FindAsync(roomTypeId);

            // 2. Xóa ảnh trên Cloudinary
            string publicId = _mediaService.ExtractPublicIdFromUrl(image.ImageUrl);
            if (!string.IsNullOrEmpty(publicId))
            {
                await _mediaService.DeleteImageAsync(publicId);
            }

            // 3. Xóa data trong DB
            _context.RoomImages.Remove(image);
            await _context.SaveChangesAsync();

            // 4. MẸO UX: NẾU VỪA XÓA ẢNH ĐẠI DIỆN, CHỌN ẢNH KHÁC LÊN THAY THẾ
            if (wasPrimary && roomTypeId > 0)
            {
                var nextImage = await _context.RoomImages
                    .Where(img => img.RoomTypeId == roomTypeId)
                    .FirstOrDefaultAsync();

                if (nextImage != null)
                {
                    nextImage.IsPrimary = true;
                    await _context.SaveChangesAsync();
                }
            }

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Xóa Ảnh Loại phòng", $"[{userName}] vừa xóa một hình ảnh của loại phòng: {roomType?.Name}.");

            return true;
        }

        public async Task<bool> SetPrimaryImageAsync(int roomTypeId, int imageId)
        {
            var images = await _context.RoomImages.Where(img => img.RoomTypeId == roomTypeId).ToListAsync();
            var targetImage = images.FirstOrDefault(img => img.Id == imageId);
            if (targetImage == null) return false;

            foreach (var img in images)
            {
                img.IsPrimary = (img.Id == imageId);
            }

            var roomType = await _context.RoomTypes.FindAsync(roomTypeId);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Ảnh đại diện Loại phòng", $"[{userName}] vừa thay đổi ảnh đại diện cho loại phòng: {roomType?.Name}.");

            return true;
        }
    }
}
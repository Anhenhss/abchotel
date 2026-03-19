using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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

        public RoomTypeService(HotelDbContext context, IMediaService mediaService) // Thêm tham số vào đây
        {
            _context = context;
            _mediaService = mediaService;
        }

        public async Task<List<RoomTypeResponse>> GetAllRoomTypesAsync(bool onlyActive = false)
        {
            var query = _context.RoomTypes
                .Include(rt => rt.RoomImages)
                .AsQueryable();

            if (onlyActive)
            {
                query = query.Where(rt => rt.IsActive);
            }

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
            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var roomType = await _context.RoomTypes.FindAsync(id);
            if (roomType == null) return false;

            roomType.IsActive = !roomType.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }

        // --- XỬ LÝ HÌNH ẢNH LOẠI PHÒNG ---

        public async Task<(bool IsSuccess, string Message)> AddRoomImageAsync(int roomTypeId, AddRoomImageRequest request)
        {
            var roomTypeExists = await _context.RoomTypes.AnyAsync(rt => rt.Id == roomTypeId);
            if (!roomTypeExists) return (false, "Không tìm thấy loại phòng.");

            // Nếu request yêu cầu là ảnh Primary, đổi các ảnh khác thành false
            if (request.IsPrimary)
            {
                var existingImages = await _context.RoomImages.Where(img => img.RoomTypeId == roomTypeId).ToListAsync();
                foreach (var img in existingImages)
                {
                    img.IsPrimary = false;
                }
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
            return (true, "Thêm ảnh thành công.");
        }

        public async Task<bool> DeleteRoomImageAsync(int imageId) 
        {
            var image = await _context.RoomImages.FindAsync(imageId);
            if (image == null) return false;

            // BƯỚC 1: Lấy PublicId từ URL lưu trong DB
            string publicId = _mediaService.ExtractPublicIdFromUrl(image.ImageUrl);

            // BƯỚC 2: Gọi MediaService để xóa file trên Cloudinary
            if (!string.IsNullOrEmpty(publicId))
            {
                await _mediaService.DeleteImageAsync(publicId);
            }

            // BƯỚC 3: Xóa dòng dữ liệu trong Database
            _context.RoomImages.Remove(image);
            
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> SetPrimaryImageAsync(int roomTypeId, int imageId)
        {
            var images = await _context.RoomImages.Where(img => img.RoomTypeId == roomTypeId).ToListAsync();
            
            var targetImage = images.FirstOrDefault(img => img.Id == imageId);
            if (targetImage == null) return false;

            // Chuyển toàn bộ ảnh về false, riêng ảnh được chọn thành true
            foreach (var img in images)
            {
                img.IsPrimary = (img.Id == imageId);
            }

            await _context.SaveChangesAsync();
            return true;
        }
    }
}
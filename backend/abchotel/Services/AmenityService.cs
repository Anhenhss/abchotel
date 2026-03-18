using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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
        
        // Logic gán tiện ích vào bảng trung gian RoomTypeAmenity
        Task<(bool IsSuccess, string Message)> AssignAmenitiesToRoomTypeAsync(AssignAmenitiesRequest request);
    }

    public class AmenityService : IAmenityService
    {
        private readonly HotelDbContext _context;

        public AmenityService(HotelDbContext context) => _context = context;

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

            amenity.Name = request.Name;
            amenity.IconUrl = request.IconUrl;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var amenity = await _context.Amenities.FindAsync(id);
            if (amenity == null) return false;

            amenity.IsActive = !amenity.IsActive;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool IsSuccess, string Message)> AssignAmenitiesToRoomTypeAsync(AssignAmenitiesRequest request)
        {
            var roomTypeExists = await _context.RoomTypes.AnyAsync(rt => rt.Id == request.RoomTypeId);
            if (!roomTypeExists) return (false, "Loại phòng không tồn tại.");

            // Bước 1: Xóa toàn bộ các tiện ích cũ đã gán cho loại phòng này trong bảng trung gian
            var existingMappings = await _context.RoomTypeAmenities
                .Where(rta => rta.RoomTypeId == request.RoomTypeId)
                .ToListAsync();
            
            _context.RoomTypeAmenities.RemoveRange(existingMappings);

            // Bước 2: Tạo danh sách map mới dựa trên list ID gửi lên
            var newMappings = request.AmenityIds.Select(amenityId => new RoomTypeAmenity
            {
                RoomTypeId = request.RoomTypeId,
                AmenityId = amenityId
            }).ToList();

            _context.RoomTypeAmenities.AddRange(newMappings);
            await _context.SaveChangesAsync();

            return (true, "Gán tiện ích cho loại phòng thành công.");
        }
    }
}
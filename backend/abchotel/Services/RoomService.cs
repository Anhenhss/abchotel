using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IRoomService
    {
        Task<List<RoomResponse>> GetAllRoomsAsync(bool onlyActive = false);
        Task<RoomResponse> GetRoomByIdAsync(int id);
        Task<(bool IsSuccess, string Message)> CreateRoomAsync(CreateRoomRequest request);
        Task<(bool IsSuccess, string Message)> BulkCreateRoomsAsync(BulkCreateRoomRequest request);
        Task<bool> UpdateRoomAsync(int id, UpdateRoomRequest request);
        Task<bool> ToggleSoftDeleteAsync(int id);
        Task<bool> UpdateStatusAsync(int id, string status);
        Task<bool> UpdateCleaningStatusAsync(int id, string cleaningStatus);
    }

    public class RoomService : IRoomService
    {
        private readonly HotelDbContext _context;

        public RoomService(HotelDbContext context) => _context = context;

        public async Task<List<RoomResponse>> GetAllRoomsAsync(bool onlyActive = false)
        {
            var query = _context.Rooms
                .Include(r => r.RoomType)
                .AsQueryable();

            if (onlyActive)
            {
                query = query.Where(r => r.IsActive);
            }

            return await query.OrderBy(r => r.RoomNumber).Select(r => new RoomResponse
            {
                Id = r.Id,
                RoomTypeId = r.RoomTypeId,
                RoomTypeName = r.RoomType != null ? r.RoomType.Name : "Chưa gắn loại phòng",
                RoomNumber = r.RoomNumber,
                Floor = r.Floor,
                Status = r.Status,
                CleaningStatus = r.CleaningStatus,
                IsActive = r.IsActive
            }).ToListAsync();
        }

        public async Task<RoomResponse> GetRoomByIdAsync(int id)
        {
            var room = await _context.Rooms
                .Include(r => r.RoomType)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null) return null;

            return new RoomResponse
            {
                Id = room.Id,
                RoomTypeId = room.RoomTypeId,
                RoomTypeName = room.RoomType?.Name,
                RoomNumber = room.RoomNumber,
                Floor = room.Floor,
                Status = room.Status,
                CleaningStatus = room.CleaningStatus,
                IsActive = room.IsActive
            };
        }

        public async Task<(bool IsSuccess, string Message)> CreateRoomAsync(CreateRoomRequest request)
        {
            if (await _context.Rooms.AnyAsync(r => r.RoomNumber == request.RoomNumber))
                return (false, "Số phòng này đã tồn tại trong hệ thống.");

            var room = new Room
            {
                RoomTypeId = request.RoomTypeId,
                RoomNumber = request.RoomNumber,
                Floor = request.Floor,
                Status = request.Status,
                CleaningStatus = request.CleaningStatus,
                IsActive = true
            };

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();
            return (true, "Tạo phòng mới thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> BulkCreateRoomsAsync(BulkCreateRoomRequest request)
        {
            var existingRooms = await _context.Rooms.Select(r => r.RoomNumber).ToListAsync();
            var newRooms = new List<Room>();

            foreach (var roomNum in request.RoomNumbers)
            {
                if (existingRooms.Contains(roomNum))
                    continue; // Bỏ qua nếu phòng đã tồn tại

                newRooms.Add(new Room
                {
                    RoomTypeId = request.RoomTypeId,
                    RoomNumber = roomNum,
                    Floor = request.Floor,
                    Status = "Available",
                    CleaningStatus = "Clean",
                    IsActive = true
                });
            }

            if (!newRooms.Any())
                return (false, "Tất cả các số phòng được cung cấp đều đã tồn tại.");

            _context.Rooms.AddRange(newRooms);
            await _context.SaveChangesAsync();
            return (true, $"Đã tạo thành công {newRooms.Count} phòng mới.");
        }

        public async Task<bool> UpdateRoomAsync(int id, UpdateRoomRequest request)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            var roomTypeExists = await _context.RoomTypes.AnyAsync(rt => rt.Id == request.RoomTypeId);
            if (!roomTypeExists)
            {
                throw new System.Exception("Loại phòng không tồn tại trong hệ thống. Vui lòng kiểm tra lại RoomTypeId.");
            }
            // Kiểm tra trùng số phòng 
            if (room.RoomNumber != request.RoomNumber)
            {
                var isDuplicate = await _context.Rooms.AnyAsync(r => r.RoomNumber == request.RoomNumber);
                if (isDuplicate) throw new System.Exception("Số phòng này đã tồn tại trong hệ thống.");
            }

            room.RoomTypeId = request.RoomTypeId;
            room.RoomNumber = request.RoomNumber;
            room.Floor = request.Floor;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            room.IsActive = !room.IsActive; // Ngừng/Mở kinh doanh phòng này
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            room.Status = status;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> UpdateCleaningStatusAsync(int id, string cleaningStatus)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            room.CleaningStatus = cleaningStatus;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
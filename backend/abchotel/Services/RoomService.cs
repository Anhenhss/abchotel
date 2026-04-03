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
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RoomService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        // HÀM LẤY TÊN NGƯỜI THAO TÁC
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

        public async Task<List<RoomResponse>> GetAllRoomsAsync(bool onlyActive = false)
        {
            var query = _context.Rooms
                .Include(r => r.RoomType)
                .AsQueryable();

            if (onlyActive)
            {
                query = query.Where(r => r.IsActive);
            }

            return await query.OrderBy(r => r.Floor).ThenBy(r => r.RoomNumber).Select(r => new RoomResponse
            {
                Id = r.Id,
                RoomTypeId = r.RoomTypeId,
                RoomTypeName = r.RoomType != null ? r.RoomType.Name : "Chưa gắn loại phòng",
                RoomNumber = r.RoomNumber,
                Floor = r.Floor,
                Status = r.Status,
                CleaningStatus = r.CleaningStatus,
                IsActive = r.IsActive,
                
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
                IsActive = room.IsActive,
                CapacityAdults = room.RoomType?.CapacityAdults ?? 0,
                CapacityChildren = room.RoomType?.CapacityChildren ?? 0,
                BedType = room.RoomType?.BedType ?? "Chưa cập nhật",
                SizeSqm = room.RoomType?.SizeSqm,
                ViewDirection = room.RoomType?.ViewDirection ?? "Chưa cập nhật"
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

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Tạo Phòng mới", $"[{userName}] vừa tạo phòng số: {room.RoomNumber}.");

            return (true, "Tạo phòng mới thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> BulkCreateRoomsAsync(BulkCreateRoomRequest request)
        {
            var existingRooms = await _context.Rooms.Select(r => r.RoomNumber).ToListAsync();
            var newRooms = new List<Room>();

            foreach (var roomNum in request.RoomNumbers)
            {
                if (existingRooms.Contains(roomNum)) continue;

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

            if (!newRooms.Any()) return (false, "Tất cả các số phòng được cung cấp đều đã tồn tại.");

            _context.Rooms.AddRange(newRooms);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Tạo Phòng hàng loạt", $"[{userName}] vừa tạo thành công {newRooms.Count} phòng mới ở tầng {request.Floor}.");

            return (true, $"Đã tạo thành công {newRooms.Count} phòng mới.");
        }

        public async Task<bool> UpdateRoomAsync(int id, UpdateRoomRequest request)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            var roomTypeExists = await _context.RoomTypes.AnyAsync(rt => rt.Id == request.RoomTypeId);
            if (!roomTypeExists) throw new System.Exception("Loại phòng không tồn tại.");

            if (room.RoomNumber != request.RoomNumber)
            {
                var isDuplicate = await _context.Rooms.AnyAsync(r => r.RoomNumber == request.RoomNumber);
                if (isDuplicate) throw new System.Exception("Số phòng này đã tồn tại.");
            }

            room.RoomTypeId = request.RoomTypeId;
            room.RoomNumber = request.RoomNumber;
            room.Floor = request.Floor;

            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Cập nhật Phòng", $"[{userName}] vừa cập nhật thông tin phòng {room.RoomNumber}.");

            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            room.IsActive = !room.IsActive; 
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO
            string statusStr = room.IsActive ? "mở bán" : "ngừng kinh doanh";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_ROOMS", "Trạng thái Phòng", $"[{userName}] vừa {statusStr} phòng {room.RoomNumber}.");

            return true;
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            room.Status = status;
            await _context.SaveChangesAsync();

            string statusVn = status == "Occupied" ? "Đã có khách" :
                      status == "Available" ? "Trống" :
                      status == "Maintenance" ? "Bảo trì" : "Đã đặt trước";

            await _notificationService.SendToPermissionAsync(
                "UPDATE_ROOM_STATUS", 
                "Trạng thái phòng", 
                $"Phòng {room.RoomNumber} vừa đổi thành: {statusVn}."
            );

            return true;
        }

        public async Task<bool> UpdateCleaningStatusAsync(int id, string cleaningStatus)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null) return false;

            room.CleaningStatus = cleaningStatus;
            await _context.SaveChangesAsync();

            string statusVn = cleaningStatus == "Dirty" ? "Cần dọn dẹp (Dơ)" : 
                      cleaningStatus == "Inspected" ? "Chờ kiểm tra" : 
                      cleaningStatus == "Clean" ? "Đã sạch sẽ" : "Đang dọn dẹp";

            await _notificationService.SendToPermissionAsync(
                "UPDATE_CLEANING_STATUS", 
                "Cập nhật Dọn phòng", 
                $"Phòng {room.RoomNumber} hiện đang: {statusVn}."
            );

            return true;
        }
    }
}
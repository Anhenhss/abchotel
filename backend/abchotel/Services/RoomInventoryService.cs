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
    public interface IRoomInventoryService
    {
        Task<List<RoomInventoryResponse>> GetInventoryByRoomIdAsync(int roomId, bool onlyActive = true);
        Task<(bool IsSuccess, string Message)> CreateInventoryAsync(CreateRoomInventoryRequest request);
        Task<bool> UpdateInventoryAsync(int id, UpdateRoomInventoryRequest request);
        Task<bool> ToggleSoftDeleteAsync(int id);
        Task<(bool IsSuccess, string Message)> CloneInventoryAsync(CloneInventoryRequest request);
    }

    public class RoomInventoryService : IRoomInventoryService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public RoomInventoryService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
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

        public async Task<List<RoomInventoryResponse>> GetInventoryByRoomIdAsync(int roomId, bool onlyActive = true)
        {
            var query = _context.RoomInventories
                .Include(ri => ri.Room)
                .Where(ri => ri.RoomId == roomId)
                .AsQueryable();

            if (onlyActive)
            {
                query = query.Where(ri => ri.IsActive);
            }

            return await query.Select(ri => new RoomInventoryResponse
            {
                Id = ri.Id,
                RoomId = ri.RoomId,
                RoomNumber = ri.Room != null ? ri.Room.RoomNumber : "N/A",
                ItemName = ri.ItemName,
                Quantity = ri.Quantity,
                PriceIfLost = ri.PriceIfLost,
                ItemType = ri.ItemType,
                IsActive = ri.IsActive
            }).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> CreateInventoryAsync(CreateRoomInventoryRequest request)
        {
            var room = await _context.Rooms.FindAsync(request.RoomId);
            if (room == null) return (false, "Phòng không tồn tại trong hệ thống.");

            if (await _context.RoomInventories.AnyAsync(ri => ri.RoomId == request.RoomId && ri.ItemName == request.ItemName))
                return (false, "Vật tư này đã được khai báo trong phòng. Vui lòng cập nhật số lượng thay vì tạo mới.");

            var inventory = new RoomInventory
            {
                RoomId = request.RoomId,
                ItemName = request.ItemName,
                Quantity = request.Quantity,
                PriceIfLost = request.PriceIfLost,
                ItemType = request.ItemType,
                IsActive = true
            };

            _context.RoomInventories.Add(inventory);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO REALTIME
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Vật tư mới", 
                $"[{userName}] vừa khai báo {inventory.Quantity} {inventory.ItemName} vào phòng {room.RoomNumber}."
            );

            return (true, "Thêm vật tư vào phòng thành công.");
        }

        public async Task<bool> UpdateInventoryAsync(int id, UpdateRoomInventoryRequest request)
        {
            var inventory = await _context.RoomInventories.Include(ri => ri.Room).FirstOrDefaultAsync(ri => ri.Id == id);
            if (inventory == null) return false;

            inventory.ItemName = request.ItemName;
            inventory.Quantity = request.Quantity;
            inventory.PriceIfLost = request.PriceIfLost;
            inventory.ItemType = request.ItemType;

            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO REALTIME
            string roomNum = inventory.Room != null ? inventory.Room.RoomNumber : "N/A";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Cập nhật Vật tư", 
                $"[{userName}] vừa cập nhật thông tin {inventory.ItemName} ở phòng {roomNum}."
            );

            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var inventory = await _context.RoomInventories.Include(ri => ri.Room).FirstOrDefaultAsync(ri => ri.Id == id);
            if (inventory == null) return false;

            inventory.IsActive = !inventory.IsActive; 
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO REALTIME
            string statusStr = inventory.IsActive ? "theo dõi lại" : "ngừng theo dõi";
            string roomNum = inventory.Room != null ? inventory.Room.RoomNumber : "N/A";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Trạng thái Vật tư", 
                $"[{userName}] vừa {statusStr} vật tư {inventory.ItemName} ở phòng {roomNum}."
            );

            return true;
        }

        public async Task<(bool IsSuccess, string Message)> CloneInventoryAsync(CloneInventoryRequest request)
        {
            if (request.SourceRoomId == request.TargetRoomId)
                return (false, "Phòng nguồn và phòng đích không được trùng nhau.");

            var sourceRoom = await _context.Rooms.FindAsync(request.SourceRoomId);
            var targetRoom = await _context.Rooms.FindAsync(request.TargetRoomId);
            if (targetRoom == null || sourceRoom == null) return (false, "Phòng nguồn hoặc phòng đích không tồn tại.");

            var sourceItems = await _context.RoomInventories
                .Where(ri => ri.RoomId == request.SourceRoomId && ri.IsActive)
                .ToListAsync();

            if (!sourceItems.Any()) return (false, "Phòng nguồn không có vật tư nào để sao chép.");

            var existingTargetItemNames = await _context.RoomInventories
                .Where(ri => ri.RoomId == request.TargetRoomId)
                .Select(ri => ri.ItemName)
                .ToListAsync();

            var newItems = new List<RoomInventory>();

            foreach (var item in sourceItems)
            {
                if (!existingTargetItemNames.Contains(item.ItemName))
                {
                    newItems.Add(new RoomInventory
                    {
                        RoomId = request.TargetRoomId,
                        ItemName = item.ItemName,
                        Quantity = item.Quantity,
                        PriceIfLost = item.PriceIfLost,
                        ItemType = item.ItemType,
                        IsActive = true
                    });
                }
            }

            if (!newItems.Any()) return (false, "Tất cả vật tư từ phòng nguồn đã có sẵn ở phòng đích.");

            _context.RoomInventories.AddRange(newItems);
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO REALTIME
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Sao chép Kho vật tư", 
                $"[{userName}] vừa sao chép {newItems.Count} vật tư từ phòng {sourceRoom.RoomNumber} sang phòng {targetRoom.RoomNumber}."
            );

            return (true, $"Đã sao chép thành công {newItems.Count} vật tư sang phòng đích.");
        }
    }
}
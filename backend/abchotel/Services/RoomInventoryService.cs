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
    public interface IRoomInventoryService
    {
        Task<List<RoomInventoryResponse>> GetInventoryByRoomIdAsync(int roomId, bool onlyActive = true);
        Task<(bool IsSuccess, string Message)> CreateInventoryAsync(CreateRoomInventoryRequest request);
        Task<(bool IsSuccess, string Message)> UpdateInventoryAsync(int id, UpdateRoomInventoryRequest request);
        Task<(bool IsSuccess, string Message)> ToggleSoftDeleteAsync(int id);
        Task<(bool IsSuccess, string Message)> CloneInventoryAsync(CloneInventoryRequest request);
        Task<(bool IsSuccess, string Message)> RequestRefillAsync(int id);
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
                .Include(ri => ri.Equipment)
                .Where(ri => ri.RoomId == roomId)
                .AsQueryable();

            if (onlyActive) query = query.Where(ri => ri.IsActive);

            return await query.Select(ri => new RoomInventoryResponse
            {
                Id = ri.Id,
                RoomId = ri.RoomId,
                RoomNumber = ri.Room != null ? ri.Room.RoomNumber : "N/A",
                EquipmentId = ri.EquipmentId,
                EquipmentName = ri.Equipment != null ? ri.Equipment.Name : "Không xác định",
                Category = ri.Equipment != null ? ri.Equipment.Category : "Khác",
                Quantity = ri.Quantity,
                PriceIfLost = ri.PriceIfLost,
                Note = ri.Note,
                IsActive = ri.IsActive
            }).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> CreateInventoryAsync(CreateRoomInventoryRequest request)
        {
            var room = await _context.Rooms.FindAsync(request.RoomId);
            var equipment = await _context.Equipments.FindAsync(request.EquipmentId);

            if (room == null || equipment == null) return (false, "Phòng hoặc Thiết bị không tồn tại.");

            if (await _context.RoomInventories.AnyAsync(ri => ri.RoomId == request.RoomId && ri.EquipmentId == request.EquipmentId && ri.IsActive))
                return (false, "Vật tư này đã có trong phòng, vui lòng cập nhật số lượng.");

            // 🔥 SỬA LỖI CS0266: Chuyển int? thành int an toàn
            int reqQty = request.Quantity ?? 0;

            int availableStock = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity;
            if (availableStock < reqQty)
                return (false, $"Kho tổng không đủ! '{equipment.Name}' chỉ còn tồn {availableStock} {equipment.Unit}.");

            equipment.InUseQuantity += reqQty;

            var inventory = new RoomInventory
            {
                RoomId = request.RoomId,
                EquipmentId = request.EquipmentId,
                Quantity = request.Quantity,
                PriceIfLost = request.PriceIfLost,
                Note = request.Note,
                IsActive = true
            };

            _context.RoomInventories.Add(inventory);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_INVENTORY", "Vật tư mới",
                $"[{userName}] vừa thêm {inventory.Quantity} {equipment.Name} vào phòng {room.RoomNumber}.");

            return (true, "Thêm vật tư thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> UpdateInventoryAsync(int id, UpdateRoomInventoryRequest request)
        {
            var inventory = await _context.RoomInventories.Include(ri => ri.Room).Include(ri => ri.Equipment).FirstOrDefaultAsync(ri => ri.Id == id);
            if (inventory == null) return (false, "Không tìm thấy dữ liệu vật tư trong phòng.");

            var equipment = inventory.Equipment;

            // 🔥 SỬA LỖI CS0266
            int reqQty = request.Quantity ?? 0;
            int invQty = inventory.Quantity ?? 0;
            int diff = reqQty - invQty;

            if (diff > 0)
            {
                int availableStock = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity;
                if (availableStock < diff)
                    return (false, $"Kho tổng không đủ! '{equipment.Name}' chỉ còn có thể lấy thêm tối đa {availableStock} {equipment.Unit}.");
            }

            equipment.InUseQuantity += diff;
            if (equipment.InUseQuantity < 0) equipment.InUseQuantity = 0;

            inventory.Quantity = request.Quantity;
            inventory.PriceIfLost = request.PriceIfLost;
            inventory.Note = request.Note;

            await _context.SaveChangesAsync();

            string roomNum = inventory.Room?.RoomNumber ?? "N/A";
            string equipName = inventory.Equipment?.Name ?? "Vật tư";
            string userName = await GetCurrentUserNameAsync();

            await _notificationService.SendToPermissionAsync("MANAGE_INVENTORY", "Cập nhật Vật tư",
                $"[{userName}] vừa cập nhật thông tin {equipName} ở phòng {roomNum}.");

            return (true, "Cập nhật số lượng vật tư thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> ToggleSoftDeleteAsync(int id)
        {
            var inventory = await _context.RoomInventories.Include(ri => ri.Room).Include(ri => ri.Equipment).FirstOrDefaultAsync(ri => ri.Id == id);
            if (inventory == null) return (false, "Không tìm thấy dữ liệu.");

            var equipment = inventory.Equipment;
            // 🔥 SỬA LỖI CS0266
            int invQty = inventory.Quantity ?? 0;

            if (inventory.IsActive)
            {
                equipment.InUseQuantity -= invQty;
                if (equipment.InUseQuantity < 0) equipment.InUseQuantity = 0;
                inventory.IsActive = false;
            }
            else
            {
                int availableStock = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity;
                if (availableStock < invQty)
                    return (false, $"Kho tổng không đủ! '{equipment.Name}' chỉ còn {availableStock} {equipment.Unit}.");

                equipment.InUseQuantity += invQty;
                inventory.IsActive = true;
            }

            await _context.SaveChangesAsync();

            string statusStr = inventory.IsActive ? "phục hồi" : "gỡ";
            string roomNum = inventory.Room?.RoomNumber ?? "N/A";
            string equipName = inventory.Equipment?.Name ?? "Vật tư";
            string userName = await GetCurrentUserNameAsync();

            await _notificationService.SendToPermissionAsync("MANAGE_INVENTORY", "Trạng thái Vật tư",
                $"[{userName}] vừa {statusStr} {equipName} khỏi phòng {roomNum}.");

            return (true, "Gỡ vật tư và hoàn trả kho thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> CloneInventoryAsync(CloneInventoryRequest request)
        {
            if (request.SourceRoomId == request.TargetRoomId) return (false, "Phòng nguồn và đích không được trùng nhau.");

            var sourceRoom = await _context.Rooms.FindAsync(request.SourceRoomId);
            var targetRoom = await _context.Rooms.FindAsync(request.TargetRoomId);
            if (targetRoom == null || sourceRoom == null) return (false, "Phòng nguồn hoặc phòng đích không tồn tại.");

            var sourceItems = await _context.RoomInventories.Where(ri => ri.RoomId == request.SourceRoomId && ri.IsActive).ToListAsync();
            var existingEquipIds = await _context.RoomInventories.Where(ri => ri.RoomId == request.TargetRoomId && ri.IsActive).Select(ri => ri.EquipmentId).ToListAsync();

            var newItems = new List<RoomInventory>();
            int addedCount = 0;
            int skippedCount = 0;

            foreach (var item in sourceItems)
            {
                if (!existingEquipIds.Contains(item.EquipmentId))
                {
                    var equipment = await _context.Equipments.FindAsync(item.EquipmentId);
                    if (equipment == null) continue;

                    // 🔥 SỬA LỖI CS0266
                    int itemQty = item.Quantity ?? 0;

                    int availableStock = equipment.TotalQuantity - equipment.InUseQuantity - equipment.DamagedQuantity - equipment.LiquidatedQuantity;

                    if (availableStock >= itemQty)
                    {
                        equipment.InUseQuantity += itemQty;

                        newItems.Add(new RoomInventory
                        {
                            RoomId = request.TargetRoomId,
                            EquipmentId = item.EquipmentId,
                            Quantity = item.Quantity,
                            PriceIfLost = item.PriceIfLost,
                            Note = item.Note,
                            IsActive = true
                        });
                        addedCount++;
                    }
                    else
                    {
                        skippedCount++;
                    }
                }
            }

            if (addedCount == 0 && skippedCount > 0) return (false, "Sao chép thất bại: Kho tổng đã cạn kiệt, không thể cung cấp cho phòng này.");
            if (addedCount == 0) return (false, "Tất cả vật tư từ phòng nguồn đã có sẵn ở phòng đích.");

            _context.RoomInventories.AddRange(newItems);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_INVENTORY", "Sao chép Kho",
                $"[{userName}] vừa sao chép {addedCount} vật tư từ phòng {sourceRoom.RoomNumber} sang {targetRoom.RoomNumber}.");

            string msg = $"Đã sao chép thành công {addedCount} vật tư.";
            if (skippedCount > 0) msg += $" (Đã bỏ qua {skippedCount} món do kho tổng không đủ số lượng).";

            return (true, msg);
        }
        public async Task<(bool IsSuccess, string Message)> RequestRefillAsync(int id)
        {
            var inventory = await _context.RoomInventories
                .Include(ri => ri.Room)
                .Include(ri => ri.Equipment)
                .FirstOrDefaultAsync(ri => ri.Id == id);

            if (inventory == null) return (false, "Không tìm thấy vật tư trong phòng.");

            string roomNum = inventory.Room?.RoomNumber ?? "N/A";
            string equipName = inventory.Equipment?.Name ?? "Vật tư";
            string userName = await GetCurrentUserNameAsync();

            // 🔥 Bắn chuông thông báo Realtime thẳng cho người Quản lý kho (MANAGE_INVENTORY)
            await _notificationService.SendToPermissionAsync("MANAGE_INVENTORY", "Yêu cầu bổ sung đồ",
                $"[{userName}] yêu cầu bổ sung [{equipName}] cho phòng {roomNum}.");

            return (true, "Đã gửi yêu cầu bổ sung.");
        }
    }
}
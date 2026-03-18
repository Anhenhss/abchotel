using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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

        public RoomInventoryService(HotelDbContext context) => _context = context;

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
            // Kiểm tra xem phòng có tồn tại không
            if (!await _context.Rooms.AnyAsync(r => r.Id == request.RoomId))
                return (false, "Phòng không tồn tại trong hệ thống.");

            // Kiểm tra xem vật tư này đã có trong phòng chưa (tránh tạo trùng lặp ItemName)
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
            return (true, "Thêm vật tư vào phòng thành công.");
        }

        public async Task<bool> UpdateInventoryAsync(int id, UpdateRoomInventoryRequest request)
        {
            var inventory = await _context.RoomInventories.FindAsync(id);
            if (inventory == null) return false;

            inventory.ItemName = request.ItemName;
            inventory.Quantity = request.Quantity;
            inventory.PriceIfLost = request.PriceIfLost;
            inventory.ItemType = request.ItemType;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var inventory = await _context.RoomInventories.FindAsync(id);
            if (inventory == null) return false;

            inventory.IsActive = !inventory.IsActive; // Ngừng theo dõi vật tư này
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool IsSuccess, string Message)> CloneInventoryAsync(CloneInventoryRequest request)
        {
            if (request.SourceRoomId == request.TargetRoomId)
                return (false, "Phòng nguồn và phòng đích không được trùng nhau.");

            var targetRoomExists = await _context.Rooms.AnyAsync(r => r.Id == request.TargetRoomId);
            if (!targetRoomExists) return (false, "Phòng đích không tồn tại.");

            // Lấy danh sách vật tư đang hoạt động ở phòng nguồn
            var sourceItems = await _context.RoomInventories
                .Where(ri => ri.RoomId == request.SourceRoomId && ri.IsActive)
                .ToListAsync();

            if (!sourceItems.Any())
                return (false, "Phòng nguồn không có vật tư nào để sao chép.");

            // Lấy danh sách tên các vật tư ĐÃ CÓ ở phòng đích để tránh copy đè/trùng lặp
            var existingTargetItemNames = await _context.RoomInventories
                .Where(ri => ri.RoomId == request.TargetRoomId)
                .Select(ri => ri.ItemName)
                .ToListAsync();

            var newItems = new List<RoomInventory>();

            foreach (var item in sourceItems)
            {
                // Chỉ copy những món đồ mà phòng đích chưa có
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

            if (!newItems.Any())
                return (false, "Tất cả vật tư từ phòng nguồn đã có sẵn ở phòng đích.");

            _context.RoomInventories.AddRange(newItems);
            await _context.SaveChangesAsync();

            return (true, $"Đã sao chép thành công {newItems.Count} vật tư sang phòng đích.");
        }
    }
}
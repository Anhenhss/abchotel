using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http; // Bắt buộc thêm để lấy Token
using System.Security.Claims;    // Bắt buộc thêm để lấy thông tin User
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IEquipmentService
    {
        Task<List<EquipmentResponse>> GetAllEquipmentsAsync(bool onlyActive = false);
        Task<EquipmentResponse?> GetEquipmentByIdAsync(int id);
        Task<PaginatedEquipmentResponse> GetEquipmentsAsync(EquipmentFilterRequest filter);
        Task<(bool IsSuccess, string Message)> CreateEquipmentAsync(CreateEquipmentRequest request);
        Task<(bool IsSuccess, string Message)> UpdateEquipmentAsync(int id, UpdateEquipmentRequest request);
        Task<bool> ToggleSoftDeleteAsync(int id);
    }

    public class EquipmentService : IEquipmentService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        // 🔥 INJECT THÊM SERVICE THÔNG BÁO VÀO ĐÂY
        public EquipmentService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        // 🔥 HÀM LẤY TÊN NHÂN VIÊN ĐANG THAO TÁC TỪ TOKEN
        private async Task<string> GetCurrentUserNameAsync()
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId))
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.FullName ?? "Một nhân viên";
            }
            return "Hệ thống";
        }

        public async Task<List<EquipmentResponse>> GetAllEquipmentsAsync(bool onlyActive = false)
        {
            var query = _context.Equipments.AsQueryable();

            if (onlyActive)
            {
                query = query.Where(e => e.IsActive);
            }

            return await query.OrderByDescending(e => e.Id).Select(e => new EquipmentResponse
            {
                Id = e.Id,
                ItemCode = e.ItemCode,
                Name = e.Name,
                Category = e.Category,
                Unit = e.Unit,
                TotalQuantity = e.TotalQuantity,
                InUseQuantity = e.InUseQuantity,
                DamagedQuantity = e.DamagedQuantity,
                LiquidatedQuantity = e.LiquidatedQuantity,
                InStockQuantity = e.InStockQuantity,
                BasePrice = e.BasePrice,
                DefaultPriceIfLost = e.DefaultPriceIfLost,
                Supplier = e.Supplier,
                ImageUrl = e.ImageUrl,
                IsActive = e.IsActive
            }).ToListAsync();
        }

        public async Task<EquipmentResponse?> GetEquipmentByIdAsync(int id)
        {
            var e = await _context.Equipments.FindAsync(id);
            if (e == null) return null;

            return new EquipmentResponse
            {
                Id = e.Id,
                ItemCode = e.ItemCode,
                Name = e.Name,
                Category = e.Category,
                Unit = e.Unit,
                TotalQuantity = e.TotalQuantity,
                InUseQuantity = e.InUseQuantity,
                DamagedQuantity = e.DamagedQuantity,
                LiquidatedQuantity = e.LiquidatedQuantity,
                InStockQuantity = e.InStockQuantity,
                BasePrice = e.BasePrice,
                DefaultPriceIfLost = e.DefaultPriceIfLost,
                Supplier = e.Supplier,
                ImageUrl = e.ImageUrl,
                IsActive = e.IsActive
            };
        }

        public async Task<PaginatedEquipmentResponse> GetEquipmentsAsync(EquipmentFilterRequest filter)
        {
            var query = _context.Equipments.AsQueryable();

            if (!string.IsNullOrEmpty(filter.Search))
            {
                var keyword = filter.Search.ToLower();
                query = query.Where(e => e.ItemCode.ToLower().Contains(keyword) || e.Name.ToLower().Contains(keyword));
            }

            if (!string.IsNullOrEmpty(filter.Category))
            {
                query = query.Where(e => e.Category == filter.Category);
            }

            if (filter.IsActive.HasValue)
            {
                query = query.Where(e => e.IsActive == filter.IsActive.Value);
            }

            int totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(e => e.Id)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(e => new EquipmentResponse
                {
                    Id = e.Id,
                    ItemCode = e.ItemCode,
                    Name = e.Name,
                    Category = e.Category,
                    Unit = e.Unit,
                    TotalQuantity = e.TotalQuantity,
                    InUseQuantity = e.InUseQuantity,
                    DamagedQuantity = e.DamagedQuantity,
                    LiquidatedQuantity = e.LiquidatedQuantity,
                    InStockQuantity = e.InStockQuantity,
                    BasePrice = e.BasePrice,
                    DefaultPriceIfLost = e.DefaultPriceIfLost,
                    Supplier = e.Supplier,
                    ImageUrl = e.ImageUrl,
                    IsActive = e.IsActive
                })
                .ToListAsync();

            return new PaginatedEquipmentResponse
            {
                Total = totalCount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                Items = items
            };
        }

        public async Task<(bool IsSuccess, string Message)> CreateEquipmentAsync(CreateEquipmentRequest request)
        {
            string finalItemCode = request.ItemCode;

            // NẾU USER CÓ NHẬP MÃ: Kiểm tra xem mã đó có trùng không
            if (!string.IsNullOrEmpty(finalItemCode))
            {
                if (await _context.Equipments.AnyAsync(e => e.ItemCode == finalItemCode))
                {
                    return (false, "Mã vật tư này đã tồn tại trong hệ thống.");
                }
            }
            else 
            {
                // NẾU USER ĐỂ TRỐNG: Gán tạm 1 mã ngẫu nhiên để lưu lần 1
                finalItemCode = "TEMP-" + Guid.NewGuid().ToString().Substring(0, 8);
            }

            var equipment = new Equipment
            {
                ItemCode = finalItemCode,
                Name = request.Name,
                Category = request.Category,
                Unit = request.Unit,
                TotalQuantity = request.TotalQuantity,
                InUseQuantity = 0,
                DamagedQuantity = 0,
                LiquidatedQuantity = 0,
                BasePrice = request.BasePrice,
                DefaultPriceIfLost = request.DefaultPriceIfLost,
                Supplier = request.Supplier,
                ImageUrl = request.ImageUrl,
                IsActive = true,
                CreatedAt = System.DateTime.Now
            };

            _context.Equipments.Add(equipment);
            await _context.SaveChangesAsync(); // Lưu lần 1 để có ID

            // NẾU USER ĐỂ TRỐNG: Bây giờ mới tạo mã tự động dựa vào Danh mục và ID
            if (string.IsNullOrEmpty(request.ItemCode))
            {
                string prefix = request.Category switch
                {
                    "Điện tử" => "DT",
                    "Nội thất" => "NT",
                    "Minibar" => "MB",
                    "Đồ vải" => "DV",
                    "Tiêu hao" => "TH",
                    _ => "VT"
                };
                Random rnd = new Random();
                // Sinh mã chuẩn: VD: DV-22-1928
                equipment.ItemCode = $"{prefix}-{equipment.Id}-{rnd.Next(1000, 9999)}"; 
                await _context.SaveChangesAsync(); // Lưu lần 2
            }

            // ... (Đoạn code bắn Notification giữ nguyên)
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", "Kho vật tư", $"[{userName}] vừa thêm vật tư: {equipment.Name}."
            );

            return (true, "Tạo mới vật tư thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> UpdateEquipmentAsync(int id, UpdateEquipmentRequest request)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return (false, "Không tìm thấy vật tư.");

            equipment.Name = request.Name;
            equipment.Category = request.Category;
            equipment.Unit = request.Unit;
            equipment.TotalQuantity = request.TotalQuantity;
            equipment.InUseQuantity = request.InUseQuantity;
            equipment.DamagedQuantity = request.DamagedQuantity;
            equipment.LiquidatedQuantity = request.LiquidatedQuantity;
            equipment.BasePrice = request.BasePrice;
            equipment.DefaultPriceIfLost = request.DefaultPriceIfLost;
            equipment.Supplier = request.Supplier;
            equipment.ImageUrl = request.ImageUrl;
            equipment.UpdatedAt = System.DateTime.Now;

            await _context.SaveChangesAsync();

            // 🔥 BẮN THÔNG BÁO REALTIME KHI CẬP NHẬT
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Cập nhật Kho", 
                $"[{userName}] vừa cập nhật thông tin vật tư: {equipment.Name}."
            );

            return (true, "Cập nhật thông tin vật tư thành công.");
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var equipment = await _context.Equipments.FindAsync(id);
            if (equipment == null) return false;

            equipment.IsActive = !equipment.IsActive;
            await _context.SaveChangesAsync();

            // 🔥 BẮN THÔNG BÁO REALTIME KHI KHÓA / MỞ KHÓA
            string statusStr = equipment.IsActive ? "mở khóa" : "khóa";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Trạng thái Vật tư", 
                $"[{userName}] vừa {statusStr} vật tư: {equipment.Name}."
            );

            return true;
        }
    }
}
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
    public interface ILossDamageService
    {
        Task<PaginatedLossDamageResponse> GetAllLossDamagesAsync(LossDamageFilterRequest filter);
        Task<List<LossDamageResponse>> GetLossDamagesByBookingAsync(int bookingDetailId);
        Task<List<LossDamageResponse>> GetLossDamagesByRoomAsync(int roomId);
        Task<(bool IsSuccess, string Message)> ReportDamageAsync(int staffId, CreateLossDamageRequest request);
        Task<bool> UpdateStatusAsync(int id, string status);
        
    }

    public class LossDamageService : ILossDamageService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public LossDamageService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
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
                return user?.FullName ?? "Một nhân viên";
            }
            return "Hệ thống";
        }

        // 🔥 HÀM MỚI BỔ SUNG CHO TRANG BÁO CÁO TỔNG HỢP
        public async Task<PaginatedLossDamageResponse> GetAllLossDamagesAsync(LossDamageFilterRequest filter)
        {
            var query = _context.LossAndDamages
                .Include(ld => ld.RoomInventory).ThenInclude(ri => ri.Equipment)
                .Include(ld => ld.RoomInventory).ThenInclude(ri => ri.Room)
                .Include(ld => ld.BookingDetail).ThenInclude(bd => bd.Booking).ThenInclude(b => b.User)
                .Include(ld => ld.ReportedByNavigation)
                .AsQueryable();

            // 1. Lọc theo Status
            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(ld => ld.Status == filter.Status);

            // 2. Lọc theo Loại sự cố (DAMAGE, LOST)
            if (!string.IsNullOrEmpty(filter.IssueType))
                query = query.Where(ld => ld.IssueType == filter.IssueType);

            // 3. Lọc theo Từ ngày - Đến ngày
            if (filter.StartDate.HasValue)
                query = query.Where(ld => ld.CreatedAt >= filter.StartDate.Value.Date);
            
            if (filter.EndDate.HasValue)
            {
                var endDate = filter.EndDate.Value.Date.AddDays(1).AddTicks(-1); // Lấy đến hết ngày 23:59:59
                query = query.Where(ld => ld.CreatedAt <= endDate);
            }

            // 4. Tìm kiếm (Theo Số phòng hoặc Tên khách hoặc Tên vật tư)
            if (!string.IsNullOrEmpty(filter.Search))
            {
                var keyword = filter.Search.ToLower();
                query = query.Where(ld => 
                    (ld.RoomInventory.Room.RoomNumber.ToLower().Contains(keyword)) ||
                    (ld.BookingDetail.Booking.User.FullName.ToLower().Contains(keyword)) ||
                    (ld.RoomInventory.Equipment.Name.ToLower().Contains(keyword))
                );
            }

            // 5. Tính toán cho thẻ Thống Kê
            int totalCount = await query.CountAsync();
            decimal totalAmount = await query.SumAsync(ld => ld.PenaltyAmount);

            // 6. Phân trang
            var items = await query
                .OrderByDescending(ld => ld.CreatedAt)
                .Skip((filter.Page - 1) * filter.PageSize)
                .Take(filter.PageSize)
                .Select(ld => new LossDamageResponse
                {
                    Id = ld.Id,
                    BookingDetailId = ld.BookingDetailId,
                    ItemName = (ld.RoomInventory != null && ld.RoomInventory.Equipment != null) ? ld.RoomInventory.Equipment.Name : "N/A",
                    EquipmentName = (ld.RoomInventory != null && ld.RoomInventory.Equipment != null) ? ld.RoomInventory.Equipment.Name : "N/A",
                    RoomNumber = (ld.RoomInventory != null && ld.RoomInventory.Room != null) ? ld.RoomInventory.Room.RoomNumber : "N/A",
                    CustomerName = (ld.BookingDetail != null && ld.BookingDetail.Booking != null && ld.BookingDetail.Booking.User != null) ? ld.BookingDetail.Booking.User.FullName : "Khách vãng lai",
                    Quantity = ld.Quantity,
                    PenaltyAmount = ld.PenaltyAmount,
                    Description = ld.Description,
                    EvidenceImageUrl = ld.EvidenceImageUrl,
                    IssueType = ld.IssueType,
                    Status = ld.Status,
                    ReportedByName = ld.ReportedByNavigation != null ? ld.ReportedByNavigation.FullName : "System",
                    CreatedAt = ld.CreatedAt
                }).ToListAsync();

            return new PaginatedLossDamageResponse
            {
                Total = totalCount,
                TotalAmount = totalAmount,
                Page = filter.Page,
                PageSize = filter.PageSize,
                Items = items
            };
        }

        public async Task<List<LossDamageResponse>> GetLossDamagesByBookingAsync(int bookingDetailId)
        {
            return await _context.LossAndDamages
                .Include(ld => ld.RoomInventory)
                    .ThenInclude(ri => ri.Equipment)
                .Include(ld => ld.ReportedByNavigation)
                .Where(ld => ld.BookingDetailId == bookingDetailId)
                .Select(ld => new LossDamageResponse
                {
                    Id = ld.Id,
                    BookingDetailId = ld.BookingDetailId,
                    ItemName = (ld.RoomInventory != null && ld.RoomInventory.Equipment != null) ? ld.RoomInventory.Equipment.Name : "N/A",
                    Quantity = ld.Quantity,
                    PenaltyAmount = ld.PenaltyAmount,
                    Description = ld.Description,
                    EvidenceImageUrl = ld.EvidenceImageUrl,
                    IssueType = ld.IssueType,
                    Status = ld.Status,
                    ReportedByName = ld.ReportedByNavigation != null ? ld.ReportedByNavigation.FullName : "System",
                    CreatedAt = ld.CreatedAt
                }).OrderByDescending(ld => ld.CreatedAt).ToListAsync();
        }

        public async Task<List<LossDamageResponse>> GetLossDamagesByRoomAsync(int roomId)
        {
            return await _context.LossAndDamages
                .Include(ld => ld.RoomInventory).ThenInclude(ri => ri.Equipment)
                .Include(ld => ld.ReportedByNavigation)
                .Where(ld => ld.RoomInventory.RoomId == roomId) // Lọc theo Phòng
                .Select(ld => new LossDamageResponse
                {
                    Id = ld.Id,
                    BookingDetailId = ld.BookingDetailId,
                    ItemName = (ld.RoomInventory != null && ld.RoomInventory.Equipment != null) ? ld.RoomInventory.Equipment.Name : "N/A",
                    Quantity = ld.Quantity,
                    PenaltyAmount = ld.PenaltyAmount,
                    Description = ld.Description,
                    EvidenceImageUrl = ld.EvidenceImageUrl,
                    IssueType = ld.IssueType,
                    Status = ld.Status,
                    ReportedByName = ld.ReportedByNavigation != null ? ld.ReportedByNavigation.FullName : "System",
                    CreatedAt = ld.CreatedAt
                }).OrderByDescending(ld => ld.CreatedAt).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> ReportDamageAsync(int staffId, CreateLossDamageRequest request)
        {
            var inventoryItem = await _context.RoomInventories
                .Include(ri => ri.Room)
                .Include(ri => ri.Equipment)
                .FirstOrDefaultAsync(ri => ri.Id == request.RoomInventoryId);

            if (inventoryItem == null) return (false, "Không tìm thấy thông tin vật tư này trong phòng.");

            if (request.Quantity <= 0) return (false, "Số lượng hư hỏng phải lớn hơn 0.");

            decimal penalty = (inventoryItem.PriceIfLost ?? 0) * request.Quantity;

            var lossRecord = new LossAndDamage
            {
                BookingDetailId = request.BookingDetailId,
                RoomInventoryId = request.RoomInventoryId,
                Quantity = request.Quantity,
                PenaltyAmount = penalty,
                Description = request.Description,
                EvidenceImageUrl = request.EvidenceImageUrl,
                IssueType = request.IssueType,
                Status = "Pending", // Mặc định là Chờ xử lý
                ReportedBy = staffId,
                CreatedAt = DateTime.Now
            };

            // Trừ đi số lượng vật tư thực tế trong phòng
            if (inventoryItem.Quantity.HasValue)
            {
                inventoryItem.Quantity -= request.Quantity;
                if (inventoryItem.Quantity < 0) inventoryItem.Quantity = 0;
            }

            _context.LossAndDamages.Add(lossRecord);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            string roomNumStr = inventoryItem.Room != null ? inventoryItem.Room.RoomNumber : "N/A";
            string actionStr = request.IssueType == "Damaged" ? "làm hỏng" : "làm mất";
            string equipName = inventoryItem.Equipment != null ? inventoryItem.Equipment.Name : "vật tư";

            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVOICES", 
                "Cảnh báo: Ghi nhận sự cố mới",
                $"[{userName}] vừa báo cáo phòng {roomNumStr} {actionStr} {request.Quantity} {equipName}. Phạt dự kiến: {penalty:N0} VNĐ."
            );

            return (true, $"Ghi nhận thành công. Trạng thái: Chờ xử lý. Phạt: {penalty:N0} VNĐ.");
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var record = await _context.LossAndDamages
                .Include(ld => ld.RoomInventory)
                    .ThenInclude(ri => ri.Equipment) 
                .Include(ld => ld.RoomInventory)
                    .ThenInclude(ri => ri.Room) // Lấy thêm thông tin phòng để ghi vào thông báo
                .FirstOrDefaultAsync(ld => ld.Id == id);
                
            if (record == null) return false;

            // LOGIC HỦY BỎ (CANCELLED): Báo nhầm -> Xóa tiền phạt & Cộng trả lại đồ vào kho
            if (record.Status != "Cancelled" && status == "Cancelled")
            {
                record.PenaltyAmount = 0; 
                if (record.RoomInventory != null && record.RoomInventory.Quantity.HasValue)
                {
                    record.RoomInventory.Quantity += record.Quantity; 
                }
            }

            record.Status = status;
            await _context.SaveChangesAsync();

            // 🔔 BẮN THÔNG BÁO CHO KHO BIẾT TÌNH TRẠNG
            string statusVn = status switch
            {
                "Confirmed" => "đã được khách xác nhận",
                "Paid" => "đã được thanh toán",
                "Cancelled" => "bị hủy bỏ do báo nhầm",
                "Disputed" => "đang bị khách tranh chấp",
                _ => "đang chờ xử lý"
            };

            string itemName = (record.RoomInventory != null && record.RoomInventory.Equipment != null) 
                                ? record.RoomInventory.Equipment.Name 
                                : "vật tư";
            string roomNumStr = record.RoomInventory?.Room?.RoomNumber ?? "N/A";                    
            string userName = await GetCurrentUserNameAsync();

            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Cập nhật Trạng thái Đền bù", 
                $"[{userName}] đã cập nhật khoản đền bù phòng {roomNumStr} ({record.Quantity} {itemName}): {statusVn}."
            );

            return true;
        }
    }
}
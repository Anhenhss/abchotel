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
        Task<List<LossDamageResponse>> GetLossDamagesByBookingAsync(int bookingDetailId);
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

        public async Task<List<LossDamageResponse>> GetLossDamagesByBookingAsync(int bookingDetailId)
        {
            return await _context.LossAndDamages
                .Include(ld => ld.RoomInventory)
                .Include(ld => ld.ReportedByNavigation)
                .Where(ld => ld.BookingDetailId == bookingDetailId)
                .Select(ld => new LossDamageResponse
                {
                    Id = ld.Id,
                    BookingDetailId = ld.BookingDetailId,
                    ItemName = ld.RoomInventory != null ? ld.RoomInventory.ItemName : "N/A",
                    Quantity = ld.Quantity,
                    PenaltyAmount = ld.PenaltyAmount,
                    Description = ld.Description,
                    IssueType = ld.IssueType,
                    Status = ld.Status,
                    ReportedByName = ld.ReportedByNavigation != null ? ld.ReportedByNavigation.FullName : "System",
                    CreatedAt = ld.CreatedAt
                }).OrderByDescending(ld => ld.CreatedAt).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> ReportDamageAsync(int staffId, CreateLossDamageRequest request)
        {
            var inventoryItem = await _context.RoomInventories.Include(ri => ri.Room).FirstOrDefaultAsync(ri => ri.Id == request.RoomInventoryId);
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

            // 🔔 BẮN THÔNG BÁO CHO LỄ TÂN
            string userName = await GetCurrentUserNameAsync();
            string roomNumStr = inventoryItem.Room != null ? inventoryItem.Room.RoomNumber : "N/A";
            string actionStr = request.IssueType == "Damaged" ? "làm hỏng" : "làm mất";
            
            await _notificationService.SendToPermissionAsync(
                "MANAGE_BOOKINGS", 
                "Cảnh báo: Khách đền bù", 
                $"[{userName}] báo phòng {roomNumStr} {actionStr} {request.Quantity} {inventoryItem.ItemName}. Phạt: {penalty:N0}đ."
            );

            return (true, $"Ghi nhận thành công. Trạng thái: Chờ xử lý. Phạt: {penalty:N0} VNĐ.");
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var record = await _context.LossAndDamages.Include(ld => ld.RoomInventory).FirstOrDefaultAsync(ld => ld.Id == id);
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

            string itemName = record.RoomInventory != null ? record.RoomInventory.ItemName : "vật tư";
            string userName = await GetCurrentUserNameAsync();

            await _notificationService.SendToPermissionAsync(
                "MANAGE_INVENTORY", 
                "Trạng thái Đền bù", 
                $"[{userName}] cập nhật: Khoản đền bù {record.Quantity} {itemName} {statusVn}."
            );

            return true;
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
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

        public LossDamageService(HotelDbContext context) => _context = context;

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
                }).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> ReportDamageAsync(int staffId, CreateLossDamageRequest request)
        {
            var inventoryItem = await _context.RoomInventories.FindAsync(request.RoomInventoryId);
            if (inventoryItem == null) return (false, "Không tìm thấy thông tin vật tư này trong phòng.");

            if (request.Quantity <= 0) return (false, "Số lượng hư hỏng phải lớn hơn 0.");

            // LOGIC CỐT LÕI: Tự động tính tiền phạt
            decimal penalty = (inventoryItem.PriceIfLost ?? 0) * request.Quantity;

            var lossRecord = new LossAndDamage
            {
                BookingDetailId = request.BookingDetailId,
                RoomInventoryId = request.RoomInventoryId,
                Quantity = request.Quantity,
                PenaltyAmount = penalty, // Gắn tiền đền bù vào
                Description = request.Description,
                IssueType = request.IssueType,
                Status = "Pending", // Mặc định là chờ khách thanh toán
                ReportedBy = staffId,
                CreatedAt = DateTime.Now
            };

            // Trừ đi số lượng vật tư thực tế trong phòng (Ví dụ: Phòng có 2 khăn, mất 1 thì cập nhật lại còn 1)
            if (inventoryItem.Quantity.HasValue)
            {
                inventoryItem.Quantity -= request.Quantity;
                if (inventoryItem.Quantity < 0) inventoryItem.Quantity = 0;
            }

            _context.LossAndDamages.Add(lossRecord);
            await _context.SaveChangesAsync();

            return (true, $"Ghi nhận hư hỏng thành công. Tiền phạt dự kiến: {penalty:N0} VNĐ.");
        }

        public async Task<bool> UpdateStatusAsync(int id, string status)
        {
            var record = await _context.LossAndDamages.FindAsync(id);
            if (record == null) return false;

            record.Status = status;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
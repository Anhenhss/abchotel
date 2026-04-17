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
    public interface IVoucherService
    {
        Task<List<VoucherResponse>> GetAllVouchersAsync(bool onlyActive = false);
        Task<VoucherResponse> GetVoucherByIdAsync(int id);
        Task<(bool IsSuccess, string Message)> CreateVoucherAsync(CreateVoucherRequest request);
        Task<(bool IsSuccess, string Message)> UpdateVoucherAsync(int id, UpdateVoucherRequest request);
        Task<bool> ToggleSoftDeleteAsync(int id);
        
        // 🔥 Tính năng kiểm tra và tính toán giảm giá
        Task<ValidateVoucherResponse> ValidateAndCalculateDiscountAsync(int userId, ValidateVoucherRequest request);
    }

    public class VoucherService : IVoucherService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public VoucherService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
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
                return user?.FullName ?? "Quản trị viên";
            }
            return "Hệ thống";
        }

        public async Task<List<VoucherResponse>> GetAllVouchersAsync(bool onlyActive = false)
        {
            var query = _context.Vouchers.Include(v => v.RoomType).Include(v => v.Bookings).AsQueryable();

            if (onlyActive) query = query.Where(v => v.IsActive);

            return await query.OrderByDescending(v => v.CreatedAt).Select(v => new VoucherResponse
            {
                Id = v.Id,
                Code = v.Code,
                DiscountType = v.DiscountType,
                DiscountValue = v.DiscountValue,
                MinBookingValue = v.MinBookingValue,
                MaxDiscountAmount = v.MaxDiscountAmount,
                RoomTypeId = v.RoomTypeId,
                RoomTypeName = v.RoomType != null ? v.RoomType.Name : "Tất cả hạng phòng",
                ValidFrom = v.ValidFrom,
                ValidTo = v.ValidTo,
                UsageLimit = v.UsageLimit,
                UsedCount = v.Bookings.Count(b => b.Status != "Cancelled"), // Đếm số lần mã đã được dùng
                MaxUsesPerUser = v.MaxUsesPerUser,
                IsActive = v.IsActive
            }).ToListAsync();
        }

        public async Task<VoucherResponse> GetVoucherByIdAsync(int id)
        {
            var v = await _context.Vouchers.Include(v => v.RoomType).Include(v => v.Bookings).FirstOrDefaultAsync(x => x.Id == id);
            if (v == null) return null;

            return new VoucherResponse
            {
                Id = v.Id, Code = v.Code, DiscountType = v.DiscountType, DiscountValue = v.DiscountValue,
                MinBookingValue = v.MinBookingValue, MaxDiscountAmount = v.MaxDiscountAmount,
                RoomTypeId = v.RoomTypeId, RoomTypeName = v.RoomType != null ? v.RoomType.Name : "Tất cả",
                ValidFrom = v.ValidFrom, ValidTo = v.ValidTo, UsageLimit = v.UsageLimit,
                UsedCount = v.Bookings.Count(b => b.Status != "Cancelled"), MaxUsesPerUser = v.MaxUsesPerUser, IsActive = v.IsActive
            };
        }

        public async Task<(bool IsSuccess, string Message)> CreateVoucherAsync(CreateVoucherRequest request)
        {
            // 🔥 THUẬT TOÁN XỬ LÝ MÃ CODE TỰ ĐỘNG
            string finalCode = request.Code?.Trim().ToUpper();

            if (string.IsNullOrWhiteSpace(finalCode))
            {
                // Nếu không nhập, tự động sinh mã
                // Ví dụ giảm 50.000 -> "V50K", giảm 15% -> "P15"
                string prefix = request.DiscountType == "PERCENT" 
                    ? $"P{request.DiscountValue:0}" 
                    : $"V{request.DiscountValue / 1000:0}K";
                
                // Nối với 6 ký tự ngẫu nhiên
                string randomStr = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
                finalCode = $"{prefix}-{randomStr}"; // Kết quả VD: P15-A8B9C2 hoặc V50K-112233
            }

            // Kiểm tra xem mã (gõ tay hoặc tự sinh) có bị trùng với mã cũ trong Database không
            if (await _context.Vouchers.AnyAsync(v => v.Code.ToUpper() == finalCode))
                return (false, "Mã khuyến mãi này đã tồn tại trong hệ thống. Vui lòng chọn mã khác.");

            var voucher = new Voucher
            {
                Code = finalCode, 
                DiscountType = request.DiscountType, 
                DiscountValue = request.DiscountValue,
                MinBookingValue = request.MinBookingValue, 
                MaxDiscountAmount = request.MaxDiscountAmount,
                RoomTypeId = request.RoomTypeId, 
                ValidFrom = request.ValidFrom, 
                ValidTo = request.ValidTo,
                UsageLimit = request.UsageLimit, 
                MaxUsesPerUser = request.MaxUsesPerUser, 
                IsActive = true, 
                CreatedAt = DateTime.Now
            };

            _context.Vouchers.Add(voucher);
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_VOUCHERS", "Tạo Mã Khuyến Mãi", $"[{userName}] vừa tạo mã giảm giá mới: {voucher.Code}.");

            return (true, "Tạo mã khuyến mãi thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> UpdateVoucherAsync(int id, UpdateVoucherRequest request)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null) return (false, "Không tìm thấy mã khuyến mãi.");

            if (voucher.Code.ToUpper() != request.Code.ToUpper())
            {
                if (await _context.Vouchers.AnyAsync(v => v.Code.ToUpper() == request.Code.ToUpper()))
                    return (false, "Mã khuyến mãi này đã tồn tại.");
            }

            voucher.Code = request.Code.ToUpper(); voucher.DiscountType = request.DiscountType;
            voucher.DiscountValue = request.DiscountValue; voucher.MinBookingValue = request.MinBookingValue;
            voucher.MaxDiscountAmount = request.MaxDiscountAmount; voucher.RoomTypeId = request.RoomTypeId;
            voucher.ValidFrom = request.ValidFrom; voucher.ValidTo = request.ValidTo;
            voucher.UsageLimit = request.UsageLimit; voucher.MaxUsesPerUser = request.MaxUsesPerUser;
            voucher.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_VOUCHERS", "Cập nhật Mã Khuyến Mãi", $"[{userName}] vừa cập nhật thông tin mã: {voucher.Code}.");

            return (true, "Cập nhật thành công.");
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null) return false;

            voucher.IsActive = !voucher.IsActive;
            await _context.SaveChangesAsync();

            string action = voucher.IsActive ? "kích hoạt lại" : "tạm ngưng";
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_VOUCHERS", "Trạng thái Khuyến Mãi", $"[{userName}] vừa {action} mã: {voucher.Code}.");

            return true;
        }

        // 🔥 THUẬT TOÁN KIỂM TRA MÃ VÀ TÍNH TIỀN
        public async Task<ValidateVoucherResponse> ValidateAndCalculateDiscountAsync(int userId, ValidateVoucherRequest request)
        {
            var voucher = await _context.Vouchers.Include(v => v.Bookings).FirstOrDefaultAsync(v => v.Code.ToUpper() == request.Code.ToUpper());

            if (voucher == null || !voucher.IsActive)
                return new ValidateVoucherResponse { IsValid = false, Message = "Mã khuyến mãi không tồn tại hoặc đã hết hạn." };

            if (voucher.ValidFrom.HasValue && DateTime.Now < voucher.ValidFrom.Value)
                return new ValidateVoucherResponse { IsValid = false, Message = $"Mã này chỉ có hiệu lực từ ngày {voucher.ValidFrom.Value:dd/MM/yyyy}." };

            if (voucher.ValidTo.HasValue && DateTime.Now > voucher.ValidTo.Value)
                return new ValidateVoucherResponse { IsValid = false, Message = "Mã khuyến mãi đã hết hạn." };

            if (voucher.MinBookingValue.HasValue && request.TotalBookingValue < voucher.MinBookingValue.Value)
                return new ValidateVoucherResponse { IsValid = false, Message = $"Đơn hàng phải từ {voucher.MinBookingValue.Value:N0}đ để áp dụng mã này." };

            if (voucher.RoomTypeId.HasValue && voucher.RoomTypeId != request.RoomTypeId)
                return new ValidateVoucherResponse { IsValid = false, Message = "Mã này không áp dụng cho hạng phòng bạn đang chọn." };

            if (voucher.UsageLimit.HasValue)
            {
                int totalUsed = voucher.Bookings.Count(b => b.Status != "Cancelled");
                if (totalUsed >= voucher.UsageLimit.Value)
                    return new ValidateVoucherResponse { IsValid = false, Message = "Mã khuyến mãi đã hết lượt sử dụng." };
            }

            int usedByUser = voucher.Bookings.Count(b => b.UserId == userId && b.Status != "Cancelled");
            if (usedByUser >= voucher.MaxUsesPerUser)
                return new ValidateVoucherResponse { IsValid = false, Message = "Bạn đã dùng hết số lượt cho phép của mã này." };

            if (voucher.IsForNewCustomer)
            {
                // Đếm xem ông khách này đã từng đặt phòng nào chưa (loại trừ các đơn bị Hủy)
                int totalPastBookings = await _context.Bookings
                    .CountAsync(b => b.UserId == userId && b.Status != "Cancelled");

                if (totalPastBookings > 0)
                {
                    return new ValidateVoucherResponse 
                    { 
                        IsValid = false, 
                        Message = "Rất tiếc! Mã giảm giá này chỉ dành riêng cho khách hàng đặt phòng lần đầu." 
                    };
                }
            }

            // Tính toán số tiền được giảm
            decimal discountAmount = 0;
            if (voucher.DiscountType == "PERCENT")
            {
                discountAmount = request.TotalBookingValue * (voucher.DiscountValue / 100);
                if (voucher.MaxDiscountAmount.HasValue && discountAmount > voucher.MaxDiscountAmount.Value)
                    discountAmount = voucher.MaxDiscountAmount.Value;
            }
            else if (voucher.DiscountType == "FIXED_AMOUNT")
            {
                discountAmount = voucher.DiscountValue;
            }

            // Nếu tiền giảm lớn hơn tổng đơn thì chỉ giảm tối đa bằng tổng đơn
            if (discountAmount > request.TotalBookingValue) discountAmount = request.TotalBookingValue;

            return new ValidateVoucherResponse
            {
                IsValid = true,
                Message = "Áp dụng mã giảm giá thành công!",
                DiscountAmount = discountAmount,
                FinalTotal = request.TotalBookingValue - discountAmount
            };
        }
    }
}
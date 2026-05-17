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
        Task<List<VoucherResponse>> GetBirthdayVouchersAsync(int userId);
        Task<List<VoucherResponse>> GetVipVouchersAsync(int userId);
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

            if (onlyActive)
            {
                var now = DateTime.Now;
                query = query.Where(v => v.IsActive
                                    && (v.ValidFrom == null || v.ValidFrom <= now)
                                    && (v.ValidTo == null || v.ValidTo >= now)
                                    && (v.UsageLimit == null || v.Bookings.Count(b => b.Status != "Cancelled") < v.UsageLimit));
            }

            // Đọc thông tin User từ HttpContext ngầm thông qua Token gửi kèm trong Header
            var claims = _httpContextAccessor.HttpContext?.User?.Claims;
            var userIdStr = claims?.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier)?.Value
                         ?? claims?.FirstOrDefault(c => c.Type == "sub")?.Value;

            int? currentUserId = int.TryParse(userIdStr, out int id) ? id : null;

            if (currentUserId.HasValue)
            {
                // TRƯỜNG HỢP 1: ĐÃ ĐĂNG NHẬP
                var user = await _context.Users.Include(u => u.Membership).FirstOrDefaultAsync(u => u.Id == currentUserId.Value);
                bool isVip = user?.Membership?.TierName?.ToUpper() == "VIP";
                
                // Kiểm tra xem user này đã từng đặt phòng thành công chưa
                bool hasPreviousBooking = await _context.Bookings.AnyAsync(b => b.UserId == currentUserId.Value && b.Status != "Cancelled");

                query = query.Where(v => 
                    // 1. Voucher bình thường (Không phải VIP/Sinh nhật) và kiểm tra điều kiện khách mới nếu có
                    (v.DiscountType != "VIP_ONLY" && v.DiscountType != "BIRTHDAY" && (!v.IsForNewCustomer || !hasPreviousBooking)) 
                    
                    // 2. Voucher VIP: Chỉ hiện khi tài khoản là hạng VIP
                    || (v.DiscountType == "VIP_ONLY" && isVip)
                    
                    // 3. Voucher Sinh nhật: Chỉ hiện khi hôm nay trúng ngày sinh nhật của tài khoản này
                    || (v.DiscountType == "BIRTHDAY" && user != null && user.DateOfBirth.HasValue 
                        && user.DateOfBirth.Value.Day == DateTime.Now.Day && user.DateOfBirth.Value.Month == DateTime.Now.Month)
                );
            }
            else
            {
                // TRƯỜNG HỢP 2: CHƯA ĐĂNG NHẬP (KHÁCH VÃNG LAI)
                // 1. Cho phép thấy Voucher bình thường và Voucher người mới (IsForNewCustomer = true)
                // 2. Ẩn hoàn toàn Voucher VIP_ONLY và BIRTHDAY 
                query = query.Where(v => v.DiscountType != "VIP_ONLY" && v.DiscountType != "BIRTHDAY");
            }

            return await query.OrderByDescending(v => v.CreatedAt).Select(v => new VoucherResponse
            {
                Id = v.Id,
                Code = v.Code,
                DiscountType = v.DiscountType,
                DiscountValue = v.DiscountValue,
                MinBookingValue = v.MinBookingValue,
                MaxDiscountAmount = v.MaxDiscountAmount,
                RoomTypeId = v.RoomTypeId,
                RoomTypeName = v.RoomType != null ? v.RoomType.Name :
                            (v.DiscountType == "VIP_ONLY" ? "Đặc quyền VIP" :
                            (v.DiscountType == "BIRTHDAY" ? "Quà tặng sinh nhật" : "Tất cả hạng phòng")),
                ValidFrom = v.ValidFrom,
                ValidTo = v.ValidTo,
                UsageLimit = v.UsageLimit,
                UsedCount = v.Bookings.Count(b => b.Status != "Cancelled"),
                MaxUsesPerUser = v.MaxUsesPerUser,
                IsForNewCustomer = v.IsForNewCustomer,
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
                UsedCount = v.Bookings.Count(b => b.Status != "Cancelled"), MaxUsesPerUser = v.MaxUsesPerUser,
                IsActive = v.IsActive, IsForNewCustomer = v.IsForNewCustomer
            };
        }

        public async Task<(bool IsSuccess, string Message)> CreateVoucherAsync(CreateVoucherRequest request)
        {
            string finalCode = request.Code?.Trim().ToUpper();
            if (string.IsNullOrWhiteSpace(finalCode))
            {
                string prefix = request.DiscountType == "PERCENT" ? $"P{request.DiscountValue:0}" : $"V{request.DiscountValue / 1000:0}K";
                string randomStr = Guid.NewGuid().ToString("N").Substring(0, 6).ToUpper();
                finalCode = $"{prefix}-{randomStr}";
            }

            if (await _context.Vouchers.AnyAsync(v => v.Code.ToUpper() == finalCode))
                return (false, "Mã khuyến mãi này đã tồn tại.");

            var voucher = new Voucher
            {
                Code = finalCode, DiscountType = request.DiscountType, DiscountValue = request.DiscountValue,
                MinBookingValue = request.MinBookingValue, MaxDiscountAmount = request.MaxDiscountAmount,
                RoomTypeId = request.RoomTypeId, ValidFrom = request.ValidFrom, ValidTo = request.ValidTo,
                UsageLimit = request.UsageLimit, MaxUsesPerUser = request.MaxUsesPerUser,
                IsForNewCustomer = request.IsForNewCustomer, IsActive = true, CreatedAt = DateTime.Now
            };

            _context.Vouchers.Add(voucher);
            await _context.SaveChangesAsync();
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_VOUCHERS", "Tạo Mã Khuyến Mãi", $"[{userName}] vừa tạo mã: {voucher.Code}.");
            return (true, "Tạo thành công.");
        }

        public async Task<(bool IsSuccess, string Message)> UpdateVoucherAsync(int id, UpdateVoucherRequest request)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null) return (false, "Không tìm thấy.");

            if (voucher.Code.ToUpper() != request.Code.ToUpper() && await _context.Vouchers.AnyAsync(v => v.Code.ToUpper() == request.Code.ToUpper()))
                return (false, "Mã này đã tồn tại.");

            voucher.Code = request.Code.ToUpper();
            voucher.DiscountType = request.DiscountType;
            voucher.DiscountValue = request.DiscountValue;
            voucher.MinBookingValue = request.MinBookingValue;
            voucher.MaxDiscountAmount = request.MaxDiscountAmount;
            voucher.RoomTypeId = request.RoomTypeId;
            voucher.ValidFrom = request.ValidFrom;
            voucher.ValidTo = request.ValidTo;
            voucher.UsageLimit = request.UsageLimit;
            voucher.MaxUsesPerUser = request.MaxUsesPerUser;
            voucher.IsForNewCustomer = request.IsForNewCustomer;
            voucher.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_VOUCHERS", "Cập nhật Mã", $"[{userName}] vừa sửa mã: {voucher.Code}.");
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
            await _notificationService.SendToPermissionAsync("MANAGE_VOUCHERS", "Trạng thái", $"[{userName}] vừa {action} mã: {voucher.Code}.");
            return true;
        }

        public async Task<ValidateVoucherResponse> ValidateAndCalculateDiscountAsync(int userId, ValidateVoucherRequest request)
        {
            var voucher = await _context.Vouchers.Include(v => v.Bookings).FirstOrDefaultAsync(v => v.Code.ToUpper() == request.Code.ToUpper());

            if (voucher == null || !voucher.IsActive)
                return new ValidateVoucherResponse { IsValid = false, Message = "Mã không khả dụng." };

            if (voucher.ValidFrom.HasValue && DateTime.Now < voucher.ValidFrom.Value)
                return new ValidateVoucherResponse { IsValid = false, Message = $"Mã có hiệu lực từ {voucher.ValidFrom.Value:dd/MM/yyyy}." };

            if (voucher.ValidTo.HasValue && DateTime.Now > voucher.ValidTo.Value)
                return new ValidateVoucherResponse { IsValid = false, Message = "Mã hết hạn." };

            if (voucher.MinBookingValue.HasValue && request.TotalBookingValue < voucher.MinBookingValue.Value)
                return new ValidateVoucherResponse { IsValid = false, Message = $"Đơn phải từ {voucher.MinBookingValue.Value:N0}đ." };

            if (voucher.RoomTypeId.HasValue && voucher.RoomTypeId != request.RoomTypeId)
                return new ValidateVoucherResponse { IsValid = false, Message = "Không áp dụng cho hạng phòng này." };

            int usedCount = voucher.Bookings.Count(b => b.Status != "Cancelled");
            if (voucher.UsageLimit.HasValue && usedCount >= voucher.UsageLimit.Value)
                return new ValidateVoucherResponse { IsValid = false, Message = "Hết lượt sử dụng." };

            int usedByUser = voucher.Bookings.Count(b => b.UserId == userId && b.Status != "Cancelled");
            if (usedByUser >= voucher.MaxUsesPerUser)
                return new ValidateVoucherResponse { IsValid = false, Message = "Bạn đã hết lượt dùng mã này." };

            if (voucher.IsForNewCustomer && await _context.Bookings.AnyAsync(b => b.UserId == userId && b.Status != "Cancelled"))
                return new ValidateVoucherResponse { IsValid = false, Message = "Chỉ dành cho khách hàng mới." };

            decimal discountAmount = voucher.DiscountType == "PERCENT" 
                ? Math.Min(request.TotalBookingValue * (voucher.DiscountValue / 100), voucher.MaxDiscountAmount ?? decimal.MaxValue)
                : voucher.DiscountValue;

            discountAmount = Math.Min(discountAmount, request.TotalBookingValue);

            return new ValidateVoucherResponse
            {
                IsValid = true,
                Message = "Áp dụng thành công!",
                DiscountAmount = discountAmount,
                FinalTotal = request.TotalBookingValue - discountAmount
            };
        }

        public async Task<List<VoucherResponse>> GetBirthdayVouchersAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null || !user.DateOfBirth.HasValue) return new List<VoucherResponse>();

            var today = DateTime.Now;
            if (user.DateOfBirth.Value.Day != today.Day || user.DateOfBirth.Value.Month != today.Month)
                return new List<VoucherResponse>();

            return await _context.Vouchers.Include(v => v.RoomType).Include(v => v.Bookings)
                .Where(v => v.IsActive && v.DiscountType == "BIRTHDAY" && (v.ValidTo == null || v.ValidTo >= DateTime.Now))
                .Select(v => new VoucherResponse
                {
                    Id = v.Id, Code = v.Code, DiscountType = v.DiscountType, DiscountValue = v.DiscountValue,
                    MinBookingValue = v.MinBookingValue, MaxDiscountAmount = v.MaxDiscountAmount,
                    RoomTypeId = v.RoomTypeId, RoomTypeName = "Quà tặng sinh nhật",
                    ValidFrom = v.ValidFrom, ValidTo = v.ValidTo, IsActive = v.IsActive
                }).ToListAsync();
        }

        public async Task<List<VoucherResponse>> GetVipVouchersAsync(int userId)
        {
            var user = await _context.Users.Include(u => u.Membership).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.Membership?.TierName?.ToUpper() != "VIP") return new List<VoucherResponse>();

            return await _context.Vouchers.Include(v => v.RoomType).Include(v => v.Bookings)
                .Where(v => v.IsActive && v.DiscountType == "VIP_ONLY" && (v.ValidTo == null || v.ValidTo >= DateTime.Now))
                .Select(v => new VoucherResponse
                {
                    Id = v.Id, Code = v.Code, DiscountType = v.DiscountType, DiscountValue = v.DiscountValue,
                    MinBookingValue = v.MinBookingValue, MaxDiscountAmount = v.MaxDiscountAmount,
                    RoomTypeId = v.RoomTypeId, RoomTypeName = "Đặc quyền VIP",
                    ValidFrom = v.ValidFrom, ValidTo = v.ValidTo, IsActive = v.IsActive
                }).ToListAsync();
        }
    }
}
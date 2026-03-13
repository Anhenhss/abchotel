using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.DTOs; 
using abchotel.Models;

namespace abchotel.Services
{
    public interface IVoucherService
    {
        // Hàm cho Khách hàng
        Task<ApplyVoucherResponse> ApplyVoucherAsync(ApplyVoucherRequest request);

        // Các hàm cho Admin (CRUD)
        Task<IEnumerable<Voucher>> GetAllVouchersAsync();
        Task<Voucher> GetVoucherByIdAsync(int id);
        Task<Voucher> CreateVoucherAsync(Voucher voucher);
        Task<string> UpdateVoucherAsync(int id, Voucher voucher);
        Task<Voucher> ToggleVoucherStatusAsync(int id);
    }

    public class VoucherService : IVoucherService
    {
        private readonly HotelDbContext _context;

        public VoucherService(HotelDbContext context)
        {
            _context = context;
        }
        // 1. LOGIC ÁP DỤNG VOUCHER (DÀNH CHO KHÁCH)
        public async Task<ApplyVoucherResponse> ApplyVoucherAsync(ApplyVoucherRequest request)
        {
            var response = new ApplyVoucherResponse { IsSuccess = false, DiscountAmount = 0 };

            // 1. Kiểm tra tồn tại và cờ IsActive
            var voucher = await _context.Vouchers
                .FirstOrDefaultAsync(v => v.Code == request.VoucherCode && v.IsActive == true);

            if (voucher == null)
            {
                response.Message = "Mã khuyến mãi không tồn tại hoặc đã bị vô hiệu hóa.";
                return response;
            }

            // 2. Kiểm tra thời hạn
            var now = DateTime.Now;
            if ((voucher.ValidFrom.HasValue && now < voucher.ValidFrom.Value) ||
                (voucher.ValidTo.HasValue && now > voucher.ValidTo.Value))
            {
                response.Message = "Mã khuyến mãi không nằm trong thời gian áp dụng.";
                return response;
            }

            // 3. Kiểm tra đơn tối thiểu
            if (voucher.MinBookingValue.HasValue && request.TotalRoomAmount < voucher.MinBookingValue.Value)
            {
                response.Message = $"Đơn hàng cần đạt tối thiểu {voucher.MinBookingValue.Value:N0}đ để sử dụng mã này.";
                return response;
            }

            // 4. Kiểm tra loại phòng được áp dụng (NULL = áp dụng mọi phòng)
            if (voucher.RoomTypeId.HasValue && voucher.RoomTypeId.Value != request.RoomTypeId)
            {
                response.Message = "Mã khuyến mãi này không áp dụng cho loại phòng bạn chọn.";
                return response;
            }

            // 5. Kiểm tra giới hạn TỔNG lượt dùng của hệ thống
            if (voucher.UsageLimit.HasValue)
            {
                int totalUsed = await _context.Bookings.CountAsync(b => b.VoucherId == voucher.Id && b.Status != "Cancelled");
                if (totalUsed >= voucher.UsageLimit.Value)
                {
                    response.Message = "Mã khuyến mãi đã hết lượt sử dụng.";
                    return response;
                }
            }

            // 6. Kiểm tra giới hạn lượt dùng của 1 KHÁCH HÀNG (Chống gian lận)
            int userUsedCount = await _context.Bookings
                .CountAsync(b => b.VoucherId == voucher.Id && b.UserId == request.UserId && b.Status != "Cancelled");

            if (userUsedCount >= voucher.MaxUsesPerUser)
            {
                response.Message = $"Bạn chỉ được phép sử dụng mã này {voucher.MaxUsesPerUser} lần.";
                return response;
            }

            // ==========================================
            // VƯỢT QUA TẤT CẢ ĐIỀU KIỆN -> TÍNH TIỀN GIẢM
            // ==========================================
            decimal discountAmount = 0;

            if (voucher.DiscountType == "PERCENT")
            {
                // Giảm theo %
                discountAmount = request.TotalRoomAmount * (voucher.DiscountValue / 100m);

                // Áp dụng mức giảm tối đa (Ví dụ: Giảm 20% nhưng Tối đa không quá 500k)
                if (voucher.MaxDiscountAmount.HasValue && discountAmount > voucher.MaxDiscountAmount.Value)
                {
                    discountAmount = voucher.MaxDiscountAmount.Value;
                }
            }
            else if (voucher.DiscountType == "FIXED_AMOUNT")
            {
                // Giảm tiền mặt trực tiếp
                discountAmount = voucher.DiscountValue;
            }

            // Đảm bảo số tiền giảm không được lớn hơn tổng tiền phòng
            if (discountAmount > request.TotalRoomAmount)
            {
                discountAmount = request.TotalRoomAmount;
            }

            // Đóng gói và trả về
            response.IsSuccess = true;
            response.Message = "Áp dụng mã khuyến mãi thành công!";
            response.DiscountAmount = Math.Round(discountAmount, 2);
            response.FinalAmount = request.TotalRoomAmount - response.DiscountAmount;
            response.VoucherId = voucher.Id;

            return response;
        }
        // 2. LOGIC QUẢN LÝ VOUCHER (DÀNH CHO ADMIN)
        public async Task<IEnumerable<Voucher>> GetAllVouchersAsync()
        {
            return await _context.Vouchers.OrderByDescending(v => v.Id).ToListAsync();
        }

        public async Task<Voucher> GetVoucherByIdAsync(int id)
        {
            return await _context.Vouchers.FindAsync(id);
        }

        public async Task<Voucher> CreateVoucherAsync(Voucher voucher)
        {
            // Chuyển mã Code thành IN HOA
            voucher.Code = voucher.Code.ToUpper();

            // Kiểm tra trùng mã
            var exists = await _context.Vouchers.AnyAsync(v => v.Code == voucher.Code);
            if (exists)
            {
                throw new Exception($"Mã '{voucher.Code}' đã tồn tại trên hệ thống!");
            }

            voucher.IsActive = true; // Mặc định bật
            _context.Vouchers.Add(voucher);
            await _context.SaveChangesAsync();

            return voucher;
        }

        public async Task<string> UpdateVoucherAsync(int id, Voucher updatedVoucher)
        {
            var existingVoucher = await _context.Vouchers.FindAsync(id);
            if (existingVoucher == null)
            {
                return "NOT_FOUND";
            }

            // Kiểm tra xem mã Code mới có bị trùng với mã KHÁC đang có trong DB không
            if (existingVoucher.Code.ToUpper() != updatedVoucher.Code.ToUpper())
            {
                var exists = await _context.Vouchers.AnyAsync(v => v.Code == updatedVoucher.Code.ToUpper() && v.Id != id);
                if (exists) return "DUPLICATE_CODE";
            }

            // Cập nhật thông tin
            existingVoucher.Code = updatedVoucher.Code.ToUpper();
            existingVoucher.DiscountType = updatedVoucher.DiscountType;
            existingVoucher.DiscountValue = updatedVoucher.DiscountValue;
            existingVoucher.MinBookingValue = updatedVoucher.MinBookingValue;
            existingVoucher.ValidFrom = updatedVoucher.ValidFrom;
            existingVoucher.ValidTo = updatedVoucher.ValidTo;
            existingVoucher.UsageLimit = updatedVoucher.UsageLimit;
            existingVoucher.MaxDiscountAmount = updatedVoucher.MaxDiscountAmount;
            existingVoucher.RoomTypeId = updatedVoucher.RoomTypeId;
            existingVoucher.MaxUsesPerUser = updatedVoucher.MaxUsesPerUser;

            await _context.SaveChangesAsync();
            return "SUCCESS";
        }

        public async Task<Voucher> ToggleVoucherStatusAsync(int id)
        {
            var voucher = await _context.Vouchers.FindAsync(id);
            if (voucher == null) return null;

            voucher.IsActive = !voucher.IsActive; // Lật trạng thái
            await _context.SaveChangesAsync();
            
            return voucher;
        }
    }
}
using System;
using System.ComponentModel.DataAnnotations;

namespace abchotel.DTOs
{
    public class VoucherResponse
    {
        public int Id { get; set; }
        public string Code { get; set; }
        public string DiscountType { get; set; } // PERCENT hoặc FIXED_AMOUNT
        public decimal DiscountValue { get; set; }
        public decimal? MinBookingValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public int? RoomTypeId { get; set; }
        public string RoomTypeName { get; set; } 
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public int? UsageLimit { get; set; }
        public int UsedCount { get; set; } // Số lần đã sử dụng (Tính từ bảng Bookings)
        public int MaxUsesPerUser { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateVoucherRequest
    {
        [Required(ErrorMessage = "Mã khuyến mãi không được để trống.")]
        public string Code { get; set; }
        [Required]
        public string DiscountType { get; set; }
        [Required]
        public decimal DiscountValue { get; set; }
        public decimal? MinBookingValue { get; set; }
        public decimal? MaxDiscountAmount { get; set; }
        public int? RoomTypeId { get; set; }
        public DateTime? ValidFrom { get; set; }
        public DateTime? ValidTo { get; set; }
        public int? UsageLimit { get; set; }
        public int MaxUsesPerUser { get; set; } = 1;
    }

    public class UpdateVoucherRequest : CreateVoucherRequest { }

    // 🔥 DTO dùng cho API Áp mã giảm giá lúc Thanh toán
    public class ValidateVoucherRequest
    {
        [Required]
        public string Code { get; set; }
        [Required]
        public decimal TotalBookingValue { get; set; }
        public int? RoomTypeId { get; set; }
    }

    public class ValidateVoucherResponse
    {
        public bool IsValid { get; set; }
        public string Message { get; set; }
        public decimal DiscountAmount { get; set; } // Số tiền thực tế được giảm
        public decimal FinalTotal { get; set; }     // Số tiền còn lại phải trả
    }
}
using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class Voucher
{
    public int Id { get; set; }

    public string Code { get; set; } = null!;

    public string DiscountType { get; set; } = null!;

    public decimal DiscountValue { get; set; }

    public decimal? MinBookingValue { get; set; }

    public DateTime? ValidFrom { get; set; }

    public DateTime? ValidTo { get; set; }

    public int? UsageLimit { get; set; }
    // --- 4 CỘT MỚI BỔ SUNG CHO FR 2.2 ---
    public decimal? MaxDiscountAmount { get; set; }
    public int? RoomTypeId { get; set; }
    public int MaxUsesPerUser { get; set; }
    public bool IsActive { get; set; }
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    // (Tùy chọn) Ràng buộc khóa ngoại với bảng RoomType
    public virtual RoomType? RoomType { get; set; }
}

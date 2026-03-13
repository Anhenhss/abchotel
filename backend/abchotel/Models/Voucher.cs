using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

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
    [Column("max_discount_amount")]
    public decimal? MaxDiscountAmount { get; set; } 
    
    [Column("room_type_id")]
    public int? RoomTypeId { get; set; }            
    
    [Column("max_uses_per_user")]
    public int MaxUsesPerUser { get; set; }         
    
    [Column("is_active")]
    public bool IsActive { get; set; }
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();
    // (Tùy chọn) Ràng buộc khóa ngoại với bảng RoomType
    public virtual RoomType? RoomType { get; set; }
}

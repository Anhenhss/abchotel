using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Index("Code", Name = "UQ__Vouchers__357D4CF9E2B9DA75", IsUnique = true)]
public partial class Voucher
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("code")]
    [StringLength(50)]
    public string Code { get; set; } = null!;

    [Column("discount_type")]
    [StringLength(50)]
    public string DiscountType { get; set; } = null!;

    [Column("discount_value", TypeName = "decimal(18, 2)")]
    public decimal DiscountValue { get; set; }

    [Column("min_booking_value", TypeName = "decimal(18, 2)")]
    public decimal? MinBookingValue { get; set; }

    [Column("valid_from", TypeName = "datetime")]
    public DateTime? ValidFrom { get; set; }

    [Column("valid_to", TypeName = "datetime")]
    public DateTime? ValidTo { get; set; }

    [Column("usage_limit")]
    public int? UsageLimit { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [Column("max_discount_amount", TypeName = "decimal(18, 2)")]
    public decimal? MaxDiscountAmount { get; set; }

    [Column("room_type_id")]
    public int? RoomTypeId { get; set; }

    [Column("max_uses_per_user")]
    public int MaxUsesPerUser { get; set; }
    
    [Column("is_for_new_customer")]
    public bool IsForNewCustomer { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }

    [InverseProperty("Voucher")]
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    [ForeignKey("RoomTypeId")]
    [InverseProperty("Vouchers")]
    public virtual RoomType? RoomType { get; set; }
}

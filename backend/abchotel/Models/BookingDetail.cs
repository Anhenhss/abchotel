using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Booking_Details")]
public partial class BookingDetail
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("booking_id")]
    public int? BookingId { get; set; }

    [Column("room_id")]
    public int? RoomId { get; set; }

    [Column("room_type_id")]
    public int? RoomTypeId { get; set; }

    [Column("check_in_date", TypeName = "datetime")]
    public DateTime CheckInDate { get; set; }

    [Column("check_out_date", TypeName = "datetime")]
    public DateTime CheckOutDate { get; set; }

    [Column("applied_price", TypeName = "decimal(18, 2)")]
    public decimal AppliedPrice { get; set; }

    // loại giá (NIGHTLY hoặc HOURLY)
    [Column("price_type")]
    [StringLength(20)]
    public string? PriceType { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("BookingId")]
    [InverseProperty("BookingDetails")]
    public virtual Booking? Booking { get; set; }

    [InverseProperty("BookingDetail")]
    public virtual ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();

    [InverseProperty("BookingDetail")]
    public virtual ICollection<OrderService> OrderServices { get; set; } = new List<OrderService>();

    [ForeignKey("RoomId")]
    [InverseProperty("BookingDetails")]
    public virtual Room? Room { get; set; }

    [ForeignKey("RoomTypeId")]
    [InverseProperty("BookingDetails")]
    public virtual RoomType? RoomType { get; set; }
}

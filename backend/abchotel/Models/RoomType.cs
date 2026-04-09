using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Room_Types")]
public partial class RoomType
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    [Column("base_price", TypeName = "decimal(18, 2)")]
    public decimal BasePrice { get; set; }
    
    [Column("price_per_hour", TypeName = "decimal(18, 2)")]
    public decimal PricePerHour { get; set; }

    [Column("capacity_adults")]
    public int CapacityAdults { get; set; }

    [Column("capacity_children")]
    public int CapacityChildren { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("size_sqm")]
    public double? SizeSqm { get; set; }

    [Column("bed_type")]
    [StringLength(100)]
    public string? BedType { get; set; }

    [Column("view_direction")]
    [StringLength(100)]
    public string? ViewDirection { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }

    [InverseProperty("RoomType")]
    public virtual ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();

    [InverseProperty("RoomType")]
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    [InverseProperty("RoomType")]
    public virtual ICollection<RoomImage> RoomImages { get; set; } = new List<RoomImage>();

    [InverseProperty("RoomType")]
    public virtual ICollection<RoomTypeAmenity> RoomTypeAmenities { get; set; } = new List<RoomTypeAmenity>();

    [InverseProperty("RoomType")]
    public virtual ICollection<Room> Rooms { get; set; } = new List<Room>();

    [InverseProperty("RoomType")]
    public virtual ICollection<Voucher> Vouchers { get; set; } = new List<Voucher>();
}

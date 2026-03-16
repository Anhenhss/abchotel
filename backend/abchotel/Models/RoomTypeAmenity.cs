using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[PrimaryKey("RoomTypeId", "AmenityId")]
[Table("RoomType_Amenities")]
public partial class RoomTypeAmenity
{
    [Key]
    [Column("room_type_id")]
    public int RoomTypeId { get; set; }

    [Key]
    [Column("amenity_id")]
    public int AmenityId { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("AmenityId")]
    [InverseProperty("RoomTypeAmenities")]
    public virtual Amenity Amenity { get; set; } = null!;

    [ForeignKey("RoomTypeId")]
    [InverseProperty("RoomTypeAmenities")]
    public virtual RoomType RoomType { get; set; } = null!;
}

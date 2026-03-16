using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

public partial class Room
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("room_type_id")]
    public int? RoomTypeId { get; set; }

    [Column("room_number")]
    [StringLength(50)]
    public string RoomNumber { get; set; } = null!;

    [Column("floor")]
    public int? Floor { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }

    [Column("cleaning_status")]
    [StringLength(50)]
    public string CleaningStatus { get; set; } = null!;

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

    [InverseProperty("Room")]
    public virtual ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();

    [InverseProperty("Room")]
    public virtual ICollection<RoomInventory> RoomInventories { get; set; } = new List<RoomInventory>();

    [ForeignKey("RoomTypeId")]
    [InverseProperty("Rooms")]
    public virtual RoomType? RoomType { get; set; }
}

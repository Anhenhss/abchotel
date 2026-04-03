using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Room_Inventory")]
public partial class RoomInventory
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("room_id")]
    public int? RoomId { get; set; }

    [Column("EquipmentId")]
    public int EquipmentId { get; set; }

    [Column("quantity")]
    public int? Quantity { get; set; }

    [Column("price_if_lost", TypeName = "decimal(18, 2)")]
    public decimal? PriceIfLost { get; set; }

    [Column("note")]
    [StringLength(255)]
    public string? Note { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("RoomId")]
    [InverseProperty("RoomInventories")]
    public virtual Room? Room { get; set; }

    [ForeignKey("EquipmentId")]
    [InverseProperty("RoomInventories")]
    public virtual Equipment? Equipment { get; set; }
    [InverseProperty("RoomInventory")]
    public virtual ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();
}
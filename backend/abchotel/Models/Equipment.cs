using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Equipments")]
[Index(nameof(ItemCode), Name = "UQ__Equipments__item_code", IsUnique = true)] 
public partial class Equipment
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("item_code")]
    [StringLength(50)]
    [Unicode(false)]
    public string ItemCode { get; set; } = null!;

    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    [Column("category")]
    [StringLength(100)]
    public string Category { get; set; } = null!;

    [Column("unit")]
    [StringLength(50)]
    public string Unit { get; set; } = null!;

    [Column("total_quantity")]
    public int TotalQuantity { get; set; }

    [Column("in_use_quantity")]
    public int InUseQuantity { get; set; }

    [Column("damaged_quantity")]
    public int DamagedQuantity { get; set; }

    [Column("liquidated_quantity")]
    public int LiquidatedQuantity { get; set; }

    [Column("in_stock_quantity")]
    [DatabaseGenerated(DatabaseGeneratedOption.Computed)]
    public int? InStockQuantity { get; set; }

    [Column("base_price", TypeName = "decimal(18, 2)")]
    public decimal BasePrice { get; set; }

    [Column("default_price_if_lost", TypeName = "decimal(18, 2)")]
    public decimal DefaultPriceIfLost { get; set; }

    [Column("supplier")]
    [StringLength(255)]
    public string? Supplier { get; set; }

    [Column("image_url")]
    public string? ImageUrl { get; set; }

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

    // Navigation property (Mối quan hệ 1-N với bảng Room_Inventory)
    [InverseProperty("Equipment")]
    public virtual ICollection<RoomInventory> RoomInventories { get; set; } = new List<RoomInventory>();
}
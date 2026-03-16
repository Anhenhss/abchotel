using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

public partial class Service
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("category_id")]
    public int? CategoryId { get; set; }

    [Column("name")]
    [StringLength(255)]
    public string Name { get; set; } = null!;

    [Column("price", TypeName = "decimal(18, 2)")]
    public decimal Price { get; set; }

    [Column("unit")]
    [StringLength(50)]
    public string? Unit { get; set; }

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

    [ForeignKey("CategoryId")]
    [InverseProperty("Services")]
    public virtual ServiceCategory? Category { get; set; }

    [InverseProperty("Service")]
    public virtual ICollection<OrderServiceDetail> OrderServiceDetails { get; set; } = new List<OrderServiceDetail>();
}

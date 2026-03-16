using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

public partial class Membership
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("tier_name")]
    [StringLength(100)]
    public string TierName { get; set; } = null!;

    [Column("min_points")]
    public int? MinPoints { get; set; }

    [Column("discount_percent", TypeName = "decimal(5, 2)")]
    public decimal? DiscountPercent { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [InverseProperty("Membership")]
    public virtual ICollection<User> Users { get; set; } = new List<User>();
}

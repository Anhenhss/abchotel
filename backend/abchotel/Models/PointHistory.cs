using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Point_Histories")]
public partial class PointHistory
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("invoice_id")]
    public int? InvoiceId { get; set; }

    [Column("points_earned")]
    public int PointsEarned { get; set; }

    [Column("points_redeemed")]
    public int PointsRedeemed { get; set; }

    [Column("points_expired")]
    public int PointsExpired { get; set; }

    [Column("description")]
    [StringLength(255)]
    public string? Description { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [ForeignKey("InvoiceId")]
    [InverseProperty("PointHistories")]
    public virtual Invoice? Invoice { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("PointHistories")]
    public virtual User User { get; set; } = null!;
}

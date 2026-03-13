using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace abchotel.Models;

[Table("Point_Histories")] 
public partial class PointHistory
{
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
    public string? Description { get; set; }

    [Column("created_at")]
    public DateTime? CreatedAt { get; set; }

    [ForeignKey("UserId")]
    public virtual User? User { get; set; }
}
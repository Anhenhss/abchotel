using System;

namespace abchotel.Models;

public partial class PointHistory
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int? InvoiceId { get; set; }
    public int PointsEarned { get; set; }
    public int PointsRedeemed { get; set; }
    public int PointsExpired { get; set; }
    public string? Description { get; set; }
    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
    public virtual Invoice? Invoice { get; set; }
}
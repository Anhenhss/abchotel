using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

public partial class Invoice
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("booking_id")]
    public int? BookingId { get; set; }

    [Column("total_room_amount", TypeName = "decimal(18, 2)")]
    public decimal? TotalRoomAmount { get; set; }

    [Column("total_service_amount", TypeName = "decimal(18, 2)")]
    public decimal? TotalServiceAmount { get; set; }

    [Column("discount_amount", TypeName = "decimal(18, 2)")]
    public decimal? DiscountAmount { get; set; }

    [Column("tax_amount", TypeName = "decimal(18, 2)")]
    public decimal? TaxAmount { get; set; }

    [Column("final_total", TypeName = "decimal(18, 2)")]
    public decimal? FinalTotal { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("BookingId")]
    [InverseProperty("Invoices")]
    public virtual Booking? Booking { get; set; }

    [InverseProperty("Invoice")]
    public virtual ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();

    [InverseProperty("Invoice")]
    public virtual ICollection<Payment> Payments { get; set; } = new List<Payment>();

    [InverseProperty("Invoice")]
    public virtual ICollection<PointHistory> PointHistories { get; set; } = new List<PointHistory>();
}

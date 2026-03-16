using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Loss_And_Damages")]
public partial class LossAndDamage
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("booking_detail_id")]
    public int? BookingDetailId { get; set; }

    [Column("room_inventory_id")]
    public int? RoomInventoryId { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    [Column("penalty_amount", TypeName = "decimal(18, 2)")]
    public decimal PenaltyAmount { get; set; }

    [Column("description")]
    public string? Description { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("reported_by")]
    public int? ReportedBy { get; set; }

    [Column("issue_type")]
    [StringLength(50)]
    [Unicode(false)]
    public string IssueType { get; set; } = null!;

    [Column("status")]
    [StringLength(50)]
    [Unicode(false)]
    public string Status { get; set; } = null!;

    [Column("invoice_id")]
    public int? InvoiceId { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("BookingDetailId")]
    [InverseProperty("LossAndDamages")]
    public virtual BookingDetail? BookingDetail { get; set; }

    [ForeignKey("InvoiceId")]
    [InverseProperty("LossAndDamages")]
    public virtual Invoice? Invoice { get; set; }

    [ForeignKey("ReportedBy")]
    [InverseProperty("LossAndDamages")]
    public virtual User? ReportedByNavigation { get; set; }

    [ForeignKey("RoomInventoryId")]
    [InverseProperty("LossAndDamages")]
    public virtual RoomInventory? RoomInventory { get; set; }
}

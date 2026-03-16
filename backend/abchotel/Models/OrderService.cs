using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Order_Services")]
public partial class OrderService
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("booking_detail_id")]
    public int? BookingDetailId { get; set; }

    [Column("order_date", TypeName = "datetime")]
    public DateTime? OrderDate { get; set; }

    [Column("total_amount", TypeName = "decimal(18, 2)")]
    public decimal? TotalAmount { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }

    [Column("delivery_time", TypeName = "datetime")]
    public DateTime? DeliveryTime { get; set; }

    [Column("notes")]
    public string? Notes { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("BookingDetailId")]
    [InverseProperty("OrderServices")]
    public virtual BookingDetail? BookingDetail { get; set; }

    [InverseProperty("OrderService")]
    public virtual ICollection<OrderServiceDetail> OrderServiceDetails { get; set; } = new List<OrderServiceDetail>();
}

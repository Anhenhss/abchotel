using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Order_Service_Details")]
public partial class OrderServiceDetail
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("order_service_id")]
    public int? OrderServiceId { get; set; }

    [Column("service_id")]
    public int? ServiceId { get; set; }

    [Column("quantity")]
    public int Quantity { get; set; }

    [Column("unit_price", TypeName = "decimal(18, 2)")]
    public decimal UnitPrice { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("OrderServiceId")]
    [InverseProperty("OrderServiceDetails")]
    public virtual OrderService? OrderService { get; set; }

    [ForeignKey("ServiceId")]
    [InverseProperty("OrderServiceDetails")]
    public virtual Service? Service { get; set; }
}

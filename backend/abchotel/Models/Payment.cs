using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

public partial class Payment
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("invoice_id")]
    public int? InvoiceId { get; set; }

    [Column("payment_method")]
    [StringLength(50)]
    public string? PaymentMethod { get; set; }

    [Column("amount_paid", TypeName = "decimal(18, 2)")]
    public decimal AmountPaid { get; set; }

    [Column("transaction_code")]
    [StringLength(100)]
    public string? TransactionCode { get; set; }

    [Column("payment_date", TypeName = "datetime")]
    public DateTime? PaymentDate { get; set; }

    [Column("gateway_response")]
    public string? GatewayResponse { get; set; }

    [Column("refund_amount", TypeName = "decimal(18, 2)")]
    public decimal RefundAmount { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("InvoiceId")]
    [InverseProperty("Payments")]
    public virtual Invoice? Invoice { get; set; }
}

using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class Payment
{
    public int Id { get; set; }

    public int? InvoiceId { get; set; }

    public string? PaymentMethod { get; set; }

    public decimal AmountPaid { get; set; }

    public string? TransactionCode { get; set; }

    public DateTime? PaymentDate { get; set; }

    public virtual Invoice? Invoice { get; set; }
}

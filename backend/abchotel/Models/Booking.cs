using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class Booking
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public string? GuestName { get; set; }

    public string? GuestPhone { get; set; }

    public string? GuestEmail { get; set; }

    public string BookingCode { get; set; } = null!;

    public int? VoucherId { get; set; }

    public string? Status { get; set; }
    // THÊM DÒNG NÀY:
    public DateTime? Created_at { get; set; }

    public virtual ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();

    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    public virtual User? User { get; set; }

    public virtual Voucher? Voucher { get; set; }
}

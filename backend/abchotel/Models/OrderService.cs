using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class OrderService
{
    public int Id { get; set; }

    public int? BookingDetailId { get; set; }

    public DateTime? OrderDate { get; set; }

    public decimal? TotalAmount { get; set; }

    public string? Status { get; set; }

    public virtual BookingDetail? BookingDetail { get; set; }

    public virtual ICollection<OrderServiceDetail> OrderServiceDetails { get; set; } = new List<OrderServiceDetail>();
}

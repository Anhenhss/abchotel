using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class OrderServiceDetail
{
    public int Id { get; set; }

    public int? OrderServiceId { get; set; }

    public int? ServiceId { get; set; }

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public virtual OrderService? OrderService { get; set; }

    public virtual Service? Service { get; set; }
}

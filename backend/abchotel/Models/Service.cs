using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class Service
{
    public int Id { get; set; }

    public int? CategoryId { get; set; }

    public string Name { get; set; } = null!;

    public decimal Price { get; set; }

    public string? Unit { get; set; }

    public virtual ServiceCategory? Category { get; set; }

    public virtual ICollection<OrderServiceDetail> OrderServiceDetails { get; set; } = new List<OrderServiceDetail>();
}

using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class Membership
{
    public int Id { get; set; }

    public string TierName { get; set; } = null!;

    public int? MinPoints { get; set; }

    public decimal? DiscountPercent { get; set; }

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}

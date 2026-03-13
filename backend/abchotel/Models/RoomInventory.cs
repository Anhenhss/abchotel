using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class RoomInventory
{
    public int Id { get; set; }

    public int? RoomId { get; set; }

    public string ItemName { get; set; } = null!;

    public int? Quantity { get; set; }

    public decimal? PriceIfLost { get; set; }

    public virtual ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();

    public virtual Room? Room { get; set; }
}

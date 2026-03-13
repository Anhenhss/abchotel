using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class LossAndDamage
{
    public int Id { get; set; }

    public int? BookingDetailId { get; set; }

    public int? RoomInventoryId { get; set; }

    public int Quantity { get; set; }

    public decimal PenaltyAmount { get; set; }

    public string? Description { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual BookingDetail? BookingDetail { get; set; }

    public virtual RoomInventory? RoomInventory { get; set; }
}

using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class BookingDetail
{
    public int Id { get; set; }

    public int? BookingId { get; set; }

    public int? RoomId { get; set; }

    public int? RoomTypeId { get; set; }

    public DateTime CheckInDate { get; set; }

    public DateTime CheckOutDate { get; set; }

    public decimal PricePerNight { get; set; }

    public virtual Booking? Booking { get; set; }

    public virtual ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();

    public virtual ICollection<OrderService> OrderServices { get; set; } = new List<OrderService>();

    public virtual Room? Room { get; set; }

    public virtual RoomType? RoomType { get; set; }
}

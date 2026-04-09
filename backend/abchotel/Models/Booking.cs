using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Index("BookingCode", Name = "UQ__Bookings__FF29040FA1A0B537", IsUnique = true)]
public partial class Booking
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int? UserId { get; set; }

    [Column("guest_name")]
    [StringLength(255)]
    public string? GuestName { get; set; }

    [Column("guest_phone")]
    [StringLength(50)]
    public string? GuestPhone { get; set; }

    [Column("guest_email")]
    [StringLength(255)]
    public string? GuestEmail { get; set; }
    
    [Column("identity_number")]
    [StringLength(50)]
    public string? IdentityNumber { get; set; }

    [Column("booking_code")]
    [StringLength(50)]
    public string BookingCode { get; set; } = null!;

    [Column("voucher_id")]
    public int? VoucherId { get; set; }

    [Column("status")]
    [StringLength(50)]
    public string? Status { get; set; }

    [Column("special_requests")]
    public string? SpecialRequests { get; set; }

    [Column("actual_check_in", TypeName = "datetime")]
    public DateTime? ActualCheckIn { get; set; }

    [Column("actual_check_out", TypeName = "datetime")]
    public DateTime? ActualCheckOut { get; set; }

    [Column("cancellation_reason")]
    public string? CancellationReason { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [InverseProperty("Booking")]
    public virtual ICollection<BookingDetail> BookingDetails { get; set; } = new List<BookingDetail>();

    [InverseProperty("Booking")]
    public virtual ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();

    [ForeignKey("UserId")]
    [InverseProperty("Bookings")]
    public virtual User? User { get; set; }

    [ForeignKey("VoucherId")]
    [InverseProperty("Bookings")]
    public virtual Voucher? Voucher { get; set; }
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

public partial class Shift
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int UserId { get; set; }

    [Column("check_in_time", TypeName = "datetime")]
    public DateTime CheckInTime { get; set; }

    [Column("check_out_time", TypeName = "datetime")]
    public DateTime? CheckOutTime { get; set; }

    [Column("handover_notes")]
    public string? HandoverNotes { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Shifts")]
    public virtual User User { get; set; } = null!;
}

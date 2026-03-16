using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

public partial class Review
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int? UserId { get; set; }

    [Column("room_type_id")]
    public int? RoomTypeId { get; set; }

    [Column("rating")]
    public int? Rating { get; set; }

    [Column("comment")]
    public string? Comment { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("reply_comment")]
    public string? ReplyComment { get; set; }

    [Column("is_visible")]
    public bool IsVisible { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }

    [ForeignKey("RoomTypeId")]
    [InverseProperty("Reviews")]
    public virtual RoomType? RoomType { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("Reviews")]
    public virtual User? User { get; set; }
}

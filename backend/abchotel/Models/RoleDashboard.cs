using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Role_Dashboards")]
public partial class RoleDashboard
{
    [Key]
    [Column("role_id")]
    public int RoleId { get; set; }

    [Required]
    [Column("layout_config")]
    public string LayoutConfig { get; set; } = null!;

    [Column("is_active")]
    public bool IsActive { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("RoleId")]
    // KHÔNG dùng InverseProperty ở đây nữa để tránh phụ thuộc vào Role.cs
    public virtual Role Role { get; set; } = null!;
}
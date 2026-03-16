using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[PrimaryKey("RoleId", "PermissionId")]
[Table("Role_Permissions")]
public partial class RolePermission
{
    [Key]
    [Column("role_id")]
    public int RoleId { get; set; }

    [Key]
    [Column("permission_id")]
    public int PermissionId { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("PermissionId")]
    [InverseProperty("RolePermissions")]
    public virtual Permission Permission { get; set; } = null!;

    [ForeignKey("RoleId")]
    [InverseProperty("RolePermissions")]
    public virtual Role Role { get; set; } = null!;
}

using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Table("Audit_Logs")]
public partial class AuditLog
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("user_id")]
    public int? UserId { get; set; }

    [Column("action")]
    [StringLength(50)]
    public string Action { get; set; } = null!;

    [Column("table_name")]
    [StringLength(100)]
    public string TableName { get; set; } = null!;

    [Column("record_id")]
    public int RecordId { get; set; }

    [Column("old_value")]
    public string? OldValue { get; set; }

    [Column("new_value")]
    public string? NewValue { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [ForeignKey("UserId")]
    [InverseProperty("AuditLogs")]
    public virtual User? User { get; set; }
}

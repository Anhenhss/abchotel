using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models
{
    [Table("Audit_Logs")]
    public partial class AuditLog
    {
        [Key]
        [Column("id")]
        public int Id { get; set; }

        [Column("user_id")]
        public int? UserId { get; set; }

        [Column("log_type")]
        [StringLength(50)]
        public string? LogType { get; set; } // Ví dụ: "OPERATION", "SECURITY"

        [Column("log_data")]
        public string LogData { get; set; } = null!; // Chứa chuỗi JSON Events

        [Column("created_at", TypeName = "datetime")]
        public DateTime? CreatedAt { get; set; }

        [ForeignKey("UserId")]
        [InverseProperty("AuditLogs")]
        public virtual User? User { get; set; }
    }
}
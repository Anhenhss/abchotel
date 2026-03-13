using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class AuditLog
{
    public int Id { get; set; }

    public int? UserId { get; set; }

    public string Action { get; set; } = null!;

    public string TableName { get; set; } = null!;

    public int RecordId { get; set; }

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? User { get; set; }
}

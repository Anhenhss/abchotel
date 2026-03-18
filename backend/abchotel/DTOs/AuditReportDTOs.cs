using System;

namespace abchotel.DTOs
{
    public class AuditLogResponse
    {
        public int Id { get; set; }
        public string Action { get; set; } // CREATE, UPDATE, DELETE
        public string TableName { get; set; }
        public int RecordId { get; set; }
        public string OldValue { get; set; }
        public string NewValue { get; set; }
        public string PerformedBy { get; set; } // Tên người thực hiện
        public DateTime? CreatedAt { get; set; }
    }
}
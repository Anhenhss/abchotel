using System;
using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class AuditLogResponse
    {
        public int Id { get; set; }
        public string? PerformedBy { get; set; }
        public string? AvatarUrl { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? LogType { get; set; }
        
        // 🔥 Trường này sẽ chứa chuỗi JSON thô từ Database gửi về
        public string LogData { get; set; } = null!;
    }

    // Các Class hỗ trợ cấu trúc bên trong JSON (Dùng để Serialize/Deserialize ở Backend nếu cần)
    public class LogEventItem
    {
        public string EventId { get; set; } = null!;
        public DateTime Timestamp { get; set; }
        public string ActionType { get; set; } = null!; 
        public string EntityType { get; set; } = null!; 
        public object? Context { get; set; } 
        public object? Changes { get; set; } 
        public string Message { get; set; } = null!; 
    }
}
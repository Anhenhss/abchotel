using System;

namespace abchotel.DTOs
{
    public class LossDamageResponse
    {
        public int Id { get; set; }
        public int? BookingDetailId { get; set; }
        public string ItemName { get; set; }
        public int Quantity { get; set; }
        public decimal PenaltyAmount { get; set; }
        public string Description { get; set; }
        public string IssueType { get; set; } // Damaged (Hư hỏng), Lost (Mất)
        public string Status { get; set; } // Pending (Chờ thu tiền), Paid (Đã thu)
        public string ReportedByName { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class CreateLossDamageRequest
    {
        public int BookingDetailId { get; set; }
        public int RoomInventoryId { get; set; } // ID của món đồ bị mất trong phòng đó
        public int Quantity { get; set; }
        public string Description { get; set; }
        public string IssueType { get; set; } // "Damaged" hoặc "Lost"
    }

    public class UpdateLossDamageStatusRequest
    {
        public string Status { get; set; } // Chuyển từ "Pending" sang "Paid" khi khách đền xong
    }
}
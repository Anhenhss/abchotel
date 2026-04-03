using System;
using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class LossDamageResponse
    {
        public int Id { get; set; }
        public int? BookingDetailId { get; set; }
        public string ItemName { get; set; }
        public string EquipmentName { get; set; } // Phục vụ cho giao diện React
        public string RoomNumber { get; set; }    // Số phòng
        public string CustomerName { get; set; }  // Tên khách hàng
        public int Quantity { get; set; }
        public decimal PenaltyAmount { get; set; }
        public string Description { get; set; }
        public string? EvidenceImageUrl { get; set; }
        public string IssueType { get; set; } 
        public string Status { get; set; } 
        public string ReportedByName { get; set; }
        public DateTime? CreatedAt { get; set; }
    }

    public class CreateLossDamageRequest
    {
        public int? BookingDetailId { get; set; }
        public int RoomInventoryId { get; set; }
        public int Quantity { get; set; }
        public string? Description { get; set; }
        public string? EvidenceImageUrl { get; set; }
        public string IssueType { get; set; } 
    }

    public class UpdateLossDamageStatusRequest
    {
        public string Status { get; set; } 
    }

    // 🔥 BỔ SUNG CLASS LỌC VÀ TRẢ VỀ PHÂN TRANG
    public class LossDamageFilterRequest
    {
        public string? Search { get; set; }
        public string? Status { get; set; }
        public string? IssueType { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }

    public class PaginatedLossDamageResponse
    {
        public int Total { get; set; }
        public decimal TotalAmount { get; set; } // Tổng tiền đền bù (Phục vụ hiển thị thẻ Thống kê)
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<LossDamageResponse> Items { get; set; } = new List<LossDamageResponse>();
    }
}
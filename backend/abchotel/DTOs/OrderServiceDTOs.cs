using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace abchotel.DTOs
{
    public class OrderItemRequest
    {
        [Required]
        public int ServiceId { get; set; }
        [Required]
        [Range(1, 100, ErrorMessage = "Số lượng ít nhất là 1")]
        public int Quantity { get; set; }
    }

    public class CreateOrderServiceRequest
    {
        [Required(ErrorMessage = "Phải chọn chi tiết đặt phòng (BookingDetailId)")]
        public int BookingDetailId { get; set; }
        
        public DateTime? DeliveryTime { get; set; }
        public string Notes { get; set; }

        [Required]
        [MinLength(1, ErrorMessage = "Phải chọn ít nhất 1 dịch vụ")]
        public List<OrderItemRequest> Items { get; set; }
    }

    public class OrderServiceResponse
    {
        public int Id { get; set; }
        public int? BookingDetailId { get; set; }
        public string RoomNumber { get; set; }
        public DateTime? OrderDate { get; set; }
        public DateTime? DeliveryTime { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; }
        public string Notes { get; set; }
        public List<OrderDetailResponse> Items { get; set; }
    }

    public class OrderDetailResponse
    {
        public int ServiceId { get; set; }
        public string ServiceName { get; set; }
        public int Quantity { get; set; }
        public decimal UnitPrice { get; set; }
        public decimal SubTotal => Quantity * UnitPrice;
    }
}
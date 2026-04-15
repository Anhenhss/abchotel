using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace abchotel.DTOs
{
    public class InvoiceResponse
    {
        public int Id { get; set; }
        public int? BookingId { get; set; }
        public string BookingCode { get; set; }
        public string GuestName { get; set; }
        public decimal TotalRoomAmount { get; set; }
        public decimal TotalServiceAmount { get; set; }
        public decimal TotalDamageAmount { get; set; } // Phí đền bù hư hỏng
        public decimal DiscountAmount { get; set; }
        public decimal TaxAmount { get; set; }
        public decimal FinalTotal { get; set; }
        public decimal AmountPaid { get; set; } // Số tiền khách đã trả
        public decimal BalanceDue => FinalTotal - AmountPaid; // Số tiền còn nợ
        public string Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public List<InvoiceRoomDetail> RoomDetails { get; set; } = new List<InvoiceRoomDetail>();
        public List<InvoiceServiceDetail> Services { get; set; } = new List<InvoiceServiceDetail>();
        public List<InvoiceDamageDetail> Damages { get; set; } = new List<InvoiceDamageDetail>();
    }

    // 2. TẠO THÊM 3 CLASS NHỎ ĐỂ CHỨA DỮ LIỆU TỪNG MÓN
    public class InvoiceRoomDetail
    {
        public string RoomTypeName { get; set; }
        public string RoomNumber { get; set; }
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public decimal Price { get; set; }
        public int Duration { get; set; } // Số đêm hoặc số giờ
        public decimal SubTotal { get; set; }
    }

    public class InvoiceServiceDetail
    {
        public string ServiceName { get; set; }
        public int Quantity { get; set; }
        public decimal TotalAmount { get; set; }
        public DateTime Date { get; set; }
    }

    public class InvoiceDamageDetail
    {
        public string ItemName { get; set; }
        public decimal PenaltyAmount { get; set; }
    }

    public class PaymentRequest
    {
        [Required]
        public int InvoiceId { get; set; }
        [Required]
        public string PaymentMethod { get; set; } // Cash, Credit Card, VNPay, Momo
        [Required]
        [Range(1, double.MaxValue, ErrorMessage = "Số tiền thanh toán phải lớn hơn 0")]
        public decimal AmountPaid { get; set; }
        public string? TransactionCode { get; set; }
        public string? GatewayResponse { get; set; }
    }

    public class PaymentResponse
    {
        public int Id { get; set; }
        public string PaymentMethod { get; set; }
        public decimal AmountPaid { get; set; }
        public string TransactionCode { get; set; }
        public DateTime? PaymentDate { get; set; }
        public decimal RefundAmount { get; set; }
    }
}
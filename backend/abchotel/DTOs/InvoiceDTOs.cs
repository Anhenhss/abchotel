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
        public string TransactionCode { get; set; }
        public string GatewayResponse { get; set; }
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
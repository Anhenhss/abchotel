namespace abchotel.DTOs
{
    public class ApplyVoucherRequest
    {
        public string VoucherCode { get; set; }
        public decimal TotalRoomAmount { get; set; } // Tổng tiền phòng tạm tính
        public int RoomTypeId { get; set; }          // Khách đang định đặt loại phòng nào
        public int UserId { get; set; }              // ID khách hàng (Để check lượt dùng)
    }
    public class ApplyVoucherResponse
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
        public decimal DiscountAmount { get; set; } // Số tiền được giảm
        public decimal FinalAmount { get; set; }    // Số tiền còn lại sau giảm
        public int? VoucherId { get; set; }         // Giữ lại ID để mốt lưu vào Database
    }
}
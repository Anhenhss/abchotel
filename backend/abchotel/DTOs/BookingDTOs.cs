using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace abchotel.DTOs
{
    // ==========================================
    // 1. NHÓM DTO CHO TÌM KIẾM PHÒNG (SEARCH)
    // ==========================================
    public class SearchRoomRequest
    {
        [Required]
        public DateTime CheckIn { get; set; }
        [Required]
        public DateTime CheckOut { get; set; }
        public int Adults { get; set; } = 1;
        public int Children { get; set; } = 0;
        public int RequestedRooms { get; set; } = 1;
        public string PriceType { get; set; } = "NIGHTLY"; // HOURLY hoặc NIGHTLY
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
    }

    public class AvailableRoomResponse
    {
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public decimal PricePerUnit { get; set; }
        public string ImageUrl { get; set; }
        public int RemainingRooms { get; set; } // Số phòng còn trống thực tế
        public decimal SubTotal { get; set; }   // Tổng tiền dự kiến
        public bool IsUrgent { get; set; }      // true nếu chỉ còn <= 3 phòng
    }

    // ==========================================
    // 2. NHÓM DTO CHO TẠO ĐƠN ĐẶT PHÒNG (CREATE)
    // ==========================================
    public class CreateBookingRequest
    {
        // 1. Thông tin khách hàng (Nếu khách vãng lai thì cần điền, khách đã đăng nhập thì tự lấy theo Token)
        public string GuestName { get; set; }
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ")]
        public string GuestPhone { get; set; }
        [EmailAddress]
        public string GuestEmail { get; set; }
        
        // CMND / CCCD (Giải quyết bài toán pháp lý em vừa hỏi)
        public string IdentityNumber { get; set; } 

        // 2. Mã giảm giá (Nếu có)
        public string VoucherCode { get; set; }
        
        // 3. Ghi chú của khách
        public string SpecialRequests { get; set; }

        // 4. Danh sách các phòng muốn đặt (Có thể đặt nhiều phòng cùng lúc)
        [Required]
        [MinLength(1, ErrorMessage = "Phải chọn ít nhất 1 phòng")]
        public List<BookingRoomItem> Rooms { get; set; }
    }

    public class BookingRoomItem
    {
        [Required]
        public int RoomTypeId { get; set; }
        [Required]
        public int Quantity { get; set; } // Khách muốn đặt mấy phòng loại này?
        [Required]
        public DateTime CheckInDate { get; set; }
        [Required]
        public DateTime CheckOutDate { get; set; }
        [Required]
        public string PriceType { get; set; } = "NIGHTLY";
    }

    // ==========================================
    // 3. NHÓM DTO TRẢ VỀ (RESPONSE) SAU KHI ĐẶT XONG
    // ==========================================
    public class BookingSuccessResponse
    {
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public decimal TotalAmount { get; set; } // Tổng tiền cần thanh toán
        public DateTime ExpireAt { get; set; }   // Thời hạn 15 phút để thanh toán
        public string Message { get; set; }
    }
}
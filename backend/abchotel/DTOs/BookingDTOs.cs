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
        public int CapacityAdults { get; set; }
        public int CapacityChildren { get; set; }
        public double SizeSqm { get; set; }
        public string BedType { get; set; }
        public string ViewDirection { get; set; }
        public string AllImages { get; set; }        
        public string AmenitiesSummary { get; set; }
    }

    // ==========================================
    // 2. NHÓM DTO CHO TẠO ĐƠN ĐẶT PHÒNG (CREATE)
    // ==========================================
    public class CreateBookingRequest
    {
        // 1. Thông tin khách hàng 
        
        // Cố tình thêm Required tiếng Việt để lỡ Lễ tân quên nhập thì báo lỗi đẹp
        [Required(ErrorMessage = "Vui lòng nhập tên khách hàng")]
        public string GuestName { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ (Phải bắt đầu bằng số 0 và đủ 10 số)")]
        public string GuestPhone { get; set; }

        [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
        public string? GuestEmail { get; set; }
        public string IdentityNumber { get; set; }

        // 2. Mã giảm giá (Nếu có)
        public string? VoucherCode { get; set; }

        // 3. Ghi chú của khách
        public string? SpecialRequests { get; set; }

        // 4. Danh sách các phòng muốn đặt
        [Required(ErrorMessage = "Phải chọn ít nhất 1 phòng")]
        [MinLength(1, ErrorMessage = "Phải chọn ít nhất 1 phòng")]
        public List<BookingRoomItem> Rooms { get; set; }
    }

    public class BookingRoomItem
    {
        [Required]
        public int RoomTypeId { get; set; }
        public int? RoomId { get; set; }
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
    // ==========================================
    // 4. NHÓM DTO CHO QUẢN LÝ (CMS)
    // ==========================================
    public class BookingListResponse
    {
        public int Id { get; set; }
        public string BookingCode { get; set; }
        public string GuestName { get; set; }
        public string GuestPhone { get; set; }
        public string Status { get; set; }
        public DateTime? ActualCheckIn { get; set; }
        public DateTime? ActualCheckOut { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? ExpectedCheckIn { get; set; }
        public DateTime? ExpectedCheckOut { get; set; }
    }

    public class UpdateBookingStatusRequest
    {
        public string Status { get; set; }
        public string Reason { get; set; }
    }
}
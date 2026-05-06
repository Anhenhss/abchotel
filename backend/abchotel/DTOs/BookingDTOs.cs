using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace abchotel.DTOs
{
    public class SearchRoomRequest
    {
        [Required]
        public DateTime CheckIn { get; set; }
        [Required]
        public DateTime CheckOut { get; set; }
        public int Adults { get; set; } = 1;
        public int Children { get; set; } = 0;
        public int RequestedRooms { get; set; } = 1;
        public string PriceType { get; set; } = "NIGHTLY"; 
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
    }

    public class AvailableRoomResponse
    {
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public decimal PricePerUnit { get; set; }       
        public decimal BasePricePerNight { get; set; }  
        public decimal BasePricePerHour { get; set; }   
        public string ViewDirection { get; set; }
        public string Description { get; set; }
        public int RemainingRooms { get; set; } 
        public decimal SubTotal { get; set; }   
        public bool IsUrgent { get; set; }      
        public int CapacityAdults { get; set; }
        public int CapacityChildren { get; set; }
        public double SizeSqm { get; set; }
        public string BedType { get; set; }
        public List<string> Images { get; set; } 
        public List<string> Amenities { get; set; }
    }

    public class CreateBookingRequest
    {
        [Required(ErrorMessage = "Vui lòng nhập tên khách hàng")]
        public string GuestName { get; set; }

        [Required(ErrorMessage = "Vui lòng nhập số điện thoại")]
        [RegularExpression(@"^0\d{9}$", ErrorMessage = "Số điện thoại không hợp lệ (Phải bắt đầu bằng số 0 và đủ 10 số)")]
        public string GuestPhone { get; set; }

        [EmailAddress(ErrorMessage = "Email không đúng định dạng")]
        public string? GuestEmail { get; set; }
        public string IdentityNumber { get; set; }

        public string? VoucherCode { get; set; }
        public string? SpecialRequests { get; set; }

        [Required(ErrorMessage = "Phải chọn ít nhất 1 phòng")]
        [MinLength(1, ErrorMessage = "Phải chọn ít nhất 1 phòng")]
        public List<BookingRoomItem> Rooms { get; set; }

        // 🔥 THÊM THUỘC TÍNH NÀY ĐỂ NHẬN DỊCH VỤ TỪ REACT GỬI LÊN
        public List<ServiceItemRequest> Services { get; set; } = new List<ServiceItemRequest>();
    }

    public class BookingRoomItem
    {
        [Required]
        public int RoomTypeId { get; set; }
        public int? RoomId { get; set; }
        [Required]
        public int Quantity { get; set; }
        [Required]
        public DateTime CheckInDate { get; set; }
        [Required]
        public DateTime CheckOutDate { get; set; }
        [Required]
        public string PriceType { get; set; } = "NIGHTLY";
    }

    // 🔥 CLASS NÀY ĐỂ ĐỊNH NGHĨA ITEM DỊCH VỤ (id dịch vụ và số lượng)
    public class ServiceItemRequest
    {
        public int ServiceId { get; set; }
        public int Quantity { get; set; }
    }

    public class BookingSuccessResponse
    {
        public int BookingId { get; set; }
        public string BookingCode { get; set; }
        public decimal TotalAmount { get; set; } 
        public DateTime ExpireAt { get; set; }   
        public string Message { get; set; }
    }

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
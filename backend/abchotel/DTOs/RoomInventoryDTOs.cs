using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class RoomInventoryResponse
    {
        public int Id { get; set; }
        public int? RoomId { get; set; }
        public string RoomNumber { get; set; } // Trả về số phòng để UI dễ hiển thị
        public string ItemName { get; set; }
        public int? Quantity { get; set; }
        public decimal? PriceIfLost { get; set; }
        public string ItemType { get; set; } // Ví dụ: Minibar, Đồ dùng vải, Điện tử...
        public bool IsActive { get; set; }
    }

    public class CreateRoomInventoryRequest
    {
        public int RoomId { get; set; }
        public string ItemName { get; set; }
        public int? Quantity { get; set; }
        public decimal? PriceIfLost { get; set; }
        public string ItemType { get; set; }
    }

    public class UpdateRoomInventoryRequest
    {
        public string ItemName { get; set; }
        public int? Quantity { get; set; }
        public decimal? PriceIfLost { get; set; }
        public string ItemType { get; set; }
    }

    public class CloneInventoryRequest
    {
        public int SourceRoomId { get; set; }
        public int TargetRoomId { get; set; }
    }
}
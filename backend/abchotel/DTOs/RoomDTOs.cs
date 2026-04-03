using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class RoomResponse
    {
        public int Id { get; set; }
        public int? RoomTypeId { get; set; }
        public string RoomTypeName { get; set; } // Lấy từ bảng RoomType để Frontend dễ hiển thị
        public string RoomNumber { get; set; }
        public int? Floor { get; set; }
        public string Status { get; set; }
        public string CleaningStatus { get; set; }
        public bool IsActive { get; set; }
        public int CapacityAdults { get; set; }
        public int CapacityChildren { get; set; }
        public string BedType { get; set; }
        public double? SizeSqm { get; set; }
        public string ViewDirection { get; set; }
    }

    public class CreateRoomRequest
    {
        public int RoomTypeId { get; set; }
        public string RoomNumber { get; set; }
        public int? Floor { get; set; }
        public string Status { get; set; } = "Available"; // Mặc định là trống
        public string CleaningStatus { get; set; } = "Clean"; // Mặc định là sạch
    }

    public class UpdateRoomRequest
    {
        public int RoomTypeId { get; set; }
        public string RoomNumber { get; set; }
        public int? Floor { get; set; }
    }

    public class BulkCreateRoomRequest
    {
        public int RoomTypeId { get; set; }
        public int Floor { get; set; }
        public List<string> RoomNumbers { get; set; } // Ví dụ: ["101", "102", "103"]
    }

    public class UpdateRoomStatusRequest
    {
        // Ví dụ: Available, Occupied, Maintenance
        public string Status { get; set; }
    }

    public class UpdateCleaningStatusRequest
    {
        // Ví dụ: Clean, Dirty, Cleaning, Inspected
        public string CleaningStatus { get; set; }
    }
}
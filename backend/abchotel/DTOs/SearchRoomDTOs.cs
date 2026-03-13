using System;

namespace abchotel.DTOs
{
    public class SearchRoomRequest
    {
        public DateTime CheckIn { get; set; }
        public DateTime CheckOut { get; set; }
        public int Adults { get; set; } = 1;
        public int Children { get; set; } = 0;
        public int RequestedRooms { get; set; } = 1;
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
    }
    public class SearchRoomResponse
    {
        public int RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public decimal PricePerNight { get; set; }
        public string ImageUrl { get; set; }
        public int RemainingRooms { get; set; }
        public decimal SubTotal { get; set; }
        public bool IsUrgent { get; set; }
    }
}
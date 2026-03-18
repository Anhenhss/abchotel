using System;

namespace abchotel.DTOs
{
    public class ReviewResponse
    {
        public int Id { get; set; }
        public int? RoomTypeId { get; set; }
        public string RoomTypeName { get; set; }
        public string GuestName { get; set; }
        public int? Rating { get; set; }
        public string Comment { get; set; }
        public string ReplyComment { get; set; }
        public DateTime? CreatedAt { get; set; }
        public bool IsVisible { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateReviewRequest
    {
        public int RoomTypeId { get; set; }
        public int Rating { get; set; } // Từ 1 đến 5 sao
        public string Comment { get; set; }
    }

    public class ReplyReviewRequest
    {
        public string ReplyComment { get; set; }
    }
}
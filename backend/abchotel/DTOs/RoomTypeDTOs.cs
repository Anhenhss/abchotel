using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class RoomImageResponse
    {
        public int Id { get; set; }
        public string ImageUrl { get; set; }
        public bool? IsPrimary { get; set; }
        public bool IsActive { get; set; }
    }

    public class RoomTypeResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public decimal BasePrice { get; set; }
        public int CapacityAdults { get; set; }
        public int CapacityChildren { get; set; }
        public string Description { get; set; }
        public double? SizeSqm { get; set; }
        public string BedType { get; set; }
        public string ViewDirection { get; set; }
        public bool IsActive { get; set; }
        public List<AmenityResponse> Amenities { get; set; } = new List<AmenityResponse>();
        public List<RoomImageResponse> Images { get; set; }
    }

    public class CreateRoomTypeRequest
    {
        public string Name { get; set; }
        public decimal BasePrice { get; set; }
        public int CapacityAdults { get; set; }
        public int CapacityChildren { get; set; }
        public string? Description { get; set; }
        public double? SizeSqm { get; set; }
        public string? BedType { get; set; }
        public string? ViewDirection { get; set; }
    }

    public class UpdateRoomTypeRequest
    {
        public string Name { get; set; }
        public decimal BasePrice { get; set; }
        public int CapacityAdults { get; set; }
        public int CapacityChildren { get; set; }
        public string Description { get; set; }
        public double? SizeSqm { get; set; }
        public string BedType { get; set; }
        public string ViewDirection { get; set; }
    }

    public class AddRoomImageRequest
    {
        public string ImageUrl { get; set; }
        public bool IsPrimary { get; set; }
    }
}
using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class AmenityResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string IconUrl { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateAmenityRequest
    {
        public string Name { get; set; }
        public string IconUrl { get; set; }
    }

    public class UpdateAmenityRequest
    {
        public string Name { get; set; }
        public string IconUrl { get; set; }
    }

    // DTO phục vụ cho việc gán tiện ích vào Loại phòng (Bảng trung gian)
    public class AssignAmenitiesRequest
    {
        public int RoomTypeId { get; set; }
        public List<int> AmenityIds { get; set; }
    }
}
using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class RoomInventoryResponse
    {
        public int Id { get; set; }
        public int? RoomId { get; set; }
        public string RoomNumber { get; set; } 
        
        public int EquipmentId { get; set; }
        public string EquipmentName { get; set; } 
        
        public string Category { get; set; } 
        
        public int? Quantity { get; set; }
        public decimal? PriceIfLost { get; set; }
        public string? Note { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateRoomInventoryRequest
    {
        public int RoomId { get; set; }
        public int EquipmentId { get; set; }
        public int? Quantity { get; set; }
        public decimal? PriceIfLost { get; set; }
        public string? Note { get; set; }
    }

    public class UpdateRoomInventoryRequest
    {
        public int? Quantity { get; set; }
        public decimal? PriceIfLost { get; set; }
        public string? Note { get; set; }
    }

    public class CloneInventoryRequest
    {
        public int SourceRoomId { get; set; }
        public int TargetRoomId { get; set; }
    }
}
using System.ComponentModel.DataAnnotations;

namespace abchotel.DTOs
{
    public class EquipmentResponse
    {
        public int Id { get; set; }
        public string ItemCode { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string Unit { get; set; } = null!;
        public int TotalQuantity { get; set; }
        public int InUseQuantity { get; set; }
        public int DamagedQuantity { get; set; }
        public int LiquidatedQuantity { get; set; }
        public int? InStockQuantity { get; set; } // Số lượng tồn kho (Tự động tính)
        public decimal BasePrice { get; set; }
        public decimal DefaultPriceIfLost { get; set; }
        public string? Supplier { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateEquipmentRequest
    {
        public string? ItemCode { get; set; } = null!;

        [Required(ErrorMessage = "Tên vật tư không được để trống")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public string Category { get; set; } = null!;

        [Required(ErrorMessage = "Đơn vị tính là bắt buộc")]
        public string Unit { get; set; } = null!;

        public int TotalQuantity { get; set; }
        public decimal BasePrice { get; set; }
        public decimal DefaultPriceIfLost { get; set; }
        public string? Supplier { get; set; }
        public string? ImageUrl { get; set; }
    }

    public class UpdateEquipmentRequest
    {
        [Required(ErrorMessage = "Tên vật tư không được để trống")]
        public string Name { get; set; } = null!;

        [Required(ErrorMessage = "Danh mục là bắt buộc")]
        public string Category { get; set; } = null!;

        [Required(ErrorMessage = "Đơn vị tính là bắt buộc")]
        public string Unit { get; set; } = null!;

        public int TotalQuantity { get; set; }
        public int InUseQuantity { get; set; }
        public int DamagedQuantity { get; set; }
        public int LiquidatedQuantity { get; set; }
        public decimal BasePrice { get; set; }
        public decimal DefaultPriceIfLost { get; set; }
        public string? Supplier { get; set; }
        public string? ImageUrl { get; set; }
    }
    public class EquipmentFilterRequest
    {
        public string? Search { get; set; }
        public string? Category { get; set; }
        public bool? IsActive { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
    public class PaginatedEquipmentResponse
    {
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public List<EquipmentResponse> Items { get; set; } = new List<EquipmentResponse>();
    }
}
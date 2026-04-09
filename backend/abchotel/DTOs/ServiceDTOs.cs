using System.ComponentModel.DataAnnotations;

namespace abchotel.DTOs
{
    // ====== CATEGORY ======
    public class ServiceCategoryResponse
    {
        public int Id { get; set; }
        public string Name { get; set; }
    }

    public class ServiceCategoryRequest
    {
        [Required(ErrorMessage = "Tên danh mục không được để trống.")]
        public string Name { get; set; }
    }

    // ====== SERVICE ======
    public class ServiceResponse
    {
        public int Id { get; set; }
        public int? CategoryId { get; set; }
        public string CategoryName { get; set; }
        public string Name { get; set; }
        public decimal Price { get; set; }
        public string Unit { get; set; }
        public bool IsActive { get; set; }
    }

    public class CreateServiceRequest
    {
        [Required(ErrorMessage = "Danh mục là bắt buộc.")]
        public int CategoryId { get; set; }
        
        [Required(ErrorMessage = "Tên dịch vụ không được để trống.")]
        public string Name { get; set; }
        
        [Required]
        [Range(0, 100000000, ErrorMessage = "Giá tiền không hợp lệ.")]
        public decimal Price { get; set; }
        
        public string Unit { get; set; } // Người, Phần, Lượt, Kg...
    }

    public class UpdateServiceRequest : CreateServiceRequest { }
}
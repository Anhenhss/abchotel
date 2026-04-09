using System.ComponentModel.DataAnnotations;

namespace abchotel.DTOs
{
    public class MembershipResponse
    {
        public int Id { get; set; }
        public string TierName { get; set; }
        public int MinPoints { get; set; }
        public decimal DiscountPercent { get; set; }
        public int TotalUsers { get; set; } // Đếm xem có bao nhiêu khách hàng đang ở hạng này
    }

    public class CreateMembershipRequest
    {
        [Required(ErrorMessage = "Tên hạng thành viên không được để trống")]
        public string TierName { get; set; }

        [Required(ErrorMessage = "Điểm tối thiểu không được để trống")]
        [Range(0, 1000000, ErrorMessage = "Điểm phải lớn hơn hoặc bằng 0")]
        public int MinPoints { get; set; }

        [Required(ErrorMessage = "Phần trăm giảm giá không được để trống")]
        [Range(0, 100, ErrorMessage = "Phần trăm giảm giá phải từ 0 đến 100")]
        public decimal DiscountPercent { get; set; }
    }

    public class UpdateMembershipRequest : CreateMembershipRequest { }
}
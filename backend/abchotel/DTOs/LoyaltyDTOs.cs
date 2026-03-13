using System;
using System.Collections.Generic;

namespace abchotel.DTOs
{
    // Dữ liệu khách gửi lên khi muốn tiêu điểm
    public class RedeemPointsRequest
    {
        public int UserId { get; set; }
        public int PointsToRedeem { get; set; }
        public decimal TotalRoomAmount { get; set; } // Dùng để check ràng buộc không giảm quá 30%
    }

    // Dữ liệu trả về cho trang Hồ sơ khách hàng
    public class UserLoyaltyProfileResponse
    {
        public int TotalPoints { get; set; }
        public string TierName { get; set; }
        public decimal TierDiscountPercent { get; set; }
        public List<PointHistoryDto> History { get; set; }
    }

    public class PointHistoryDto
    {
        public int PointsEarned { get; set; }
        public int PointsRedeemed { get; set; }
        public int PointsExpired { get; set; }
        public string Description { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
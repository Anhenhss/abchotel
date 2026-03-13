using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LoyaltyController : ControllerBase
    {
        private readonly ILoyaltyService _loyaltyService;
        public LoyaltyController(ILoyaltyService loyaltyService)
        {
            _loyaltyService = loyaltyService;
        }

        // 1. API: ÁP DỤNG ĐIỂM KHI ĐẶT PHÒNG
        [HttpPost("redeem")]
        public async Task<IActionResult> RedeemPoints([FromBody] RedeemPointsRequest request)
        {
            var result = await _loyaltyService.ValidateAndRedeemPointsAsync(
                request.UserId, 
                request.PointsToRedeem, 
                request.TotalRoomAmount
            );

            if (!result.IsSuccess)
            {
                return BadRequest(new { message = result.Message });
            }

            return Ok(new 
            { 
                message = result.Message, 
                discountAmount = result.DiscountAmount,
                finalAmount = request.TotalRoomAmount - result.DiscountAmount
            });
        }

        // 2. API: XEM HỒ SƠ ĐIỂM THƯỞNG
        [HttpGet("profile/{userId}")]
        public async Task<IActionResult> GetLoyaltyProfile(int userId)
        {
            var profile = await _loyaltyService.GetUserProfileAsync(userId);

            if (profile == null)
            {
                return NotFound(new { message = "Không tìm thấy người dùng." });
            }

            return Ok(profile);
        }
    }
}
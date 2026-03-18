using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IReviewService _reviewService;

        public ReviewsController(IReviewService reviewService)
        {
            _reviewService = reviewService;
        }

        private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        // ==========================================
        // KHU VỰC DÀNH CHO KHÁCH HÀNG (PUBLIC & GUEST)
        // ==========================================

        [HttpGet("room-type/{roomTypeId}")]
        [AllowAnonymous] // Ai cũng có thể xem đánh giá
        public async Task<IActionResult> GetPublicReviews(int roomTypeId)
        {
            var reviews = await _reviewService.GetPublicReviewsByRoomTypeAsync(roomTypeId);
            return Ok(reviews);
        }

        [HttpPost]
        [Authorize] // Bắt buộc đăng nhập mới được viết đánh giá
        public async Task<IActionResult> CreateReview([FromBody] CreateReviewRequest request)
        {
            var userId = GetCurrentUserId();
            var result = await _reviewService.CreateReviewAsync(userId, request);
            
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        // ==========================================
        // KHU VỰC DÀNH CHO ADMIN / QUẢN TRỊ NỘI DUNG
        // ==========================================

        [HttpGet]
        [Authorize(Policy = "MANAGE_CONTENT")] 
        public async Task<IActionResult> GetAllReviewsForAdmin([FromQuery] bool? isVisible)
        {
            var reviews = await _reviewService.GetAllReviewsForAdminAsync(isVisible);
            return Ok(reviews);
        }

        [HttpPatch("{id}/approve")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> ApproveReview(int id)
        {
            var success = await _reviewService.ApproveReviewAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy đánh giá." });
            return Ok(new { message = "Đã duyệt hiển thị đánh giá này." });
        }

        [HttpPatch("{id}/reply")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> ReplyToReview(int id, [FromBody] ReplyReviewRequest request)
        {
            var success = await _reviewService.ReplyToReviewAsync(id, request.ReplyComment);
            if (!success) return NotFound(new { message = "Không tìm thấy đánh giá." });
            return Ok(new { message = "Đã phản hồi đánh giá của khách." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> DeleteReview(int id)
        {
            var success = await _reviewService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy đánh giá." });
            return Ok(new { message = "Đã thay đổi trạng thái ẩn/hiện của đánh giá (Xóa mềm)." });
        }
    }
}
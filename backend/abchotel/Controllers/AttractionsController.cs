using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttractionsController : ControllerBase
    {
        private readonly IAttractionService _attractionService;

        public AttractionsController(IAttractionService attractionService)
        {
            _attractionService = attractionService;
        }

        // Khách hàng xem danh sách điểm đến
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAttractions([FromQuery] bool onlyActive = true)
        {
            var attractions = await _attractionService.GetAllAttractionsAsync(onlyActive);
            return Ok(attractions);
        }

        // Khách hàng xem chi tiết 1 điểm đến
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAttraction(int id)
        {
            var attraction = await _attractionService.GetAttractionByIdAsync(id);
            if (attraction == null) return NotFound(new { message = "Không tìm thấy điểm du lịch." });
            return Ok(attraction);
        }

        // ==========================================
        // KHU VỰC BẢO MẬT DÀNH CHO QUẢN TRỊ NỘI DUNG
        // ==========================================

        [HttpPost]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> CreateAttraction([FromBody] CreateAttractionRequest request)
        {
            var result = await _attractionService.CreateAttractionAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message, data = result.Data });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> UpdateAttraction(int id, [FromBody] UpdateAttractionRequest request)
        {
            var success = await _attractionService.UpdateAttractionAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy điểm du lịch." });
            return Ok(new { message = "Cập nhật điểm du lịch thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> DeleteAttraction(int id)
        {
            var success = await _attractionService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy điểm du lịch." });
            return Ok(new { message = "Đã thay đổi trạng thái hiển thị của điểm du lịch." });
        }
    }
}
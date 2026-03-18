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
    [Authorize(Policy = "MANAGE_INVENTORY")] // Housekeeping hoặc Manager
    public class LossDamagesController : ControllerBase
    {
        private readonly ILossDamageService _lossDamageService;

        public LossDamagesController(ILossDamageService lossDamageService)
        {
            _lossDamageService = lossDamageService;
        }

        private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpGet("booking/{bookingDetailId}")]
        public async Task<IActionResult> GetDamagesByBooking(int bookingDetailId)
        {
            var damages = await _lossDamageService.GetLossDamagesByBookingAsync(bookingDetailId);
            return Ok(damages);
        }

        [HttpPost]
        public async Task<IActionResult> ReportDamage([FromBody] CreateLossDamageRequest request)
        {
            var staffId = GetCurrentUserId();
            var result = await _lossDamageService.ReportDamageAsync(staffId, request);
            
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateLossDamageStatusRequest request)
        {
            var success = await _lossDamageService.UpdateStatusAsync(id, request.Status);
            if (!success) return NotFound(new { message = "Không tìm thấy biên bản." });
            return Ok(new { message = "Cập nhật trạng thái đền bù thành công." });
        }
    }
}
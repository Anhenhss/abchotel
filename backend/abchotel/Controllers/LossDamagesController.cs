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
    [Authorize] // Bỏ Policy chung, kiểm tra từng hàm bên dưới
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

        [HttpGet("room/{roomId}")]
        public async Task<IActionResult> GetDamagesByRoom(int roomId)
        {
            var damages = await _lossDamageService.GetLossDamagesByRoomAsync(roomId);
            return Ok(damages);
        }

        [HttpPost]
        [Authorize(Policy = "UPDATE_CLEANING_STATUS")] // CHỈ BUỒNG PHÒNG MỚI ĐƯỢC BÁO CÁO HƯ HỎNG
        public async Task<IActionResult> ReportDamage([FromBody] CreateLossDamageRequest request)
        {
            var staffId = GetCurrentUserId();
            var result = await _lossDamageService.ReportDamageAsync(staffId, request);

            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "MANAGE_INVOICES")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateLossDamageStatusRequest request)
        {
            var success = await _lossDamageService.UpdateStatusAsync(id, request.Status);
            if (!success) return NotFound(new { message = "Không tìm thấy biên bản." });
            return Ok(new { message = "Cập nhật trạng thái đền bù thành công." });
        }
        // 🔥 API LẤY DANH SÁCH CÓ PHÂN TRANG CHO BẢNG BÁO CÁO
        [HttpGet]
        [Authorize(Policy = "VIEW_REPORTS")] // Quyền xem báo cáo
        public async Task<IActionResult> GetAllDamages([FromQuery] LossDamageFilterRequest filter)
        {
            var result = await _lossDamageService.GetAllLossDamagesAsync(filter);
            return Ok(result);
        }
    }
}
using System;
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
    [Authorize]
    public class ShiftsController : ControllerBase
    {
        private readonly IShiftService _shiftService;
        public ShiftsController(IShiftService shiftService) => _shiftService = shiftService;
        private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        [HttpPost("check-in")]
        public async Task<IActionResult> CheckIn()
        {
            var result = await _shiftService.CheckInAsync(GetCurrentUserId());
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPost("check-out")]
        public async Task<IActionResult> CheckOut()
        {
            var result = await _shiftService.CheckOutAsync(GetCurrentUserId());
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPost("handover")]
        public async Task<IActionResult> Handover([FromBody] HandoverRequest request)
        {
            var result = await _shiftService.HandoverAsync(GetCurrentUserId(), request.Notes);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpGet]
        [Authorize(Policy = "MANAGE_SHIFTS")]
        public async Task<IActionResult> GetShifts([FromQuery] DateTime? date, [FromQuery] int? userId)
        {
            var shifts = await _shiftService.GetShiftsAsync(date, userId);
            return Ok(shifts);
        }

        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentShift()
        {
            var shift = await _shiftService.GetCurrentShiftAsync(GetCurrentUserId());
            if (shift == null) return NotFound(new { message = "Bạn không có ca làm việc nào đang chạy." });
            return Ok(shift);
        }
    }
}
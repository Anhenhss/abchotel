using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using abchotel.DTOs;
using abchotel.Services;
using System;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BookingsController : ControllerBase
    {
        private readonly IBookingService _bookingService;

        public BookingsController(IBookingService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpPost("search")]
        public async Task<IActionResult> Search([FromBody] SearchRoomRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var rooms = await _bookingService.SearchRoomsAsync(request);
            return Ok(rooms);
        }

        [HttpPost("create")]
        public async Task<IActionResult> Create([FromBody] CreateBookingRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            int? currentUserId = null;
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int uid)) currentUserId = uid;

            var result = await _bookingService.CreateBookingAsync(request, currentUserId);

            if (!result.IsSuccess)
                return BadRequest(new { message = result.Message });

            return Ok(result.Data);
        }

        [HttpGet("{code}")]
        public async Task<IActionResult> GetByCode(string code)
        {
            var data = await _bookingService.GetBookingByCodeAsync(code);
            if (data == null) return NotFound(new { message = "Không tìm thấy mã đặt phòng." });
            return Ok(data);
        }

        [HttpGet]
        [Authorize(Policy = "MANAGE_BOOKINGS")]
        public async Task<IActionResult> GetAll([FromQuery] string status = null)
        {
            return Ok(await _bookingService.GetAllBookingsAsync(status));
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "MANAGE_BOOKINGS")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateBookingStatusRequest request)
        {
            var success = await _bookingService.UpdateBookingStatusAsync(id, request.Status, request.Reason);
            if (!success) return NotFound(new { message = "Không tìm thấy đơn đặt phòng." });
            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }

        [HttpGet("specific-rooms")]
        public async Task<IActionResult> GetSpecificRooms([FromQuery] int roomTypeId, [FromQuery] DateTime checkIn, [FromQuery] DateTime checkOut)
        {
            var rooms = await _bookingService.GetAvailableSpecificRoomsAsync(roomTypeId, checkIn, checkOut);
            return Ok(rooms);
        }

        [HttpGet("my-bookings")]
        [Authorize] 
        public async Task<IActionResult> GetMyBookings()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var bookings = await _bookingService.GetMyBookingsAsync(userId);
            return Ok(bookings);
        }

        // 🔥 THÊM LẠI: API Cho khách tự hủy
        [HttpPost("my-bookings/{id}/cancel")]
        [Authorize]
        public async Task<IActionResult> CancelMyBooking(int id, [FromBody] CancelClientRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var result = await _bookingService.CancelMyBookingAsync(id, userId, request.Reason);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }
    }
}

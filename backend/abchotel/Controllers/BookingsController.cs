using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

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

            // Bắt UserId nếu khách có đăng nhập (Có Token). Nếu khách vãng lai thì null.
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
    }
}
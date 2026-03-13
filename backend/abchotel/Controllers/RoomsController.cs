using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomsController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        [HttpPost("search")]
        public async Task<IActionResult> Search([FromBody] SearchRoomRequest request)
        {
            // Validate sơ bộ
            if (request.CheckIn.Date < DateTime.Today)
                return BadRequest("Ngày Check-in không hợp lệ.");
                
            if (request.CheckIn.Date >= request.CheckOut.Date)
                return BadRequest("Ngày Check-out phải sau ngày Check-in.");

            try
            {
                var result = await _roomService.SearchRoomsAsync(request);
                return Ok(result);
            }
            catch (Exception ex)
            {
                // Bắt lỗi RAISERROR từ SQL Server ném ra
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "MANAGE_ROOMS")] // Bắt buộc phải có quyền quản lý phòng mới được thao tác
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomsController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        [HttpGet]
        public async Task<IActionResult> GetRooms([FromQuery] bool onlyActive = true)
        {
            var rooms = await _roomService.GetAllRoomsAsync(onlyActive);
            return Ok(rooms);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetRoom(int id)
        {
            var room = await _roomService.GetRoomByIdAsync(id);
            if (room == null) return NotFound(new { message = "Không tìm thấy phòng." });
            return Ok(room);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
        {
            var result = await _roomService.CreateRoomAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPost("bulk-create")]
        public async Task<IActionResult> BulkCreateRooms([FromBody] BulkCreateRoomRequest request)
        {
            var result = await _roomService.BulkCreateRoomsAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] UpdateRoomRequest request)
        {
            var success = await _roomService.UpdateRoomAsync(id, request);
            if (!success) return BadRequest(new { message = "Lỗi cập nhật. Số phòng có thể đã tồn tại hoặc phòng không tìm thấy." });
            return Ok(new { message = "Cập nhật thông tin phòng thành công." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var success = await _roomService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy phòng." });
            return Ok(new { message = "Đã thay đổi trạng thái kinh doanh của phòng." });
        }

        [HttpPatch("{id}/status")]
        public async Task<IActionResult> UpdateRoomStatus(int id, [FromBody] UpdateRoomStatusRequest request)
        {
            var success = await _roomService.UpdateStatusAsync(id, request.Status);
            if (!success) return NotFound(new { message = "Không tìm thấy phòng." });
            return Ok(new { message = "Cập nhật trạng thái kinh doanh thành công." });
        }

        [HttpPatch("{id}/cleaning-status")]
        public async Task<IActionResult> UpdateCleaningStatus(int id, [FromBody] UpdateCleaningStatusRequest request)
        {
            var success = await _roomService.UpdateCleaningStatusAsync(id, request.CleaningStatus);
            if (!success) return NotFound(new { message = "Không tìm thấy phòng." });
            return Ok(new { message = "Cập nhật trạng thái dọn dẹp thành công." });
        }
    }
}
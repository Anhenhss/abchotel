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
    public class RoomsController : ControllerBase
    {
        private readonly IRoomService _roomService;

        public RoomsController(IRoomService roomService)
        {
            _roomService = roomService;
        }

        // ==========================================
        // NHÓM API LẤY DỮ LIỆU (GET) - AI ĐĂNG NHẬP CŨNG XEM ĐƯỢC
        // ==========================================

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

        // ==========================================
        // NHÓM API THAO TÁC - BẮT BUỘC CÓ QUYỀN MANAGE_ROOMS
        // ==========================================

        [HttpPost]
        [Authorize(Policy = "MANAGE_ROOMS")] 
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
        {
            var result = await _roomService.CreateRoomAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPost("bulk-create")]
        [Authorize(Policy = "MANAGE_ROOMS")] 
        public async Task<IActionResult> BulkCreateRooms([FromBody] BulkCreateRoomRequest request)
        {
            var result = await _roomService.BulkCreateRoomsAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_ROOMS")] 
        public async Task<IActionResult> UpdateRoom(int id, [FromBody] UpdateRoomRequest request)
        {
            try
            {
                var success = await _roomService.UpdateRoomAsync(id, request);
                if (!success) return NotFound(new { message = "Không tìm thấy phòng." });
                return Ok(new { message = "Cập nhật thông tin phòng thành công." });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = ex.Message }); 
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_ROOMS")] 
        public async Task<IActionResult> DeleteRoom(int id)
        {
            var success = await _roomService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy phòng." });
            return Ok(new { message = "Đã thay đổi trạng thái kinh doanh của phòng." });
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "MANAGE_ROOMS")] 
        public async Task<IActionResult> UpdateRoomStatus(int id, [FromBody] UpdateRoomStatusRequest request)
        {
            var success = await _roomService.UpdateStatusAsync(id, request.Status);
            if (!success) return NotFound(new { message = "Không tìm thấy phòng." });
            return Ok(new { message = "Cập nhật trạng thái kinh doanh thành công." });
        }

        [HttpPatch("{id}/cleaning-status")]
        public async Task<IActionResult> UpdateCleaningStatus(int id, [FromBody] UpdateCleaningStatusRequest request)
        {
            // 1. Kiểm tra linh hoạt (HOẶC): Phải có quyền Quản lý Phòng hoặc Quản lý Kho (Buồng phòng)
            var permissions = User.FindAll("Permission").Select(c => c.Value);
            if (!permissions.Contains("MANAGE_ROOMS") && !permissions.Contains("MANAGE_INVENTORY"))
            {
                return Forbid(); // Trả về 403 nếu không có cả 2 quyền trên
            }

            // 2. Nếu có quyền thì cho phép thực hiện
            var success = await _roomService.UpdateCleaningStatusAsync(id, request.CleaningStatus);
            if (!success) return NotFound(new { message = "Không tìm thấy phòng." });
            return Ok(new { message = "Cập nhật trạng thái dọn dẹp thành công." });
        }
    }
}
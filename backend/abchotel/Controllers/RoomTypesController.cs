using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RoomTypesController : ControllerBase
    {
        private readonly IRoomTypeService _roomTypeService;

        public RoomTypesController(IRoomTypeService roomTypeService)
        {
            _roomTypeService = roomTypeService;
        }

        // API Công khai: Lấy danh sách để khách hàng tham khảo khi đặt phòng
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoomTypes([FromQuery] bool onlyActive = true)
        {
            var roomTypes = await _roomTypeService.GetAllRoomTypesAsync(onlyActive);
            return Ok(roomTypes);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetRoomType(int id)
        {
            var roomType = await _roomTypeService.GetRoomTypeByIdAsync(id);
            if (roomType == null) return NotFound(new { message = "Không tìm thấy loại phòng." });
            return Ok(roomType);
        }

        // ==========================================
        // KHU VỰC BẢO MẬT DÀNH CHO QUẢN LÝ QUỸ PHÒNG
        // ==========================================

        [HttpPost]
        [Authorize(Policy = "MANAGE_ROOMS")]
        public async Task<IActionResult> CreateRoomType([FromBody] CreateRoomTypeRequest request)
        {
            var result = await _roomTypeService.CreateRoomTypeAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message, data = result.Data });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_ROOMS")]
        public async Task<IActionResult> UpdateRoomType(int id, [FromBody] UpdateRoomTypeRequest request)
        {
            var success = await _roomTypeService.UpdateRoomTypeAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy loại phòng." });
            return Ok(new { message = "Cập nhật loại phòng thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_ROOMS")]
        public async Task<IActionResult> DeleteRoomType(int id)
        {
            var success = await _roomTypeService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy loại phòng." });
            return Ok(new { message = "Đã thay đổi trạng thái kinh doanh của loại phòng." });
        }

        // --- API XỬ LÝ ẢNH LOẠI PHÒNG ---

        [HttpPost("{id}/images")]
        [Authorize(Policy = "MANAGE_ROOMS")]
        public async Task<IActionResult> AddRoomImage(int id, [FromBody] AddRoomImageRequest request)
        {
            var result = await _roomTypeService.AddRoomImageAsync(id, request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpDelete("images/{imageId}")]
        [Authorize(Policy = "MANAGE_ROOMS")]
        public async Task<IActionResult> DeleteRoomImage(int imageId)
        {
            // Gọi hàm xóa thật sự, bao gồm cả xóa trên Cloudinary
            var success = await _roomTypeService.DeleteRoomImageAsync(imageId);
            
            if (!success) return NotFound(new { message = "Không tìm thấy hình ảnh để xóa." });
            
            return Ok(new { message = "Đã xóa ảnh vĩnh viễn trên hệ thống và Cloudinary." });
        }

        [HttpPatch("{roomTypeId}/images/{imageId}/set-primary")]
        [Authorize(Policy = "MANAGE_ROOMS")]
        public async Task<IActionResult> SetPrimaryImage(int roomTypeId, int imageId)
        {
            var success = await _roomTypeService.SetPrimaryImageAsync(roomTypeId, imageId);
            if (!success) return NotFound(new { message = "Không tìm thấy ảnh hoặc loại phòng." });
            return Ok(new { message = "Đã đặt ảnh làm mặc định thành công." });
        }
    }
}
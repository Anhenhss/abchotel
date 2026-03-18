using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AmenitiesController : ControllerBase
    {
        private readonly IAmenityService _amenityService;

        public AmenitiesController(IAmenityService amenityService)
        {
            _amenityService = amenityService;
        }

        // Bất kỳ ai cũng có thể xem danh sách tiện ích (để lọc phòng trên Web)
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAmenities([FromQuery] bool onlyActive = true)
        {
            var amenities = await _amenityService.GetAllAmenitiesAsync(onlyActive);
            return Ok(amenities);
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetAmenity(int id)
        {
            var amenity = await _amenityService.GetAmenityByIdAsync(id);
            if (amenity == null) return NotFound(new { message = "Không tìm thấy tiện ích." });
            return Ok(amenity);
        }

        // --- CÁC THAO TÁC QUẢN TRỊ KHO TỪ VỰNG TIỆN ÍCH ---

        [HttpPost]
        [Authorize(Policy = "MANAGE_INVENTORY")] 
        public async Task<IActionResult> CreateAmenity([FromBody] CreateAmenityRequest request)
        {
            var result = await _amenityService.CreateAmenityAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message, data = result.Data });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_INVENTORY")]
        public async Task<IActionResult> UpdateAmenity(int id, [FromBody] UpdateAmenityRequest request)
        {
            var success = await _amenityService.UpdateAmenityAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy tiện ích." });
            return Ok(new { message = "Cập nhật tiện ích thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_INVENTORY")]
        public async Task<IActionResult> DeleteAmenity(int id)
        {
            var success = await _amenityService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy tiện ích." });
            return Ok(new { message = "Đã thay đổi trạng thái ẩn/hiện của tiện ích." });
        }

        // --- API GÁN TIỆN ÍCH CHO LOẠI PHÒNG (NỐI BẢNG TRUNG GIAN) ---
        
        [HttpPost("assign-to-room-type")]
        [Authorize(Policy = "MANAGE_ROOMS")] // Dùng quyền Quản lý phòng vì nó tác động đến RoomType
        public async Task<IActionResult> AssignAmenities([FromBody] AssignAmenitiesRequest request)
        {
            var result = await _amenityService.AssignAmenitiesToRoomTypeAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }
    }
}
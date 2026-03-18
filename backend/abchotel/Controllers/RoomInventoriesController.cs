using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "MANAGE_INVENTORY")] // Bắt buộc phải có quyền quản lý kho/vật tư
    public class RoomInventoriesController : ControllerBase
    {
        private readonly IRoomInventoryService _inventoryService;

        public RoomInventoriesController(IRoomInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet("room/{roomId}")]
        public async Task<IActionResult> GetInventoryByRoom(int roomId, [FromQuery] bool onlyActive = true)
        {
            var items = await _inventoryService.GetInventoryByRoomIdAsync(roomId, onlyActive);
            return Ok(items);
        }

        [HttpPost]
        public async Task<IActionResult> CreateInventory([FromBody] CreateRoomInventoryRequest request)
        {
            var result = await _inventoryService.CreateInventoryAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateInventory(int id, [FromBody] UpdateRoomInventoryRequest request)
        {
            var success = await _inventoryService.UpdateInventoryAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy vật tư." });
            return Ok(new { message = "Cập nhật vật tư thành công." });
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteInventory(int id)
        {
            var success = await _inventoryService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy vật tư." });
            return Ok(new { message = "Đã thay đổi trạng thái theo dõi vật tư." });
        }

        // API ĐẶC BIỆT: Sao chép nhanh danh sách vật tư
        [HttpPost("clone")]
        public async Task<IActionResult> CloneInventory([FromBody] CloneInventoryRequest request)
        {
            var result = await _inventoryService.CloneInventoryAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }
    }
}
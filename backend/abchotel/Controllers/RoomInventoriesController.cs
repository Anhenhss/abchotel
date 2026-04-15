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
    public class RoomInventoriesController : ControllerBase
    {
        private readonly IRoomInventoryService _inventoryService;

        public RoomInventoriesController(IRoomInventoryService inventoryService)
        {
            _inventoryService = inventoryService;
        }

        [HttpGet("room/{roomId}")]
        // [Authorize(Policy = "RoomOrInventory")]
        public async Task<IActionResult> GetInventoryByRoom(int roomId, [FromQuery] bool onlyActive = true)
        {
            var items = await _inventoryService.GetInventoryByRoomIdAsync(roomId, onlyActive);
            return Ok(items);
        }

        [HttpPost]
        [Authorize(Policy = "RoomOrInventory")]
        public async Task<IActionResult> CreateInventory([FromBody] CreateRoomInventoryRequest request)
        {
            var result = await _inventoryService.CreateInventoryAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "RoomOrInventory")]
        public async Task<IActionResult> UpdateInventory(int id, [FromBody] UpdateRoomInventoryRequest request)
        {
            // 🔥 Nhận result từ Service để bắt lỗi Kho không đủ hàng
            var result = await _inventoryService.UpdateInventoryAsync(id, request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "RoomOrInventory")]
        public async Task<IActionResult> DeleteInventory(int id)
        {
            // 🔥 Nhận result từ Service để bắt lỗi Kho không đủ hàng khi phục hồi
            var result = await _inventoryService.ToggleSoftDeleteAsync(id);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPost("clone")]
        [Authorize(Policy = "RoomOrInventory")]
        public async Task<IActionResult> CloneInventory([FromBody] CloneInventoryRequest request)
        {
            var result = await _inventoryService.CloneInventoryAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }
    }
}
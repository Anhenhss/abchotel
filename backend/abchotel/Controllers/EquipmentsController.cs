using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")] 
    public class EquipmentsController : ControllerBase
    {
        private readonly IEquipmentService _equipmentService;

        public EquipmentsController(IEquipmentService equipmentService)
        {
            _equipmentService = equipmentService;
        }

        [HttpGet]
        [Authorize(Policy = "RoomOrInventory")]
        public async Task<IActionResult> GetAll([FromQuery] bool onlyActive = false)
        {
            var result = await _equipmentService.GetAllEquipmentsAsync(onlyActive);
            return Ok(result);
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "RoomOrInventory")]
        public async Task<IActionResult> GetById(int id)
        {
            var result = await _equipmentService.GetEquipmentByIdAsync(id);
            if (result == null) return NotFound(new { message = "Không tìm thấy vật tư." });
            return Ok(result);
        }

        [HttpGet("filter")]
        [Authorize(Policy = "RoomOrInventory")]
        public async Task<IActionResult> GetEquipments([FromQuery] EquipmentFilterRequest filter)
        {
            var result = await _equipmentService.GetEquipmentsAsync(filter);
            return Ok(result);
        }

        [HttpPost]
        [Authorize(Policy = "MANAGE_INVENTORY")]
        public async Task<IActionResult> Create([FromBody] CreateEquipmentRequest request)
        {
            var result = await _equipmentService.CreateEquipmentAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_INVENTORY")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateEquipmentRequest request)
        {
            var result = await _equipmentService.UpdateEquipmentAsync(id, request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_INVENTORY")]
        public async Task<IActionResult> Delete(int id)
        {
            var success = await _equipmentService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy vật tư." });

            return Ok(new { message = "Thay đổi trạng thái vật tư thành công." });
        }
    }
}
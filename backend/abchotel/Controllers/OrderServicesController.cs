using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Yêu cầu đăng nhập
    public class OrderServicesController : ControllerBase
    {
        private readonly IOrderServiceLogic _orderServiceLogic;

        public OrderServicesController(IOrderServiceLogic orderServiceLogic)
        {
            _orderServiceLogic = orderServiceLogic;
        }

        [HttpGet("booking-detail/{bookingDetailId}")]
        public async Task<IActionResult> GetOrdersByBookingDetail(int bookingDetailId)
        {
            return Ok(await _orderServiceLogic.GetOrdersByBookingDetailAsync(bookingDetailId));
        }

        [HttpPost]
        [Authorize(Policy = "MANAGE_SERVICES")] // Lễ tân thao tác
        public async Task<IActionResult> CreateOrder([FromBody] CreateOrderServiceRequest request)
        {
            var result = await _orderServiceLogic.CreateOrderAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] string status)
        {
            var success = await _orderServiceLogic.UpdateOrderStatusAsync(id, status);
            if (!success) return NotFound(new { message = "Không tìm thấy order." });
            return Ok(new { message = "Cập nhật trạng thái thành công." });
        }
    }
}
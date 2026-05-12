using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR; // Thêm
using abchotel.DTOs;
using abchotel.Services;
using abchotel.Hubs; // Đảm bảo namespace này đúng với folder Hubs của bạn

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ServicesController : ControllerBase
    {
        private readonly IServiceCatalogService _serviceCatalog;
        private readonly IHubContext<NotificationHub> _hubContext; // Thêm

        public ServicesController(IServiceCatalogService serviceCatalog, IHubContext<NotificationHub> hubContext)
        {
            _serviceCatalog = serviceCatalog;
            _hubContext = hubContext; // Gán
        }

        // --- API CATEGORIES ---
        [HttpGet("categories")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategories() => Ok(await _serviceCatalog.GetCategoriesAsync());

        [HttpPost("categories")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> CreateCategory([FromBody] ServiceCategoryRequest request)
        {
            var res = await _serviceCatalog.CreateCategoryAsync(request);
            if (!res.IsSuccess) return BadRequest(new { message = res.Message });

            // 🔥 Thông báo cập nhật danh mục
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload_services" });

            return Ok(new { message = res.Message });
        }

        [HttpPut("categories/{id}")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] ServiceCategoryRequest request)
        {
            var res = await _serviceCatalog.UpdateCategoryAsync(id, request);
            if (!res.IsSuccess) return BadRequest(new { message = res.Message });

            // 🔥 Thông báo cập nhật danh mục
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload_services" });

            return Ok(new { message = res.Message });
        }

        [HttpDelete("categories/{id}")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var success = await _serviceCatalog.DeleteCategoryAsync(id);
            if (!success) return BadRequest(new { message = "Không thể xóa danh mục đang có dịch vụ hoặc không tồn tại." });

            // 🔥 Thông báo cập nhật danh mục
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload_services" });

            return Ok(new { message = "Xóa danh mục thành công" });
        }

        // --- API SERVICES ---
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetServices([FromQuery] bool onlyActive = false) 
            => Ok(await _serviceCatalog.GetServicesAsync(onlyActive));

        [HttpPost]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> CreateService([FromBody] CreateServiceRequest request)
        {
            var res = await _serviceCatalog.CreateServiceAsync(request);
            if (!res.IsSuccess) return BadRequest(new { message = res.Message });

            // 🔥 Thông báo cập nhật dịch vụ
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload_services" });

            return Ok(new { message = res.Message });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] UpdateServiceRequest request)
        {
            var res = await _serviceCatalog.UpdateServiceAsync(id, request);
            if (!res.IsSuccess) return BadRequest(new { message = res.Message });

            // 🔥 Thông báo cập nhật dịch vụ
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload_services" });

            return Ok(new { message = res.Message });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var success = await _serviceCatalog.ToggleServiceStatusAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy dịch vụ" });

            // 🔥 Thông báo cập nhật trạng thái dịch vụ
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload_services" });

            return Ok(new { message = "Thay đổi trạng thái thành công" });
        }
    }
}
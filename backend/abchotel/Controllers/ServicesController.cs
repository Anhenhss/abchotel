using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    // 🔥 ĐÃ XÓA CHỮ AUTHORIZE Ở ĐÂY ĐỂ KHÁCH HÀNG VÀO ĐƯỢC CÁC HÀM XEM
    public class ServicesController : ControllerBase
    {
        private readonly IServiceCatalogService _serviceCatalog;

        public ServicesController(IServiceCatalogService serviceCatalog)
        {
            _serviceCatalog = serviceCatalog;
        }

        // --- API CATEGORIES ---
        [HttpGet("categories")]
        [AllowAnonymous] // 🔥 Khách hàng được xem danh mục
        public async Task<IActionResult> GetCategories() => Ok(await _serviceCatalog.GetCategoriesAsync());

        [HttpPost("categories")]
        [Authorize(Policy = "MANAGE_SERVICES")] // 🔥 Chỉ Quản lý mới được thêm
        public async Task<IActionResult> CreateCategory([FromBody] ServiceCategoryRequest request)
        {
            var res = await _serviceCatalog.CreateCategoryAsync(request);
            if (!res.IsSuccess) return BadRequest(new { message = res.Message });
            return Ok(new { message = res.Message });
        }

        [HttpPut("categories/{id}")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] ServiceCategoryRequest request)
        {
            var res = await _serviceCatalog.UpdateCategoryAsync(id, request);
            if (!res.IsSuccess) return BadRequest(new { message = res.Message });
            return Ok(new { message = res.Message });
        }

        [HttpDelete("categories/{id}")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            try
            {
                var success = await _serviceCatalog.DeleteCategoryAsync(id);
                if (!success) return NotFound(new { message = "Không tìm thấy danh mục" });
                return Ok(new { message = "Đã xóa danh mục" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // --- API SERVICES ---
        [HttpGet]
        [AllowAnonymous] // 🔥 Khách hàng được xem Dịch vụ
        public async Task<IActionResult> GetServices([FromQuery] bool onlyActive = false) 
            => Ok(await _serviceCatalog.GetServicesAsync(onlyActive));

        [HttpPost]
        [Authorize(Policy = "MANAGE_SERVICES")] // 🔥 Chỉ Quản lý mới được thêm
        public async Task<IActionResult> CreateService([FromBody] CreateServiceRequest request)
        {
            var res = await _serviceCatalog.CreateServiceAsync(request);
            if (!res.IsSuccess) return BadRequest(new { message = res.Message });
            return Ok(new { message = res.Message });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> UpdateService(int id, [FromBody] UpdateServiceRequest request)
        {
            var res = await _serviceCatalog.UpdateServiceAsync(id, request);
            if (!res.IsSuccess) return BadRequest(new { message = res.Message });
            return Ok(new { message = res.Message });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_SERVICES")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var success = await _serviceCatalog.ToggleServiceStatusAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy dịch vụ" });
            return Ok(new { message = "Thay đổi trạng thái thành công" });
        }
    }
}
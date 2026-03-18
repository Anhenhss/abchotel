using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArticleCategoriesController : ControllerBase
    {
        private readonly IArticleCategoryService _categoryService;

        public ArticleCategoriesController(IArticleCategoryService categoryService)
        {
            _categoryService = categoryService;
        }

        // Bất kỳ ai cũng có thể xem danh sách danh mục (cho Frontend load Menu)
        [HttpGet]
        [AllowAnonymous] 
        public async Task<IActionResult> GetCategories([FromQuery] bool onlyActive = true)
        {
            var categories = await _categoryService.GetAllCategoriesAsync(onlyActive);
            return Ok(categories);
        }

        // Bất kỳ ai cũng có thể xem chi tiết 1 danh mục (để lấy thông tin mô tả khi bấm vào menu)
        [HttpGet("{idOrSlug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCategory(string idOrSlug)
        {
            var category = await _categoryService.GetCategoryByIdOrSlugAsync(idOrSlug);
            if (category == null) return NotFound(new { message = "Không tìm thấy danh mục." });
            return Ok(category);
        }

        // Chỉ những user có quyền "MANAGE_CONTENT" mới được phép tạo danh mục
        [HttpPost]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> CreateCategory([FromBody] CreateCategoryRequest request)
        {
            var result = await _categoryService.CreateCategoryAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message, data = result.Data });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] UpdateCategoryRequest request)
        {
            var success = await _categoryService.UpdateCategoryAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy danh mục." });
            return Ok(new { message = "Cập nhật danh mục thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var success = await _categoryService.ToggleCategoryStatusAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy danh mục." });
            return Ok(new { message = "Đã thay đổi trạng thái ẩn/hiện của danh mục." });
        }
    }
}
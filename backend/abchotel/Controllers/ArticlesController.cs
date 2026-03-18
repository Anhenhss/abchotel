using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArticlesController : ControllerBase
    {
        private readonly IArticleService _articleService;

        public ArticlesController(IArticleService articleService)
        {
            _articleService = articleService;
        }

        private int GetCurrentUserId() => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier));

        // API Công khai: Lấy danh sách bài viết (Frontend hiển thị tin tức)
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetArticles([FromQuery] bool onlyPublished = true, [FromQuery] int? categoryId = null)
        {
            // Mặc định khách vãng lai chỉ thấy bài Đã xuất bản. 
            // Nếu là Admin muốn xem bản nháp, Frontend sẽ truyền onlyPublished = false kèm JWT
            var articles = await _articleService.GetAllArticlesAsync(onlyPublished);
            return Ok(articles);
        }

        // API Công khai: Xem chi tiết bài viết
        [HttpGet("{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArticleBySlug(string slug)
        {
            var article = await _articleService.GetArticleBySlugAsync(slug);
            if (article == null) return NotFound(new { message = "Không tìm thấy bài viết." });
            return Ok(article);
        }

        // ==========================================
        // KHU VỰC BẢO MẬT DÀNH CHO CONTENT CREATOR
        // ==========================================

        [HttpPost]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> CreateArticle([FromBody] CreateArticleRequest request)
        {
            // Cốt lõi bảo mật: Trích xuất ID tác giả từ Token
            int authorId = GetCurrentUserId();

            var result = await _articleService.CreateArticleAsync(authorId, request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            
            return Ok(new { message = result.Message, articleId = result.ArticleId });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> UpdateArticle(int id, [FromBody] UpdateArticleRequest request)
        {
            var success = await _articleService.UpdateArticleAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy bài viết." });
            return Ok(new { message = "Cập nhật bài viết thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> DeleteArticle(int id)
        {
            var success = await _articleService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy bài viết." });
            return Ok(new { message = "Đã thay đổi trạng thái hiển thị của bài viết." });
        }

        [HttpPost("{id}/thumbnail")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> UpdateThumbnail(int id, [FromBody] UpdateThumbnailRequest request)
        {
            var success = await _articleService.UpdateThumbnailAsync(id, request.ThumbnailUrl);
            if (!success) return NotFound(new { message = "Không tìm thấy bài viết." });
            return Ok(new { message = "Cập nhật ảnh bìa thành công." });
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var success = await _articleService.TogglePublishStatusAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy bài viết." });
            return Ok(new { message = "Đã thay đổi trạng thái Xuất bản/Bản nháp." });
        }
    }
}
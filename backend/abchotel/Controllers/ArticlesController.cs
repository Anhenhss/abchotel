using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using abchotel.DTOs;
using abchotel.Services;
using abchotel.Hubs; 

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ArticlesController : ControllerBase
    {
        private readonly IArticleService _articleService;
        private readonly IHubContext<NotificationHub> _hubContext;

        public ArticlesController(IArticleService articleService, IHubContext<NotificationHub> hubContext)
        {
            _articleService = articleService;
            _hubContext = hubContext;
        }

        // Lấy ID người dùng an toàn từ Token
        private int GetCurrentUserId()
        {
            var userIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return int.TryParse(userIdStr, out int id) ? id : 0;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetArticles([FromQuery] bool onlyPublished = true, [FromQuery] int? categoryId = null)
        {
            var articles = await _articleService.GetAllArticlesAsync(onlyPublished, categoryId); 
            return Ok(articles);
        }

        [HttpGet("{slug}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetArticleBySlug(string slug)
        {
            var article = await _articleService.GetArticleBySlugAsync(slug);
            if (article == null) return NotFound();
            return Ok(article);
        }

        [HttpPost]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> CreateArticle([FromBody] CreateArticleRequest request)
        {
            var result = await _articleService.CreateArticleAsync(GetCurrentUserId(), request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });

            // 🔥 BÁO CHO CLIENT RELOAD
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload" });

            return Ok(new { id = result.ArticleId });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> UpdateArticle(int id, [FromBody] UpdateArticleRequest request)
        {
            var success = await _articleService.UpdateArticleAsync(id, request);
            if (!success) return NotFound(new { message = "Không tìm thấy bài viết." });

            // 🔥 BÁO CHO CLIENT RELOAD
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload" });

            return Ok(new { message = "Cập nhật thành công." });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> DeleteArticle(int id)
        {
            var success = await _articleService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound();

            // 🔥 BÁO CHO CLIENT RELOAD (Khi ẩn bài)
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload" });

            return Ok(new { message = "Đã thay đổi trạng thái hiển thị." });
        }

        [HttpPatch("{id}/status")]
        [Authorize(Policy = "MANAGE_CONTENT")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var success = await _articleService.TogglePublishStatusAsync(id);
            if (!success) return NotFound();

            // 🔥 BÁO CHO CLIENT RELOAD (Khi xuất bản bài)
            await _hubContext.Clients.All.SendAsync("ReceiveNotification", new { action = "reload" });

            return Ok(new { message = "Đã thay đổi trạng thái xuất bản." });
        }
    }
}
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Policy = "MANAGE_CONTENT")] // Chỉ những người có quyền làm Content mới được upload file rác lên server
    public class MediaController : ControllerBase
    {
        private readonly IMediaService _mediaService;

        public MediaController(IMediaService mediaService)
        {
            _mediaService = mediaService;
        }

        [HttpPost("upload")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest(new { message = "Vui lòng chọn một file ảnh hợp lệ." });

            try
            {
                var result = await _mediaService.UploadImageAsync(file);
                return Ok(new { message = "Upload ảnh thành công.", data = result });
            }
            catch (System.Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi upload ảnh lên Cloudinary: " + ex.Message });
            }
        }

        [HttpDelete("{publicId}")]
        public async Task<IActionResult> DeleteImage(string publicId)
        {
            // publicId trên URL có thể chứa dấu "/", cần decode nếu cần thiết.
            var success = await _mediaService.DeleteImageAsync(publicId);
            if (!success) return BadRequest(new { message = "Xóa ảnh thất bại hoặc không tìm thấy ảnh." });
            
            return Ok(new { message = "Đã xóa ảnh trên hệ thống." });
        }
    }
}
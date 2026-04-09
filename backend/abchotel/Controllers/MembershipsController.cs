using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class MembershipsController : ControllerBase
    {
        private readonly IMembershipService _membershipService;

        public MembershipsController(IMembershipService membershipService)
        {
            _membershipService = membershipService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            return Ok(await _membershipService.GetAllMembershipsAsync());
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var membership = await _membershipService.GetMembershipByIdAsync(id);
            if (membership == null) return NotFound(new { message = "Không tìm thấy dữ liệu." });
            return Ok(membership);
        }

        [HttpPost]
        [Authorize(Policy = "MANAGE_USERS")] // Chỉ Admin hoặc HR mới được tạo/sửa hạng
        public async Task<IActionResult> Create([FromBody] CreateMembershipRequest request)
        {
            var result = await _membershipService.CreateMembershipAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_USERS")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateMembershipRequest request)
        {
            var result = await _membershipService.UpdateMembershipAsync(id, request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_USERS")]
        public async Task<IActionResult> Delete(int id)
        {
            var result = await _membershipService.DeleteMembershipAsync(id);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }
    }
}
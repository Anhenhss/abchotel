using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using abchotel.DTOs;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VouchersController : ControllerBase
    {
        private readonly IVoucherService _voucherService;

        public VouchersController(IVoucherService voucherService)
        {
            _voucherService = voucherService;
        }

        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetAll()
        {
            // Truyền true để chỉ lấy các Voucher đang Active và phù hợp logic IsForNewCustomer
            return Ok(await _voucherService.GetAllVouchersAsync(onlyActive: true));
        }

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetById(int id)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null) return NotFound(new { message = "Không tìm thấy mã khuyến mãi." });
            return Ok(voucher);
        }

        [HttpPost]
        [Authorize(Policy = "MANAGE_VOUCHERS")]
        public async Task<IActionResult> Create([FromBody] CreateVoucherRequest request)
        {
            var result = await _voucherService.CreateVoucherAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpPut("{id}")]
        [Authorize(Policy = "MANAGE_VOUCHERS")]
        public async Task<IActionResult> Update(int id, [FromBody] UpdateVoucherRequest request)
        {
            var result = await _voucherService.UpdateVoucherAsync(id, request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            return Ok(new { message = result.Message });
        }

        [HttpDelete("{id}")]
        [Authorize(Policy = "MANAGE_VOUCHERS")]
        public async Task<IActionResult> ToggleStatus(int id)
        {
            var success = await _voucherService.ToggleSoftDeleteAsync(id);
            if (!success) return NotFound(new { message = "Không tìm thấy mã." });
            return Ok(new { message = "Đã thay đổi trạng thái mã khuyến mãi." });
        }

        // 🔥 API Cho khách hàng áp mã (Bất kỳ ai đã đăng nhập đều xài được)
        [HttpPost("apply")]
        [Authorize]
        public async Task<IActionResult> ApplyVoucher([FromBody] ValidateVoucherRequest request)
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var result = await _voucherService.ValidateAndCalculateDiscountAsync(userId, request);
            if (!result.IsValid) return BadRequest(new { message = result.Message });

            return Ok(result);
        }

        [HttpGet("birthday")]
        [Authorize] // Bắt buộc đăng nhập để xác định ngày sinh
        public async Task<IActionResult> GetBirthdayVouchers()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var vouchers = await _voucherService.GetBirthdayVouchersAsync(userId);
            return Ok(vouchers);
        }

        [HttpGet("vip")]
        [Authorize] // Bắt buộc đăng nhập để xác định hạng thành viên
        public async Task<IActionResult> GetVipVouchers()
        {
            var userIdStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (!int.TryParse(userIdStr, out int userId)) return Unauthorized();

            var vouchers = await _voucherService.GetVipVouchersAsync(userId);
            return Ok(vouchers);
        }
    }
}
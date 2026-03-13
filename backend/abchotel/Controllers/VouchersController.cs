using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
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

        // Endpoint dành cho luồng khách hàng (Frontend)
        [HttpPost("apply")]
        public async Task<IActionResult> ApplyVoucher([FromBody] ApplyVoucherRequest request)
        {
            var result = await _voucherService.ApplyVoucherAsync(request);

            if (!result.IsSuccess)
            {
                // Nếu vi phạm điều kiện, trả về HTTP 400 Bad Request
                return BadRequest(new { message = result.Message });
            }

            // Thành công trả về HTTP 200 OK
            return Ok(result);
        }
    }
}
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
    public class InvoicesController : ControllerBase
    {
        private readonly IInvoiceService _invoiceService;

        public InvoicesController(IInvoiceService invoiceService)
        {
            _invoiceService = invoiceService;
        }

        [HttpGet]
        [Authorize(Policy = "MANAGE_INVOICES")]
        public async Task<IActionResult> GetAll([FromQuery] string status = null)
        {
            return Ok(await _invoiceService.GetAllInvoicesAsync(status));
        }

        [HttpGet("{id}")]
        [Authorize(Policy = "MANAGE_INVOICES")]
        public async Task<IActionResult> GetById(int id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn." });
            return Ok(invoice);
        }

        // 🔥 API Gọi bằng tay để ép hệ thống tính lại tiền
        [HttpPost("{id}/recalculate")]
        [Authorize(Policy = "MANAGE_INVOICES")]
        public async Task<IActionResult> Recalculate(int id)
        {
            var success = await _invoiceService.RecalculateInvoiceAsync(id);
            if (!success) return BadRequest(new { message = "Không thể tính lại hóa đơn này (Có thể đã thanh toán xong)." });
            return Ok(new { message = "Đã tính toán lại hóa đơn thành công." });
        }

        [HttpPost("pay")]
        [Authorize(Policy = "MANAGE_INVOICES")] // Thu ngân/Lễ tân mới được thu tiền mặt
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _invoiceService.ProcessPaymentAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });
            
            return Ok(new { message = result.Message });
        }
    }
}
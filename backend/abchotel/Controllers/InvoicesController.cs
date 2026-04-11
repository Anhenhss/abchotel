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
        private readonly IVnPayService _vnPayService;
        private readonly IMoMoService _moMoService;
        public InvoicesController(IInvoiceService invoiceService, IVnPayService vnPayService, IMoMoService moMoService)
        {
            _invoiceService = invoiceService;
            _vnPayService = vnPayService;
            _moMoService = moMoService;
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
        // 🔥 THÊM API NÀY VÀO
        [HttpGet("by-booking/{bookingCode}")]
        [Authorize(Policy = "MANAGE_INVOICES")]
        public async Task<IActionResult> GetByBookingCode(string bookingCode)
        {
            var invoice = await _invoiceService.GetInvoiceByBookingCodeAsync(bookingCode);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn cho mã đặt phòng này." });
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
        // 1. API React gọi để lấy Link chuyển sang trang web VNPay
        [HttpPost("{id}/create-vnpay-url")]
        [Authorize]
        public async Task<IActionResult> CreateVnPayUrl(int id)
        {
            // Kiểm tra Hóa đơn có tồn tại và còn nợ tiền không
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn" });
            if (invoice.Status == "Paid") return BadRequest(new { message = "Hóa đơn này đã được thanh toán" });

            decimal amountToPay = invoice.BalanceDue;
            string orderInfo = $"Thanh toan hoa don {id} cho don dat phong {invoice.BookingCode}";

            // Gọi hàm tạo Link
            string paymentUrl = _vnPayService.CreatePaymentUrl(HttpContext, id, amountToPay, orderInfo);

            return Ok(new { url = paymentUrl });
        }

        // 2. API React gọi khi VNPay "đá" khách về lại web
        [HttpGet("vnpay-return")]
        public async Task<IActionResult> VnPayReturn()
        {
            // Đọc các Query String trên thanh địa chỉ URL do VNPay gửi về
            var response = _vnPayService.PaymentExecute(Request.Query);

            if (response.IsSuccess)
            {
                // Nếu VNPay báo thành công -> Gọi hàm tính tiền của InvoiceService để gạch nợ
                var invoice = await _invoiceService.GetInvoiceByIdAsync(response.InvoiceId);
                if (invoice != null && invoice.Status != "Paid")
                {
                    var paymentRequest = new PaymentRequest
                    {
                        InvoiceId = response.InvoiceId,
                        PaymentMethod = "VNPay",
                        AmountPaid = invoice.BalanceDue, // Trả full
                        TransactionCode = response.TransactionId,
                        GatewayResponse = Request.QueryString.Value
                    };

                    await _invoiceService.ProcessPaymentAsync(paymentRequest);
                }

                // (Tuỳ chọn) Em có thể cho Redirect thẳng về Frontend bằng code này nếu không muốn trả JSON
                // return Redirect($"http://localhost:3000/payment-result?status=success&invoiceId={response.InvoiceId}");

                return Ok(new { message = "Thanh toán VNPay thành công!", invoiceId = response.InvoiceId });
            }

            // Báo lỗi nếu khách ấn Hủy thanh toán hoặc thẻ không đủ tiền
            return BadRequest(new { message = response.Message, invoiceId = response.InvoiceId });
        }
        [HttpPost("{id}/create-momo-url")]
        [Authorize] 
        public async Task<IActionResult> CreateMoMoUrl(int id)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn" });
            if (invoice.Status == "Paid") return BadRequest(new { message = "Hóa đơn này đã được thanh toán" });

            decimal amountToPay = invoice.BalanceDue;
            string orderInfo = $"Thanh toan don dat phong {invoice.BookingCode}";

            try 
            {
                string paymentUrl = await _moMoService.CreatePaymentUrlAsync(id, amountToPay, orderInfo);
                return Ok(new { url = paymentUrl });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("momo-return")]
        public async Task<IActionResult> MoMoReturn()
        {
            var response = _moMoService.PaymentExecute(Request.Query);

            if (response.IsSuccess)
            {
                var invoice = await _invoiceService.GetInvoiceByIdAsync(response.InvoiceId);
                if (invoice != null && invoice.Status != "Paid")
                {
                    var paymentRequest = new PaymentRequest
                    {
                        InvoiceId = response.InvoiceId,
                        PaymentMethod = "MoMo",
                        AmountPaid = invoice.BalanceDue,
                        TransactionCode = response.TransactionId,
                        GatewayResponse = Request.QueryString.Value 
                    };
                    await _invoiceService.ProcessPaymentAsync(paymentRequest);
                }
                return Ok(new { message = "Thanh toán MoMo thành công!", invoiceId = response.InvoiceId });
            }

            return BadRequest(new { message = response.Message, invoiceId = response.InvoiceId });
        }
    }
}
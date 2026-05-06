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
        [AllowAnonymous] // 🔥 RẤT QUAN TRỌNG: Mở cửa cho VNPay không cần đăng nhập
        public async Task<IActionResult> VnPayReturn()
        {
            var response = _vnPayService.PaymentExecute(Request.Query);

            if (response.IsSuccess)
            {
                var invoice = await _invoiceService.GetInvoiceByIdAsync(response.InvoiceId);
                if (invoice != null && invoice.Status != "Paid")
                {
                    var paymentRequest = new PaymentRequest
                    {
                        InvoiceId = response.InvoiceId,
                        PaymentMethod = "VNPay",
                        AmountPaid = invoice.BalanceDue,
                        TransactionCode = response.TransactionId,
                        GatewayResponse = Request.QueryString.Value
                    };
                    await _invoiceService.ProcessPaymentAsync(paymentRequest);
                }
                
                // 🔥 Trả về HTML tự động tắt Tab
                return GenerateAutoCloseHtml(true, "Giao dịch VNPay thành công!");
            }

            return GenerateAutoCloseHtml(false, response.Message);
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
        [AllowAnonymous] // 🔥 RẤT QUAN TRỌNG: Mở cửa cho MoMo không cần đăng nhập
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
                
                // 🔥 Trả về HTML tự động tắt Tab
                return GenerateAutoCloseHtml(true, "Giao dịch MoMo thành công!");
            }

            return GenerateAutoCloseHtml(false, response.Message);
        }

        // 🔥 API MỚI THÊM VÀO: DÀNH RIÊNG CHO KHÁCH HÀNG (TRANG PAYMENT)
        // =======================================================
        [HttpGet("client-bill/{bookingCode}")]
        [AllowAnonymous] // Không bắt khách đăng nhập
        public async Task<IActionResult> GetClientInvoiceByCode(string bookingCode)
        {
            var invoice = await _invoiceService.GetInvoiceByBookingCodeAsync(bookingCode);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn cho mã đặt phòng này." });
            return Ok(invoice);
        }

        // =========================================================
        // 🔥 HÀM PHỤ TRỢ: TẠO GIAO DIỆN TỰ ĐỘNG TẮT TAB SAU 3 GIÂY
        // =========================================================
        private IActionResult GenerateAutoCloseHtml(bool isSuccess, string message)
        {
            string color = isSuccess ? "#1B5E20" : "#8A1538";
            string title = isSuccess ? "THÀNH CÔNG!" : "THẤT BẠI!";
            string subText = isSuccess ? "Hệ thống đã ghi nhận thanh toán." : $"Lý do: {message}";
            
            string html = $@"
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset='utf-8'>
                    <title>Kết quả thanh toán</title>
                </head>
                <body style='text-align:center; font-family:""Segoe UI"", Tahoma, Geneva, Verdana, sans-serif; margin-top:100px; background-color:#F8FAFC;'>
                    <div style='background: white; width: 400px; margin: 0 auto; padding: 40px; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-top: 5px solid {color};'>
                        <h1 style='color:{color}; font-size: 28px; margin-bottom: 10px;'>{title}</h1>
                        <p style='color:#3A506B; font-size: 16px;'>{subText}</p>
                        <hr style='border: none; border-top: 1px dashed #B4CDED; margin: 20px 0;' />
                        <p style='color:#8A1538; font-style: italic; font-weight: bold;'>Tab này sẽ tự động đóng sau 3 giây...</p>
                    </div>
                    <script>
                        setTimeout(() => {{ window.close(); }}, 3000);
                    </script>
                </body>
                </html>";
            
            return Content(html, "text/html", System.Text.Encoding.UTF8);
        }
    }
}
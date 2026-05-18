using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.DTOs;
using abchotel.Services;
using System.Collections.Generic;
using System;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
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

        [HttpGet("by-booking/{bookingCode}")]
        [AllowAnonymous] 
        public async Task<IActionResult> GetByBookingCode(string bookingCode)
        {
            var invoice = await _invoiceService.GetInvoiceByBookingCodeAsync(bookingCode);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn cho mã đặt phòng này." });
            return Ok(invoice);
        }

        [HttpPost("{id}/recalculate")]
        [Authorize(Policy = "MANAGE_INVOICES")]
        public async Task<IActionResult> Recalculate(int id)
        {
            var success = await _invoiceService.RecalculateInvoiceAsync(id);
            if (!success) return BadRequest(new { message = "Không thể tính lại hóa đơn này (Có thể đã thanh toán xong hoặc đã hủy)." });
            return Ok(new { message = "Đã tính toán lại hóa đơn thành công." });
        }

        [HttpPost("pay")]
        [Authorize(Policy = "MANAGE_INVOICES")]
        public async Task<IActionResult> ProcessPayment([FromBody] PaymentRequest request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            var result = await _invoiceService.ProcessPaymentAsync(request);
            if (!result.IsSuccess) return BadRequest(new { message = result.Message });

            return Ok(new { message = result.Message });
        }

        [HttpPost("{id}/mark-refunded")]
        [Authorize(Policy = "MANAGE_INVOICES")]
        public async Task<IActionResult> MarkRefunded(int id)
        {
            var success = await _invoiceService.MarkAsRefundedAsync(id);
            if (!success) return BadRequest(new { message = "Hóa đơn không hợp lệ hoặc không ở trạng thái chờ hoàn tiền." });
            return Ok(new { message = "Đã xác nhận hoàn tiền thành công." });
        }

        // 🔥 THÊM LẠI: isDeposit để thu 20%
        [HttpPost("{id}/create-vnpay-url")]
        [AllowAnonymous]
        public async Task<IActionResult> CreateVnPayUrl(int id, [FromQuery] bool isDeposit = false)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn" });
            if (invoice.Status == "Paid") return BadRequest(new { message = "Hóa đơn này đã được thanh toán" });

            decimal amountToPay = isDeposit ? Math.Round((invoice.FinalTotal) * 0.20m) : invoice.BalanceDue;
            string orderInfo = $"Thanh toan {(isDeposit ? "coc 20%" : "toan bo")} hoa don {id} cho don dat phong {invoice.BookingCode}";

            string paymentUrl = _vnPayService.CreatePaymentUrl(HttpContext, id, amountToPay, orderInfo);

            return Ok(new { url = paymentUrl });
        }

        [HttpGet("vnpay-return")]
        [AllowAnonymous] 
        public async Task<IActionResult> VnPayReturn()
        {
            var response = _vnPayService.PaymentExecute(Request.Query);

            if (response.IsSuccess)
            {
                var invoice = await _invoiceService.GetInvoiceByIdAsync(response.InvoiceId);
                if (invoice != null && invoice.Status != "Paid")
                {
                    // Lấy số tiền thực tế khách đã thanh toán qua cổng về
                    var vnpAmountStr = Request.Query["vnp_Amount"].ToString();
                    decimal actualAmountPaid = string.IsNullOrEmpty(vnpAmountStr) ? invoice.BalanceDue : (Convert.ToDecimal(vnpAmountStr) / 100);

                    var paymentRequest = new PaymentRequest
                    {
                        InvoiceId = response.InvoiceId,
                        PaymentMethod = "VNPay",
                        AmountPaid = actualAmountPaid,
                        TransactionCode = response.TransactionId,
                        GatewayResponse = Request.QueryString.Value
                    };
                    await _invoiceService.ProcessPaymentAsync(paymentRequest);
                }
                
                return GenerateAutoCloseHtml(true, "Giao dịch VNPay thành công!");
            }

            return GenerateAutoCloseHtml(false, response.Message);
        }

        // 🔥 THÊM LẠI: isDeposit để thu 20%
        [HttpPost("{id}/create-momo-url")]
        [AllowAnonymous] 
        public async Task<IActionResult> CreateMoMoUrl(int id, [FromQuery] bool isDeposit = false)
        {
            var invoice = await _invoiceService.GetInvoiceByIdAsync(id);
            if (invoice == null) return NotFound(new { message = "Không tìm thấy hóa đơn" });
            if (invoice.Status == "Paid") return BadRequest(new { message = "Hóa đơn này đã được thanh toán" });

            decimal amountToPay = isDeposit ? Math.Round((invoice.FinalTotal) * 0.20m) : invoice.BalanceDue;
            string orderInfo = $"Thanh toan {(isDeposit ? "coc 20%" : "toan bo")} don dat phong {invoice.BookingCode}";

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
        [AllowAnonymous] 
        public async Task<IActionResult> MoMoReturn()
        {
            var response = _moMoService.PaymentExecute(Request.Query);

            if (response.IsSuccess)
            {
                var invoice = await _invoiceService.GetInvoiceByIdAsync(response.InvoiceId);
                if (invoice != null && invoice.Status != "Paid")
                {
                    var momoAmountStr = Request.Query["amount"].ToString();
                    decimal actualAmountPaid = string.IsNullOrEmpty(momoAmountStr) ? invoice.BalanceDue : Convert.ToDecimal(momoAmountStr);

                    var paymentRequest = new PaymentRequest
                    {
                        InvoiceId = response.InvoiceId,
                        PaymentMethod = "MoMo",
                        AmountPaid = actualAmountPaid,
                        TransactionCode = response.TransactionId,
                        GatewayResponse = Request.QueryString.Value 
                    };
                    await _invoiceService.ProcessPaymentAsync(paymentRequest);
                }
                
                return GenerateAutoCloseHtml(true, "Giao dịch MoMo thành công!");
            }

            return GenerateAutoCloseHtml(false, response.Message);
        }

        [HttpPost("{id}/add-service")]
        [AllowAnonymous] 
        public async Task<IActionResult> AddServiceToInvoice(int id, [FromBody] dynamic request)
        {
            try {
                return Ok(new { message = "Đã thêm dịch vụ vào hóa đơn." });
            } catch (Exception ex) {
                return BadRequest(new { message = ex.Message });
            }
        }

        private IActionResult GenerateAutoCloseHtml(bool isSuccess, string message)
        {
            string color = isSuccess ? "#1B5E20" : "#8A1538";
            string title = isSuccess ? "THÀNH CÔNG!" : "THẤT BẠI!";
            string subText = isSuccess ? "Hệ thống đã ghi nhận thanh toán." : $"Lý do: {message}";
            
            string frontendUrl = "http://localhost:5173/"; 
            
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
                        <p style='color:#8A1538; font-style: italic; font-weight: bold;'>Hệ thống sẽ tự động quay về trang chủ sau 3 giây...</p>
                    </div>
                    <script>
                        setTimeout(() => {{ window.location.href = '{frontendUrl}'; }}, 3000);
                    </script>
                </body>
                </html>";
            
            return Content(html, "text/html", System.Text.Encoding.UTF8);
        }
    }
}
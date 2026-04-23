using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Yêu cầu phải đăng nhập mới được xem báo cáo
    public class ReportsController : ControllerBase
    {
        private readonly HotelDbContext _context;

        public ReportsController(HotelDbContext context)
        {
            _context = context;
        }

        [HttpGet("revenue")]
        [Authorize(Policy = "VIEW_REPORTS")] // Chỉ cho phép Quản lý/Sếp xem
        public async Task<IActionResult> GetRevenueReport([FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            try
            {
                // Mở rộng endDate đến 23:59:59 của ngày đó để lấy trọn vẹn dữ liệu
                var endOfDay = endDate.Date.AddDays(1).AddTicks(-1);

                // 1. Lấy danh sách Hóa đơn trong khoảng thời gian này
                var invoices = await _context.Invoices
                    .Include(i => i.Booking)
                    .Where(i => i.CreatedAt >= startDate.Date && i.CreatedAt <= endOfDay)
                    .ToListAsync();

                // 2. TÍNH TOÁN KPI (Chỉ tính các hóa đơn đã thanh toán xong)
                var paidInvoices = invoices.Where(i => i.Status == "Paid").ToList();
                
                decimal totalRoom = paidInvoices.Sum(i => i.TotalRoomAmount ?? 0);
                decimal totalService = paidInvoices.Sum(i => i.TotalServiceAmount ?? 0);
                
                // Vì trong cấu trúc cũ, TotalServiceAmount gộp cả Dịch vụ & Đền bù, 
                // nên tạm thời ta tách VAT ra để xem tổng quan
                decimal totalTax = paidInvoices.Sum(i => i.TaxAmount ?? 0);
                decimal totalRevenue = paidInvoices.Sum(i => i.FinalTotal ?? 0);

                // 3. TÍNH DỮ LIỆU BIỂU ĐỒ CỘT (DOANH THU THEO NGÀY)
                // Lấy dữ liệu từ bảng Payments để chính xác dòng tiền thu vào ngày nào
                var payments = await _context.Payments
                    .Where(p => p.PaymentDate >= startDate.Date && p.PaymentDate <= endOfDay)
                    .ToListAsync();

                var chartData = payments
                    .GroupBy(p => p.PaymentDate.Value.Date)
                    .Select(g => new {
                        date = g.Key.ToString("dd/MM"),
                        revenue = g.Sum(p => p.AmountPaid)
                    })
                    .OrderBy(x => x.date)
                    .ToList();

                // 4. TÍNH DỮ LIỆU BIỂU ĐỒ TRÒN (CƠ CẤU DOANH THU)
                var pieData = new[]
                {
                    new { name = "Tiền phòng", value = totalRoom },
                    new { name = "Phí dịch vụ & Phụ thu", value = totalService },
                    new { name = "Thuế VAT (10%)", value = totalTax }
                }.Where(x => x.value > 0).ToList();

                // 5. LẤY DANH SÁCH GIAO DỊCH GẦN ĐÂY NHẤT TRONG KỲ
                var recentTransactions = invoices
                    .OrderByDescending(i => i.CreatedAt)
                    .Select(i => new {
                        id = i.Id,
                        guestName = i.Booking?.GuestName,
                        finalTotal = i.FinalTotal ?? 0,
                        paymentDate = i.UpdatedAt ?? i.CreatedAt,
                        status = i.Status
                    })
                    .ToList();

                // ĐÓNG GÓI VÀ GỬI VỀ CHO REACT
                return Ok(new
                {
                    kpis = new {
                        totalRevenue = totalRevenue,
                        roomRevenue = totalRoom,
                        serviceRevenue = totalService,
                        damageRevenue = 0 // Tạm để 0 vì đã gộp chung vào Service
                    },
                    chartData = chartData,
                    pieData = pieData,
                    recentTransactions = recentTransactions
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = "Lỗi khi xuất báo cáo: " + ex.Message });
            }
        }
    }
}
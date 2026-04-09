using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System.Security.Claims;
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IInvoiceService
    {
        Task<List<InvoiceResponse>> GetAllInvoicesAsync(string status = null);
        Task<InvoiceResponse> GetInvoiceByIdAsync(int id);
        
        // 🔥 Hàm quan trọng nhất: Tự động tính toán lại tiền khi có thay đổi
        Task<bool> RecalculateInvoiceAsync(int invoiceId);
        
        // Nhận thanh toán từ khách
        Task<(bool IsSuccess, string Message)> ProcessPaymentAsync(PaymentRequest request);
    }

    public class InvoiceService : IInvoiceService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public InvoiceService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
        }

        private async Task<string> GetCurrentUserNameAsync()
        {
            var userIdStr = _httpContextAccessor.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdStr, out int userId))
            {
                var user = await _context.Users.FindAsync(userId);
                return user?.FullName ?? "Hệ thống";
            }
            return "Hệ thống trực tuyến";
        }

        public async Task<List<InvoiceResponse>> GetAllInvoicesAsync(string status = null)
        {
            var query = _context.Invoices
                .Include(i => i.Booking)
                .Include(i => i.Payments)
                .AsQueryable();

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(i => i.Status == status);
            }

            return await query.OrderByDescending(i => i.CreatedAt).Select(i => new InvoiceResponse
            {
                Id = i.Id,
                BookingId = i.BookingId,
                BookingCode = i.Booking != null ? i.Booking.BookingCode : "N/A",
                GuestName = i.Booking != null ? i.Booking.GuestName : "N/A",
                TotalRoomAmount = i.TotalRoomAmount ?? 0,
                TotalServiceAmount = i.TotalServiceAmount ?? 0,
                DiscountAmount = i.DiscountAmount ?? 0,
                TaxAmount = i.TaxAmount ?? 0,
                FinalTotal = i.FinalTotal ?? 0,
                AmountPaid = i.Payments.Sum(p => p.AmountPaid),
                Status = i.Status,
                CreatedAt = i.CreatedAt
            }).ToListAsync();
        }

        public async Task<InvoiceResponse> GetInvoiceByIdAsync(int id)
        {
            var i = await _context.Invoices
                .Include(i => i.Booking)
                .Include(i => i.Payments)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (i == null) return null;

            return new InvoiceResponse
            {
                Id = i.Id, BookingId = i.BookingId, BookingCode = i.Booking?.BookingCode, GuestName = i.Booking?.GuestName,
                TotalRoomAmount = i.TotalRoomAmount ?? 0, TotalServiceAmount = i.TotalServiceAmount ?? 0,
                DiscountAmount = i.DiscountAmount ?? 0, TaxAmount = i.TaxAmount ?? 0, FinalTotal = i.FinalTotal ?? 0,
                AmountPaid = i.Payments.Sum(p => p.AmountPaid), Status = i.Status, CreatedAt = i.CreatedAt
            };
        }

        // =========================================================================
        // 🔥 THUẬT TOÁN TÍNH TOÁN LẠI HÓA ĐƠN (GOM TIỀN PHÒNG + DỊCH VỤ + ĐỀN BÙ)
        // =========================================================================
        public async Task<bool> RecalculateInvoiceAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Booking).ThenInclude(b => b.Voucher)
                .Include(i => i.Booking).ThenInclude(b => b.BookingDetails).ThenInclude(bd => bd.OrderServices)
                .Include(i => i.Booking).ThenInclude(b => b.BookingDetails).ThenInclude(bd => bd.LossAndDamages)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null || invoice.Status == "Paid") return false; // Đã trả tiền thì không tính lại nữa

            decimal totalRoom = 0;
            decimal totalService = 0;
            decimal totalDamage = 0;

            foreach (var detail in invoice.Booking.BookingDetails)
            {
                // 1. Tính tiền phòng
                int duration = detail.PriceType == "HOURLY" 
                    ? (int)Math.Ceiling((detail.CheckOutDate - detail.CheckInDate).TotalHours)
                    : (int)(detail.CheckOutDate.Date - detail.CheckInDate.Date).TotalDays;
                if (duration <= 0) duration = 1;
                totalRoom += (detail.AppliedPrice * duration);

                // 2. Tính tiền Dịch vụ (Bỏ qua các order bị hủy)
                totalService += detail.OrderServices.Where(o => o.Status != "Cancelled").Sum(o => o.TotalAmount ?? 0);

                // 3. Tính tiền Phạt/Đền bù (Bỏ qua các biên bản bị hủy)
                totalDamage += detail.LossAndDamages.Where(l => l.Status != "Cancelled").Sum(l => l.PenaltyAmount);
            }

            // Gộp dịch vụ và đền bù vào 1 cục Dịch Vụ Phát Sinh
            decimal totalExtras = totalService + totalDamage;

            // 4. Áp dụng Khuyến mãi (Chỉ giảm trên tiền phòng)
            decimal discount = 0;
            var voucher = invoice.Booking.Voucher;
            if (voucher != null && voucher.IsActive)
            {
                if (voucher.DiscountType == "PERCENT")
                {
                    discount = totalRoom * (voucher.DiscountValue / 100);
                    if (voucher.MaxDiscountAmount.HasValue && discount > voucher.MaxDiscountAmount.Value)
                        discount = voucher.MaxDiscountAmount.Value;
                }
                else
                {
                    discount = voucher.DiscountValue;
                }
                if (discount > totalRoom) discount = totalRoom;
            }

            // 5. Tính Thuế (10% trên tổng tiền đã trừ khuyến mãi)
            decimal subTotal = totalRoom + totalExtras - discount;
            decimal tax = subTotal * 0.10m;
            decimal finalTotal = subTotal + tax;

            // 6. Cập nhật lại Hóa đơn
            invoice.TotalRoomAmount = totalRoom;
            invoice.TotalServiceAmount = totalExtras;
            invoice.DiscountAmount = discount;
            invoice.TaxAmount = tax;
            invoice.FinalTotal = finalTotal;
            invoice.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        // =========================================================================
        // GHI NHẬN THANH TOÁN TỪ KHÁCH HÀNG
        // =========================================================================
        public async Task<(bool IsSuccess, string Message)> ProcessPaymentAsync(PaymentRequest request)
        {
            var invoice = await _context.Invoices.Include(i => i.Payments).Include(i => i.Booking).FirstOrDefaultAsync(i => i.Id == request.InvoiceId);
            if (invoice == null) return (false, "Không tìm thấy hóa đơn.");

            // 1. Tạo bản ghi thanh toán
            var payment = new Payment
            {
                InvoiceId = request.InvoiceId,
                PaymentMethod = request.PaymentMethod,
                AmountPaid = request.AmountPaid,
                TransactionCode = request.TransactionCode,
                PaymentDate = DateTime.Now,
                CreatedAt = DateTime.Now
            };

            _context.Payments.Add(payment);

            // 2. Kiểm tra xem khách đã trả đủ tiền chưa?
            decimal totalPaidSoFar = invoice.Payments.Sum(p => p.AmountPaid) + request.AmountPaid;
            
            if (totalPaidSoFar >= invoice.FinalTotal)
            {
                invoice.Status = "Paid"; // Đổi trạng thái hóa đơn thành Đã thanh toán
                
                // Nếu khách đặt online đang Pending, trả đủ tiền thì tự động chuyển thành Confirmed
                if (invoice.Booking != null && invoice.Booking.Status == "Pending")
                {
                    invoice.Booking.Status = "Confirmed";
                }
            }
            else
            {
                invoice.Status = "Partial"; // Mới trả cọc hoặc trả một phần
            }

            await _context.SaveChangesAsync();

            // 3. Bắn thông báo cho Kế toán và Lễ tân
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_INVOICES", "Thanh toán mới", $"[{userName}] vừa thu {request.AmountPaid:N0}đ cho hóa đơn của mã {invoice.Booking?.BookingCode}.");

            return (true, "Ghi nhận thanh toán thành công.");
        }
    }
}
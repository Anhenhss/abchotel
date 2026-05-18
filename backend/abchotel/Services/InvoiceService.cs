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
        Task<InvoiceResponse> GetInvoiceByBookingCodeAsync(string bookingCode);
        Task<bool> RecalculateInvoiceAsync(int invoiceId);
        Task<(bool IsSuccess, string Message)> ProcessPaymentAsync(PaymentRequest request);
        Task<bool> MarkAsRefundedAsync(int invoiceId);
    }

    public class InvoiceService : IInvoiceService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;
        // Bổ sung EmailService để gởi email thông báo lên hạng
        private readonly IEmailService _emailService;

        public InvoiceService(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor, IEmailService emailService)
        {
            _context = context;
            _notificationService = notificationService;
            _httpContextAccessor = httpContextAccessor;
            _emailService = emailService;
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
                query = query.Where(i => i.Status == status);

            var invoices = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();

            return invoices.Select(i => new InvoiceResponse
            {
                Id = i.Id, 
                BookingId = i.BookingId, 
                BookingCode = i.Booking != null ? i.Booking.BookingCode : "N/A",
                GuestName = i.Booking != null ? i.Booking.GuestName : "Khách vãng lai", 
                GuestPhone = i.Booking != null ? i.Booking.GuestPhone : "N/A", 
                TotalRoomAmount = i.TotalRoomAmount ?? 0,
                TotalServiceAmount = i.TotalServiceAmount ?? 0, 
                DiscountAmount = i.DiscountAmount ?? 0,
                TaxAmount = i.TaxAmount ?? 0, 
                FinalTotal = i.FinalTotal ?? 0,
                AmountPaid = i.Payments != null ? i.Payments.Sum(p => p.AmountPaid) : 0, 
                Status = i.Status, 
                BookingStatus = i.Booking != null ? i.Booking.Status : "N/A",
                CreatedAt = i.CreatedAt
            }).ToList();
        }

        public async Task<InvoiceResponse> GetInvoiceByIdAsync(int id)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Payments)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.BookingDetails)
                        .ThenInclude(bd => bd.RoomType)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.BookingDetails)
                        .ThenInclude(bd => bd.Room)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.BookingDetails)
                        .ThenInclude(bd => bd.OrderServices)
                            .ThenInclude(os => os.OrderServiceDetails)
                                .ThenInclude(osd => osd.Service)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.BookingDetails)
                        .ThenInclude(bd => bd.LossAndDamages)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (invoice == null) return null;

            var response = new InvoiceResponse
            {
                Id = invoice.Id,
                BookingId = invoice.BookingId,
                BookingCode = invoice.Booking?.BookingCode,
                GuestName = invoice.Booking?.GuestName,
                GuestPhone = invoice.Booking?.GuestPhone,
                TotalRoomAmount = invoice.TotalRoomAmount ?? 0,
                TotalServiceAmount = invoice.TotalServiceAmount ?? 0,
                DiscountAmount = invoice.DiscountAmount ?? 0,
                TaxAmount = invoice.TaxAmount ?? 0,
                FinalTotal = invoice.FinalTotal ?? 0,
                AmountPaid = invoice.Payments.Sum(p => p.AmountPaid),
                Status = invoice.Status,
                BookingStatus = invoice.Booking?.Status ?? "N/A",
                CreatedAt = invoice.CreatedAt
            };

            if (invoice.Booking != null && invoice.Booking.BookingDetails != null)
            {
                foreach (var detail in invoice.Booking.BookingDetails)
                {
                    int duration = detail.PriceType == "HOURLY"
                        ? (int)Math.Ceiling((detail.CheckOutDate - detail.CheckInDate).TotalHours)
                        : (int)(detail.CheckOutDate.Date - detail.CheckInDate.Date).TotalDays;
                    if (duration <= 0) duration = 1;

                    response.RoomDetails.Add(new InvoiceRoomDetail
                    {
                        RoomTypeName = detail.RoomType?.Name ?? "N/A",
                        RoomNumber = detail.Room?.RoomNumber ?? "Chưa xếp",
                        CheckIn = detail.CheckInDate,
                        CheckOut = detail.CheckOutDate,
                        Price = detail.AppliedPrice,
                        Duration = duration,
                        SubTotal = detail.AppliedPrice * duration
                    });

                    if (detail.OrderServices != null)
                    {
                        foreach (var os in detail.OrderServices.Where(o => o.Status != "Cancelled"))
                        {
                            if (os.OrderServiceDetails != null)
                            {
                                foreach (var item in os.OrderServiceDetails)
                                {
                                    response.Services.Add(new InvoiceServiceDetail
                                    {
                                        ServiceName = item.Service?.Name ?? "Dịch vụ phòng", 
                                        Quantity = item.Quantity,
                                        TotalAmount = item.Quantity * item.UnitPrice,
                                        Date = os.OrderDate ?? DateTime.Now
                                    });
                                }
                            }
                        }
                    }

                    if (detail.LossAndDamages != null)
                    {
                        foreach (var ld in detail.LossAndDamages.Where(l => l.Status != "Cancelled"))
                        {
                            response.Damages.Add(new InvoiceDamageDetail
                            {
                                ItemName = ld.Description ?? "Phạt hư hỏng/Mất mát", 
                                PenaltyAmount = ld.PenaltyAmount
                            });
                        }
                    }
                }
            }
            response.TotalDamageAmount = response.Damages.Sum(d => d.PenaltyAmount);
            return response;
        }

        public async Task<InvoiceResponse> GetInvoiceByBookingCodeAsync(string bookingCode)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Booking)
                .FirstOrDefaultAsync(x => x.Booking != null && x.Booking.BookingCode == bookingCode);
                
            if (invoice == null) return null;

            return await GetInvoiceByIdAsync(invoice.Id);
        }

        public async Task<bool> RecalculateInvoiceAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Booking).ThenInclude(b => b.Voucher)
                .Include(i => i.Booking).ThenInclude(b => b.BookingDetails).ThenInclude(bd => bd.OrderServices)
                .Include(i => i.Booking).ThenInclude(b => b.BookingDetails).ThenInclude(bd => bd.LossAndDamages)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null || invoice.Status == "Paid" || invoice.Status == "Refunded" || invoice.Status == "Cancelled") return false;

            decimal totalRoom = 0;
            decimal totalService = 0;
            decimal totalDamage = 0;

            foreach (var detail in invoice.Booking.BookingDetails)
            {
                int duration = detail.PriceType == "HOURLY" 
                    ? (int)Math.Ceiling((detail.CheckOutDate - detail.CheckInDate).TotalHours)
                    : (int)(detail.CheckOutDate.Date - detail.CheckInDate.Date).TotalDays;
                if (duration <= 0) duration = 1;
                totalRoom += (detail.AppliedPrice * duration);

                totalService += detail.OrderServices.Where(o => o.Status != "Cancelled").Sum(o => o.TotalAmount ?? 0);
                totalDamage += detail.LossAndDamages.Where(l => l.Status != "Cancelled").Sum(l => l.PenaltyAmount);
            }

            decimal totalExtras = totalService + totalDamage;
            decimal voucherDiscount = 0;
            decimal memberDiscount = 0;

            var voucher = invoice.Booking.Voucher;
            if (voucher != null && voucher.IsActive)
            {
                if (voucher.DiscountType == "PERCENT") {
                    voucherDiscount = totalRoom * (voucher.DiscountValue / 100);
                    if (voucher.MaxDiscountAmount.HasValue && voucherDiscount > voucher.MaxDiscountAmount.Value) voucherDiscount = voucher.MaxDiscountAmount.Value;
                } else voucherDiscount = voucher.DiscountValue;
            }

            if (invoice.Booking.UserId.HasValue)
            {
                var user = await _context.Users.FindAsync(invoice.Booking.UserId.Value);
                if (user != null && user.MembershipId.HasValue)
                {
                    var membership = await _context.Memberships.FindAsync(user.MembershipId.Value);
                    if (membership != null)
                    {
                        memberDiscount = totalRoom * ((membership.DiscountPercent ?? 0m) / 100m);
                    }
                }
            }

            decimal discount = voucherDiscount + memberDiscount;
            if (discount > totalRoom) discount = totalRoom;

            decimal subTotal = totalRoom + totalExtras - discount;
            decimal tax = subTotal * 0.10m;
            
            invoice.TotalRoomAmount = totalRoom;
            invoice.TotalServiceAmount = totalExtras;
            invoice.DiscountAmount = discount;
            invoice.TaxAmount = tax;
            invoice.FinalTotal = subTotal + tax;
            invoice.UpdatedAt = DateTime.Now;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool IsSuccess, string Message)> ProcessPaymentAsync(PaymentRequest request)
        {
            var invoice = await _context.Invoices.Include(i => i.Payments).Include(i => i.Booking).FirstOrDefaultAsync(i => i.Id == request.InvoiceId);
            if (invoice == null) return (false, "Không tìm thấy hóa đơn.");
            if (invoice.Status == "Paid") return (false, "Hóa đơn này đã được thanh toán xong.");

            decimal currentPaid = invoice.Payments.Sum(p => p.AmountPaid);
            decimal balanceDue = (invoice.FinalTotal ?? 0) - currentPaid;

            decimal actualAmountToLog = request.AmountPaid;
            decimal changeAmount = 0; 

            if (request.AmountPaid > balanceDue)
            {
                if (request.PaymentMethod == "Cash")
                {
                    actualAmountToLog = balanceDue; 
                    changeAmount = request.AmountPaid - balanceDue; 
                }
                else
                {
                    return (false, $"Chuyển khoản/VNPay không được vượt quá số tiền nợ ({balanceDue:N0}đ).");
                }
            }

            var payment = new Payment
            {
                InvoiceId = request.InvoiceId,
                PaymentMethod = request.PaymentMethod,
                AmountPaid = actualAmountToLog,
                TransactionCode = request.TransactionCode,
                GatewayResponse = request.GatewayResponse, 
                RefundAmount = 0,
                PaymentDate = DateTime.Now,
                CreatedAt = DateTime.Now
            };

            _context.Payments.Add(payment);

            decimal totalPaidAfter = currentPaid + actualAmountToLog;

            if (invoice.Booking != null && invoice.Booking.Status == "Pending" && totalPaidAfter > 0)
            {
                invoice.Booking.Status = "Confirmed";
            }

            if (totalPaidAfter >= invoice.FinalTotal)
            {
                invoice.Status = "Paid"; 
                
                // 🔥 FIX LOGIC 2: TÍCH ĐIỂM VÀ TỰ ĐỘNG THĂNG HẠNG MEMBERSHIP (Kèm gửi Email)
                if (invoice.Booking != null && invoice.Booking.UserId.HasValue)
                {
                    var user = await _context.Users.FindAsync(invoice.Booking.UserId.Value);
                    if (user != null)
                    {
                        // Tính điểm tích lũy: Ví dụ ở đây là 10.000đ = 1 điểm. 
                        int earnedPoints = (int)((invoice.FinalTotal ?? 0) / 10000); 
                        user.TotalPoints += earnedPoints;

                        _context.PointHistories.Add(new PointHistory
                        {
                            UserId = user.Id,
                            InvoiceId = invoice.Id,
                            PointsEarned = earnedPoints,
                            Description = $"Cộng điểm từ giao dịch thanh toán Hóa đơn #{invoice.Id}",
                            CreatedAt = DateTime.Now
                        });
                        
                        // XÉT NÂNG HẠNG TỰ ĐỘNG
                        var appropriateMembership = await _context.Memberships
                            .Where(m => m.MinPoints <= user.TotalPoints)
                            .OrderByDescending(m => m.MinPoints)
                            .FirstOrDefaultAsync();

                        if (appropriateMembership != null && user.MembershipId != appropriateMembership.Id)
                        {
                            user.MembershipId = appropriateMembership.Id;
                            
                            string emailBody = $@"
                                <h3>Chúc mừng {user.FullName},</h3>
                                <p>Nhờ thường xuyên tin dùng dịch vụ, hạng thành viên của bạn tại ABC Hotel đã được thăng lên cấp <b>{appropriateMembership.TierName}</b>.</p>
                                <p>Ở hạng thẻ này, bạn sẽ nhận được mã giảm giá <b>{appropriateMembership.DiscountPercent}%</b> cho tất cả các lần đặt phòng tiếp theo trên hệ thống.</p>
                                <br/><p>Trân trọng cảm ơn bạn,<br/>ABC Hotel</p>";
                                
                            await _emailService.SendEmailAsync(user.Email, "Thăng Hạng Thành Viên Thành Công!", emailBody);
                        }
                    }
                }
            }
            else
            {
                invoice.Status = "Partial"; 
            }

            await _context.SaveChangesAsync();

            string resultMsg = $"Ghi nhận thành công {actualAmountToLog:N0}đ.";
            if (changeAmount > 0) resultMsg += $" Vui lòng thối lại cho khách {changeAmount:N0}đ.";

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_INVOICES", "Thanh toán mới", $"[{userName}] vừa thu {actualAmountToLog:N0}đ cho hóa đơn {invoice.Booking?.BookingCode}.");

            return (true, resultMsg);
        }

        public async Task<bool> MarkAsRefundedAsync(int invoiceId)
        {
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.Id == invoiceId);
            if (invoice == null || invoice.Status != "Refund_Pending") return false;

            invoice.Status = "Refunded";
            invoice.UpdatedAt = DateTime.Now;
            
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
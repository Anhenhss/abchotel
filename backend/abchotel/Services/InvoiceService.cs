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
                query = query.Where(i => i.Status == status);

            // 🔥 Kéo dữ liệu từ SQL lên RAM trước
            var invoices = await query.OrderByDescending(i => i.CreatedAt).ToListAsync();

            // 🔥 Sau đó mới Map sang DTO (Bỏ qua rào cản dịch SQL của EF Core)
            return invoices.Select(i => new InvoiceResponse
            {
                Id = i.Id, 
                BookingId = i.BookingId, 
                BookingCode = i.Booking != null ? i.Booking.BookingCode : "N/A",
                GuestName = i.Booking != null ? i.Booking.GuestName : "Khách vãng lai", 
                TotalRoomAmount = i.TotalRoomAmount ?? 0,
                TotalServiceAmount = i.TotalServiceAmount ?? 0, 
                DiscountAmount = i.DiscountAmount ?? 0,
                TaxAmount = i.TaxAmount ?? 0, 
                FinalTotal = i.FinalTotal ?? 0,
                AmountPaid = i.Payments != null ? i.Payments.Sum(p => p.AmountPaid) : 0, 
                Status = i.Status, 
                CreatedAt = i.CreatedAt
                // Các List chi tiết bên dưới tự động rỗng, không bị lỗi EF Core nữa
            }).ToList();
        }

        public async Task<InvoiceResponse> GetInvoiceByIdAsync(int id)
        {
            // BƯỚC 1: Dùng Include để móc sâu xuống đáy Database
            // Chú ý: Đã sửa lại đường dẫn Include cho đúng với OrderServiceDetails
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
                        // 🔥 ĐÃ VÁ LỖI: Đi qua OrderServices, rồi móc xuống OrderServiceDetails, rồi móc lấy Service (Tên món)
                        .ThenInclude(bd => bd.OrderServices)
                            .ThenInclude(os => os.OrderServiceDetails)
                                .ThenInclude(osd => osd.Service)
                .Include(i => i.Booking)
                    .ThenInclude(b => b.BookingDetails)
                        .ThenInclude(bd => bd.LossAndDamages)
                .FirstOrDefaultAsync(x => x.Id == id);

            if (invoice == null) return null;

            // BƯỚC 2: Nhào nặn dữ liệu ra DTO
            var response = new InvoiceResponse
            {
                Id = invoice.Id,
                BookingId = invoice.BookingId,
                BookingCode = invoice.Booking?.BookingCode,
                GuestName = invoice.Booking?.GuestName,
                TotalRoomAmount = invoice.TotalRoomAmount ?? 0,
                TotalServiceAmount = invoice.TotalServiceAmount ?? 0,
                DiscountAmount = invoice.DiscountAmount ?? 0,
                TaxAmount = invoice.TaxAmount ?? 0,
                FinalTotal = invoice.FinalTotal ?? 0,
                AmountPaid = invoice.Payments.Sum(p => p.AmountPaid),
                Status = invoice.Status,
                CreatedAt = invoice.CreatedAt
            };

            // BƯỚC 3: Rút trích chi tiết từng khoản mục
            if (invoice.Booking != null && invoice.Booking.BookingDetails != null)
            {
                foreach (var detail in invoice.Booking.BookingDetails)
                {
                    // 3.1 Tiền phòng
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

                    // 3.2 Tiền dịch vụ ăn uống / Minibar
                    if (detail.OrderServices != null)
                    {
                        foreach (var os in detail.OrderServices.Where(o => o.Status != "Cancelled"))
                        {
                            // 🔥 ĐÃ VÁ LỖI: Lặp qua từng món trong OrderServiceDetails để lấy Quantity và ServiceName
                            if (os.OrderServiceDetails != null)
                            {
                                foreach (var item in os.OrderServiceDetails)
                                {
                                    response.Services.Add(new InvoiceServiceDetail
                                    {
                                        ServiceName = item.Service?.Name ?? "Dịch vụ phòng", 
                                        Quantity = item.Quantity,
                                        TotalAmount = item.Quantity * item.UnitPrice, // Hoặc lấy trực tiếp os.TotalAmount nếu em muốn
                                        Date = os.OrderDate ?? DateTime.Now
                                    });
                                }
                            }
                        }
                    }

                    // 3.3 Tiền phạt / Hư hỏng
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

        //  HÀM LẤY HÓA ĐƠN THEO MÃ BOOKING
        public async Task<InvoiceResponse> GetInvoiceByBookingCodeAsync(string bookingCode)
        {
            // 1. Tìm ID của Hóa đơn dựa vào mã Booking
            var invoice = await _context.Invoices
                .Include(i => i.Booking)
                .FirstOrDefaultAsync(x => x.Booking != null && x.Booking.BookingCode == bookingCode);
                
            if (invoice == null) return null;

            // 2. 🔥 Tái sử dụng ngay hàm GetInvoiceByIdAsync đã được viết Include rất đầy đủ bên trên!
            return await GetInvoiceByIdAsync(invoice.Id);
        }

        public async Task<bool> RecalculateInvoiceAsync(int invoiceId)
        {
            var invoice = await _context.Invoices
                .Include(i => i.Booking).ThenInclude(b => b.Voucher)
                .Include(i => i.Booking).ThenInclude(b => b.BookingDetails).ThenInclude(bd => bd.OrderServices)
                .Include(i => i.Booking).ThenInclude(b => b.BookingDetails).ThenInclude(bd => bd.LossAndDamages)
                .FirstOrDefaultAsync(i => i.Id == invoiceId);

            if (invoice == null || invoice.Status == "Paid") return false;

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
            decimal discount = 0;
            var voucher = invoice.Booking.Voucher;
            if (voucher != null && voucher.IsActive)
            {
                if (voucher.DiscountType == "PERCENT") {
                    discount = totalRoom * (voucher.DiscountValue / 100);
                    if (voucher.MaxDiscountAmount.HasValue && discount > voucher.MaxDiscountAmount.Value) discount = voucher.MaxDiscountAmount.Value;
                } else discount = voucher.DiscountValue;
                if (discount > totalRoom) discount = totalRoom;
            }

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

        // 🔥 ĐÃ VÁ LỖI THIẾU LOGIC NGHIỆP VỤ Ở ĐÂY
        public async Task<(bool IsSuccess, string Message)> ProcessPaymentAsync(PaymentRequest request)
        {
            var invoice = await _context.Invoices.Include(i => i.Payments).Include(i => i.Booking).FirstOrDefaultAsync(i => i.Id == request.InvoiceId);
            if (invoice == null) return (false, "Không tìm thấy hóa đơn.");
            if (invoice.Status == "Paid") return (false, "Hóa đơn này đã được thanh toán xong.");

            // Tính số tiền khách còn nợ
            decimal currentPaid = invoice.Payments.Sum(p => p.AmountPaid);
            decimal balanceDue = (invoice.FinalTotal ?? 0) - currentPaid;

            decimal actualAmountToLog = request.AmountPaid;
            decimal changeAmount = 0; // Tiền thối lại

            // VÁ LỖI 1: KHÁCH ĐƯA DƯ TIỀN THÌ PHẢI TÍNH TIỀN THỐI LẠI
            if (request.AmountPaid > balanceDue)
            {
                if (request.PaymentMethod == "Cash")
                {
                    actualAmountToLog = balanceDue; // Chỉ ghi nhận vào DB đúng số tiền đang nợ
                    changeAmount = request.AmountPaid - balanceDue; // Báo Lễ tân thối lại
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

            if (totalPaidAfter >= invoice.FinalTotal)
            {
                invoice.Status = "Paid"; 
                
                if (invoice.Booking != null && invoice.Booking.Status == "Pending")
                    invoice.Booking.Status = "Confirmed";

                // VÁ LỖI 2: CỘNG ĐIỂM TÍCH LŨY (Tỷ lệ 1% giá trị hóa đơn)
                if (invoice.Booking != null && invoice.Booking.UserId.HasValue)
                {
                    var user = await _context.Users.FindAsync(invoice.Booking.UserId.Value);
                    if (user != null)
                    {
                        int earnedPoints = (int)((invoice.FinalTotal ?? 0) / 100); 
                        user.TotalPoints += earnedPoints;

                        _context.PointHistories.Add(new PointHistory
                        {
                            UserId = user.Id,
                            InvoiceId = invoice.Id,
                            PointsEarned = earnedPoints,
                            Description = $"Cộng điểm từ giao dịch thanh toán Hóa đơn #{invoice.Id} (Mã: {invoice.Booking.BookingCode})",
                            CreatedAt = DateTime.Now
                        });
                    }
                }
            }
            else
            {
                invoice.Status = "Partial"; 
            }

            await _context.SaveChangesAsync();

            // Soạn câu thông báo trả về cho Lễ tân
            string resultMsg = $"Ghi nhận thành công {actualAmountToLog:N0}đ.";
            if (changeAmount > 0) resultMsg += $" Vui lòng thối lại cho khách {changeAmount:N0}đ.";

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_INVOICES", "Thanh toán mới", $"[{userName}] vừa thu {actualAmountToLog:N0}đ cho hóa đơn {invoice.Booking?.BookingCode}.");

            return (true, resultMsg);
        }
    }
}
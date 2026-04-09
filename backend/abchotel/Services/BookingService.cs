using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IBookingService
    {
        Task<List<AvailableRoomResponse>> SearchRoomsAsync(SearchRoomRequest request);
        Task<(bool IsSuccess, BookingSuccessResponse Data, string Message)> CreateBookingAsync(CreateBookingRequest request, int? currentUserId);
        Task<object> GetBookingByCodeAsync(string bookingCode);
    }

    public class BookingService : IBookingService
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly ILogger<BookingService> _logger;

        public BookingService(HotelDbContext context, INotificationService notificationService, ILogger<BookingService> logger)
        {
            _context = context;
            _notificationService = notificationService;
            _logger = logger;
        }

        // ==========================================================
        // 1. THUẬT TOÁN TÌM PHÒNG (GỌI STORED PROCEDURE SQL)
        // ==========================================================
        public async Task<List<AvailableRoomResponse>> SearchRoomsAsync(SearchRoomRequest request)
        {
            var result = new List<AvailableRoomResponse>();

            // Sử dụng ADO.NET thuần để gọi Stored Procedure và map dữ liệu ra DTO
            using (var command = _context.Database.GetDbConnection().CreateCommand())
            {
                command.CommandText = "sp_SearchAvailableRooms";
                command.CommandType = CommandType.StoredProcedure;

                // Truyền tham số an toàn
                command.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@CheckIn", request.CheckIn));
                command.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@CheckOut", request.CheckOut));
                command.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@Adults", request.Adults));
                command.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@Children", request.Children));
                command.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@RequestedRooms", request.RequestedRooms));
                command.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@PriceType", request.PriceType));
                
                if (request.MinPrice.HasValue) command.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@MinPrice", request.MinPrice.Value));
                if (request.MaxPrice.HasValue) command.Parameters.Add(new Microsoft.Data.SqlClient.SqlParameter("@MaxPrice", request.MaxPrice.Value));

                await _context.Database.OpenConnectionAsync();
                
                using (var reader = await command.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                    {
                        result.Add(new AvailableRoomResponse
                        {
                            RoomTypeId = reader.GetInt32(reader.GetOrdinal("RoomTypeId")),
                            RoomTypeName = reader.GetString(reader.GetOrdinal("RoomTypeName")),
                            PricePerUnit = reader.GetDecimal(reader.GetOrdinal("PricePerUnit")),
                            ImageUrl = reader.IsDBNull(reader.GetOrdinal("ImageUrl")) ? null : reader.GetString(reader.GetOrdinal("ImageUrl")),
                            RemainingRooms = reader.GetInt32(reader.GetOrdinal("RemainingRooms")),
                            SubTotal = reader.GetDecimal(reader.GetOrdinal("SubTotal")),
                            IsUrgent = reader.GetBoolean(reader.GetOrdinal("IsUrgent"))
                        });
                    }
                }
            }

            return result;
        }

        // ==========================================================
        // 2. KHỞI TẠO ĐƠN ĐẶT PHÒNG VÀ KHÓA PHÒNG
        // ==========================================================
        public async Task<(bool IsSuccess, BookingSuccessResponse Data, string Message)> CreateBookingAsync(CreateBookingRequest request, int? currentUserId)
        {
            // 1. Khởi tạo mã Booking ngẫu nhiên (Ví dụ: BK2604091234)
            string bookingCode = "BK" + DateTime.Now.ToString("yyMMddHHmm") + new Random().Next(10, 99).ToString();

            // 2. Validate Voucher (Nếu có nhập)
            Voucher appliedVoucher = null;
            if (!string.IsNullOrEmpty(request.VoucherCode))
            {
                appliedVoucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == request.VoucherCode && v.IsActive);
                if (appliedVoucher == null) return (false, null, "Mã khuyến mãi không hợp lệ hoặc đã hết hạn.");
            }

            // 3. Tạo Header cho bảng Bookings
            var booking = new Booking
            {
                UserId = currentUserId, // Có thể null nếu là khách vãng lai
                GuestName = request.GuestName,
                GuestPhone = request.GuestPhone,
                GuestEmail = request.GuestEmail,
                IdentityNumber = request.IdentityNumber, // 🔥 Giải quyết bài toán CCCD của em!
                BookingCode = bookingCode,
                VoucherId = appliedVoucher?.Id,
                SpecialRequests = request.SpecialRequests,
                Status = "Pending", // Đợi thanh toán trong 15 phút
                CreatedAt = DateTime.Now
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync(); // Lưu để lấy được BookingId

            // 4. Gọi Stored Procedure khóa phòng cho từng món khách đặt
            try
            {
                foreach (var item in request.Rooms)
                {
                    // Dùng ExecuteSqlInterpolatedAsync để chạy SP thứ 2 an toàn
                    await _context.Database.ExecuteSqlInterpolatedAsync($"EXEC sp_BookAndLockRooms {booking.Id}, {item.RoomTypeId}, {item.CheckInDate}, {item.CheckOutDate}, {item.Quantity}, {item.PriceType}");
                }
            }
            catch (Exception ex)
            {
                // SP sẽ ném lỗi RAISERROR nếu phòng vừa bị người khác giật mất
                _logger.LogError($"Lỗi khi khóa phòng: {ex.Message}");
                return (false, null, ex.Message); 
            }

            // 5. TÍNH TIỀN & XUẤT HÓA ĐƠN
            // Sau khi SP chạy xong, bảng Booking_Details đã có dữ liệu. Ta lôi lên để cộng tiền.
            var details = await _context.BookingDetails.Where(bd => bd.BookingId == booking.Id).ToListAsync();
            
            decimal totalRoomAmount = 0;
            foreach(var d in details)
            {
                int duration = d.PriceType == "HOURLY" 
                    ? (int)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalHours)
                    : (int)(d.CheckOutDate.Date - d.CheckInDate.Date).TotalDays;
                
                if (duration <= 0) duration = 1;
                totalRoomAmount += (d.AppliedPrice * duration);
            }

            // Áp dụng khuyến mãi
            decimal discountAmount = 0;
            if (appliedVoucher != null)
            {
                if (appliedVoucher.DiscountType == "PERCENT") {
                    discountAmount = totalRoomAmount * (appliedVoucher.DiscountValue / 100);
                    if (appliedVoucher.MaxDiscountAmount.HasValue && discountAmount > appliedVoucher.MaxDiscountAmount)
                        discountAmount = appliedVoucher.MaxDiscountAmount.Value;
                } 
                else {
                    discountAmount = appliedVoucher.DiscountValue;
                }
                if (discountAmount > totalRoomAmount) discountAmount = totalRoomAmount;
            }

            // Tính Thuế VAT 10%
            decimal taxAmount = (totalRoomAmount - discountAmount) * 0.10m;
            decimal finalTotal = totalRoomAmount - discountAmount + taxAmount;

            // Tạo Hóa đơn (Invoice)
            var invoice = new Invoice
            {
                BookingId = booking.Id,
                TotalRoomAmount = totalRoomAmount,
                TotalServiceAmount = 0,
                DiscountAmount = discountAmount,
                TaxAmount = taxAmount,
                FinalTotal = finalTotal,
                Status = "Unpaid",
                CreatedAt = DateTime.Now
            };
            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            // Bắn thông báo về cho Lễ tân
            await _notificationService.SendToPermissionAsync("MANAGE_BOOKINGS", "Có đơn đặt phòng mới", $"Khách hàng vừa đặt phòng. Mã đơn: {bookingCode}. Đang chờ thanh toán.");

            // Trả về dữ liệu cho Client
            return (true, new BookingSuccessResponse
            {
                BookingId = booking.Id,
                BookingCode = bookingCode,
                TotalAmount = finalTotal,
                ExpireAt = DateTime.Now.AddMinutes(15), // Báo cho UI hiện đồng hồ đếm ngược 15p
                Message = "Giữ chỗ thành công. Vui lòng thanh toán trong 15 phút."
            }, "OK");
        }

        // ==========================================================
        // 3. TRA CỨU MÃ ĐẶT PHÒNG
        // ==========================================================
        public async Task<object> GetBookingByCodeAsync(string bookingCode)
        {
            var booking = await _context.Bookings
                .Include(b => b.Invoices)
                .Include(b => b.BookingDetails).ThenInclude(bd => bd.RoomType)
                .Include(b => b.BookingDetails).ThenInclude(bd => bd.Room)
                .FirstOrDefaultAsync(b => b.BookingCode == bookingCode);

            if (booking == null) return null;

            return new
            {
                booking.Id,
                booking.BookingCode,
                booking.Status,
                booking.GuestName,
                booking.GuestPhone,
                booking.IdentityNumber,
                TotalAmount = booking.Invoices.FirstOrDefault()?.FinalTotal ?? 0,
                InvoiceStatus = booking.Invoices.FirstOrDefault()?.Status,
                Rooms = booking.BookingDetails.Select(bd => new
                {
                    RoomTypeName = bd.RoomType?.Name,
                    RoomNumber = bd.Room?.RoomNumber ?? "Sẽ xếp khi nhận phòng",
                    CheckIn = bd.CheckInDate,
                    CheckOut = bd.CheckOutDate,
                    Price = bd.AppliedPrice
                })
            };
        }
    }
}
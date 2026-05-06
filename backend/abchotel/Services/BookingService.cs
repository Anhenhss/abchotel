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
        Task<List<BookingListResponse>> GetAllBookingsAsync(string status = null);
        Task<bool> UpdateBookingStatusAsync(int id, string status, string reason);
        Task<List<object>> GetAvailableSpecificRoomsAsync(int roomTypeId, DateTime checkIn, DateTime checkOut);
        Task<List<BookingListResponse>> GetMyBookingsAsync(int userId);
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
            // Tính số đêm/giờ
            int duration = request.PriceType == "HOURLY"
                ? (int)Math.Ceiling((request.CheckOut - request.CheckIn).TotalHours)
                : Math.Max(1, (int)(request.CheckOut.Date - request.CheckIn.Date).TotalDays);

            // 1. Tìm ID các phòng vật lý ĐANG BẬN trong khoảng thời gian này
            var bookedRoomIds = await _context.BookingDetails
                .Where(bd => bd.RoomId != null && bd.Booking.Status != "Cancelled" &&
                             !(bd.CheckOutDate <= request.CheckIn || bd.CheckInDate >= request.CheckOut))
                .Select(bd => bd.RoomId)
                .ToListAsync();

            // 2. Truy vấn hạng phòng, KÈM THEO Ảnh và Tiện ích từ Model chuẩn của em
            var roomTypes = await _context.RoomTypes
                .Include(rt => rt.Rooms)
                .Include(rt => rt.RoomImages)
                .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity)
                .Where(rt => rt.IsActive && rt.CapacityAdults >= request.Adults && rt.CapacityChildren >= request.Children)
                .ToListAsync();

            var result = new List<AvailableRoomResponse>();

            foreach (var rt in roomTypes)
            {
                // Đếm số phòng trống thực tế = Tổng phòng - Các phòng đang bận
                int remaining = rt.Rooms.Count(r => r.Status == "Available" && !bookedRoomIds.Contains(r.Id));

                if (remaining >= request.RequestedRooms)
                {
                    decimal pricePerUnit = request.PriceType == "HOURLY" ? rt.PricePerHour : rt.BasePrice;

                    if (request.MinPrice.HasValue && pricePerUnit < request.MinPrice.Value) continue;
                    if (request.MaxPrice.HasValue && pricePerUnit > request.MaxPrice.Value) continue;

                    result.Add(new AvailableRoomResponse
                    {
                        RoomTypeId = rt.Id,
                        RoomTypeName = rt.Name,
                        PricePerUnit = pricePerUnit,
                        BasePricePerNight = rt.BasePrice,
                        BasePricePerHour = rt.PricePerHour,
                        RemainingRooms = remaining,
                        SubTotal = duration * pricePerUnit * request.RequestedRooms,
                        IsUrgent = remaining <= 3,
                        CapacityAdults = rt.CapacityAdults,
                        CapacityChildren = rt.CapacityChildren,
                        SizeSqm = rt.SizeSqm ?? 0,
                        BedType = rt.BedType,
                        ViewDirection = rt.ViewDirection ?? "Thành phố",
                        Description = rt.Description,
                        // Tự động map sang mảng List<string> cực mượt
                        Images = rt.RoomImages.Where(i => i.IsActive).OrderByDescending(i => i.IsPrimary).Select(i => i.ImageUrl).ToList(),
                        Amenities = rt.RoomTypeAmenities.Where(a => a.Amenity.IsActive).Select(a => a.Amenity.Name).ToList()
                    });
                }
            }

            return result.OrderBy(r => r.PricePerUnit).ToList();
        }

        // ==========================================================
        // 2. KHỞI TẠO ĐƠN ĐẶT PHÒNG VÀ KHÓA PHÒNG
        // ==========================================================
        public async Task<(bool IsSuccess, BookingSuccessResponse Data, string Message)> CreateBookingAsync(CreateBookingRequest request, int? currentUserId)
        {
            // 1. Khởi tạo mã Booking ngẫu nhiên (Ví dụ: BK-20260409111213)
            string bookingCode = "BK-" + DateTime.Now.ToString("yyyyMMddHHmmss");

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
                UserId = currentUserId,
                GuestName = request.GuestName,
                GuestPhone = request.GuestPhone,
                GuestEmail = request.GuestEmail,
                IdentityNumber = request.IdentityNumber,
                BookingCode = bookingCode,
                VoucherId = appliedVoucher?.Id,
                SpecialRequests = request.SpecialRequests,
                // Mặc định là Pending, tí nữa xuống dưới nếu là khách vãng lai sẽ tự đổi thành Checked_in
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync(); // Lưu để lấy được BookingId

            // =======================================================
            // 4. LUỒNG XỬ LÝ PHÒNG (WEB BOOKING vs WALK-IN BOOKING)
            // =======================================================
            try
            {
                bool isWalkIn = false;

                foreach (var item in request.Rooms)
                {
                    // NẾU CÓ ROOM ID -> ĐÂY LÀ KHÁCH VÃNG LAI (LỄ TÂN TỰ CHỌN PHÒNG)
                    if (item.RoomId.HasValue && item.RoomId.Value > 0)
                    {
                        isWalkIn = true;

                        // 4.1. Lấy giá phòng hiện tại
                        decimal currentPrice = 0;
                        var roomType = await _context.RoomTypes.FindAsync(item.RoomTypeId);
                        if (roomType != null)
                        {
                            currentPrice = item.PriceType == "HOURLY" ? roomType.PricePerHour : roomType.BasePrice;
                        }

                        // 4.2. Khóa bảo vệ: Kiểm tra xem phòng có bị ai chiếm mất trong tích tắc không?
                        bool isRoomBusy = await _context.BookingDetails.AnyAsync(bd =>
                            bd.RoomId == item.RoomId &&
                            bd.Booking.Status != "Cancelled" &&
                            !(bd.CheckOutDate <= item.CheckInDate || bd.CheckInDate >= item.CheckOutDate)
                        );

                        if (isRoomBusy)
                        {
                            // Nếu phòng bị chiếm, Hủy luôn cái đơn vừa tạo và báo lỗi
                            _context.Bookings.Remove(booking);
                            await _context.SaveChangesAsync();
                            return (false, null, $"Phòng số này vừa bị người khác đặt mất. Vui lòng chọn phòng khác.");
                        }

                        // 4.3. Lưu trực tiếp phòng vào Database
                        var detail = new BookingDetail
                        {
                            BookingId = booking.Id,
                            RoomTypeId = item.RoomTypeId,
                            RoomId = item.RoomId.Value, // Lưu phòng vật lý
                            CheckInDate = item.CheckInDate,
                            CheckOutDate = item.CheckOutDate,
                            AppliedPrice = currentPrice,
                            PriceType = item.PriceType
                        };
                        _context.BookingDetails.Add(detail);

                        // 🔥 VÁ LỖI TẠI ĐÂY: Đưa đoạn khóa phòng vật lý vào bên trong vòng lặp
                        var physicalRoom = await _context.Rooms.FindAsync(item.RoomId.Value);
                        if (physicalRoom != null)
                        {
                            physicalRoom.Status = "Occupied";
                        }
                    }
                    else
                    {
                        // NẾU KHÔNG CÓ ROOM ID -> ĐÂY LÀ KHÁCH ĐẶT TRÊN WEB -> DÙNG SQL CŨ ĐỂ MÁY TỰ BỐC PHÒNG
                        await _context.Database.ExecuteSqlInterpolatedAsync($"EXEC sp_BookAndLockRooms {booking.Id}, {item.RoomTypeId}, {item.CheckInDate}, {item.CheckOutDate}, {item.Quantity}, {item.PriceType}");
                    }
                }

                // Nếu là khách vãng lai, chuyển trạng thái đơn tổng thành Checked_in (Đã nhận phòng)
                if (isWalkIn)
                {
                    booking.Status = "Checked_in";
                    booking.ActualCheckIn = DateTime.Now;
                }

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError($"Lỗi khi khóa phòng: {ex.Message}");
                return (false, null, ex.Message);
            }

            // ==========================================================
            // 5. TÍNH TIỀN & XUẤT HÓA ĐƠN
            // ==========================================================
            // Sau khi SP chạy xong, bảng Booking_Details đã có dữ liệu. Ta lôi lên để cộng tiền.
            var details = await _context.BookingDetails.Where(bd => bd.BookingId == booking.Id).ToListAsync();

            decimal totalRoomAmount = 0;
            foreach (var d in details)
            {
                int duration = d.PriceType == "HOURLY"
                    ? (int)Math.Ceiling((d.CheckOutDate - d.CheckInDate).TotalHours)
                    : (int)(d.CheckOutDate.Date - d.CheckInDate.Date).TotalDays;

                if (duration <= 0) duration = 1;
                totalRoomAmount += (d.AppliedPrice * duration);
            }

            // =======================================================
            // 🔥 ĐÃ THÊM LOGIC ĐỂ LƯU DỊCH VỤ VÀO DATABASE VÀ TÍNH TIỀN
            // =======================================================
            decimal totalServiceAmount = 0;
            if (request.Services != null && request.Services.Any())
            {
                var firstDetail = details.FirstOrDefault(); // Gắn dịch vụ vào chi tiết phòng đầu tiên
                if (firstDetail != null)
                {
                    var orderService = new OrderService {
                        BookingDetailId = firstDetail.Id,
                        OrderDate = DateTime.Now,
                        Status = "Confirmed",
                        TotalAmount = 0
                    };
                    _context.OrderServices.Add(orderService);
                    await _context.SaveChangesAsync();

                    foreach (var srv in request.Services)
                    {
                        var serviceInfo = await _context.Services.FindAsync(srv.ServiceId);
                        if (serviceInfo != null)
                        {
                            var osDetail = new OrderServiceDetail {
                                OrderServiceId = orderService.Id,
                                ServiceId = serviceInfo.Id,
                                Quantity = srv.Quantity,
                                UnitPrice = serviceInfo.Price
                            };
                            _context.OrderServiceDetails.Add(osDetail);
                            totalServiceAmount += (serviceInfo.Price * srv.Quantity);
                        }
                    }
                    orderService.TotalAmount = totalServiceAmount;
                    await _context.SaveChangesAsync();
                }
            }

            // Áp dụng khuyến mãi
            decimal discountAmount = 0;
            if (appliedVoucher != null)
            {
                if (appliedVoucher.DiscountType == "PERCENT")
                {
                    discountAmount = totalRoomAmount * (appliedVoucher.DiscountValue / 100);
                    if (appliedVoucher.MaxDiscountAmount.HasValue && discountAmount > appliedVoucher.MaxDiscountAmount)
                        discountAmount = appliedVoucher.MaxDiscountAmount.Value;
                }
                else
                {
                    discountAmount = appliedVoucher.DiscountValue;
                }
                if (discountAmount > totalRoomAmount) discountAmount = totalRoomAmount;
            }

            // Tính Thuế VAT 10%
            decimal taxAmount = (totalRoomAmount + totalServiceAmount - discountAmount) * 0.10m;
            decimal finalTotal = totalRoomAmount + totalServiceAmount - discountAmount + taxAmount;

            // Tạo Hóa đơn (Invoice)
            var invoice = new Invoice
            {
                BookingId = booking.Id,
                TotalRoomAmount = totalRoomAmount,
                TotalServiceAmount = totalServiceAmount, // 🔥 ĐÃ CẬP NHẬT TẠI ĐÂY
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
        // ==========================================================
        // 4. LẤY DANH SÁCH CHO LỄ TÂN (CÓ LỌC TRẠNG THÁI)
        // ==========================================================
        public async Task<List<BookingListResponse>> GetAllBookingsAsync(string status = null)
        {
            var query = _context.Bookings.Include(b => b.BookingDetails).AsQueryable();

            // Nếu có truyền status (Pending, Confirmed...) thì lọc, không thì lấy hết
            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(b => b.Status == status);
            }

            return await query.OrderByDescending(b => b.CreatedAt).Select(b => new BookingListResponse
            {
                Id = b.Id,
                BookingCode = b.BookingCode,
                GuestName = b.GuestName,
                GuestPhone = b.GuestPhone,
                Status = b.Status,
                ActualCheckIn = b.ActualCheckIn,
                ActualCheckOut = b.ActualCheckOut,
                CreatedAt = b.CreatedAt,
                ExpectedCheckIn = b.BookingDetails.OrderBy(d => d.CheckInDate).Select(d => d.CheckInDate).FirstOrDefault(),
                ExpectedCheckOut = b.BookingDetails.OrderByDescending(d => d.CheckOutDate).Select(d => d.CheckOutDate).FirstOrDefault()
            }).ToListAsync();
        }

        // ==========================================================
        // 5. LỄ TÂN CẬP NHẬT TRẠNG THÁI / HỦY ĐƠN NO-SHOW
        // ==========================================================
        public async Task<bool> UpdateBookingStatusAsync(int id, string status, string reason)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null) return false;

            booking.Status = status;

            // Lưu lại lý do hủy nếu có
            if (!string.IsNullOrEmpty(reason))
            {
                booking.CancellationReason = reason;
            }

            booking.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            // Nếu muốn, có thể gọi _notificationService ở đây để báo cho Quản lý biết có đơn vừa bị hủy

            return true;
        }
        // ==========================================================
        // 6. Lấy danh sách phòng trống
        // ==========================================================
        public async Task<List<object>> GetAvailableSpecificRoomsAsync(int roomTypeId, DateTime checkIn, DateTime checkOut)
        {
            // 1. Tìm tất cả các phòng đã bị đặt trong khoảng thời gian này
            var bookedRoomIds = await _context.BookingDetails
               .Where(bd => bd.RoomId != null && bd.Booking.Status != "Cancelled" &&
                            !(bd.CheckOutDate <= checkIn || bd.CheckInDate >= checkOut))
               .Select(bd => bd.RoomId)
               .ToListAsync();

            // 2. Lọc ra các phòng trống (Thuộc hạng phòng đó, trạng thái Available, và chưa bị đặt)
            var availableRooms = await _context.Rooms
               .Where(r => r.RoomTypeId == roomTypeId && r.Status == "Available" && !bookedRoomIds.Contains(r.Id))
               .Select(r => new { RoomId = r.Id, RoomNumber = r.RoomNumber })
               .ToListAsync();

            return availableRooms.Cast<object>().ToList();
        }
        // ==========================================================
        // 7. Lịch sử đặt phòng
        // ==========================================================
        public async Task<List<BookingListResponse>> GetMyBookingsAsync(int userId)
        {
            var bookings = await _context.Bookings
                .Where(b => b.UserId == userId)
                .OrderByDescending(b => b.CreatedAt)
                .Select(b => new BookingListResponse
                {
                    Id = b.Id,
                    BookingCode = b.BookingCode,
                    GuestName = b.GuestName,
                    GuestPhone = b.GuestPhone,
                    Status = b.Status,
                    ActualCheckIn = b.ActualCheckIn,
                    ActualCheckOut = b.ActualCheckOut,
                    CreatedAt = b.CreatedAt,
                    // Lấy CheckIn sớm nhất và CheckOut trễ nhất từ danh sách chi tiết phòng
                    ExpectedCheckIn = b.BookingDetails.Any() ? b.BookingDetails.Min(d => d.CheckInDate) : (DateTime?)null,
                    ExpectedCheckOut = b.BookingDetails.Any() ? b.BookingDetails.Max(d => d.CheckOutDate) : (DateTime?)null
                })
                .ToListAsync();

            return bookings;
        }
    }
}
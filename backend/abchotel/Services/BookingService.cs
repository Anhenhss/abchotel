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
        // 1. THUẬT TOÁN TÌM PHÒNG
        // ==========================================================
        public async Task<List<AvailableRoomResponse>> SearchRoomsAsync(SearchRoomRequest request)
        {
            int duration = request.PriceType == "HOURLY"
                ? (int)Math.Ceiling((request.CheckOut - request.CheckIn).TotalHours)
                : Math.Max(1, (int)(request.CheckOut.Date - request.CheckIn.Date).TotalDays);

            var bookedRoomIds = await _context.BookingDetails
                .Where(bd => bd.RoomId != null && bd.Booking.Status != "Cancelled" &&
                             !(bd.CheckOutDate <= request.CheckIn || bd.CheckInDate >= request.CheckOut))
                .Select(bd => bd.RoomId)
                .ToListAsync();

            var roomTypes = await _context.RoomTypes
                .Include(rt => rt.Rooms)
                .Include(rt => rt.RoomImages)
                .Include(rt => rt.RoomTypeAmenities).ThenInclude(rta => rta.Amenity)
                .Where(rt => rt.IsActive && rt.CapacityAdults >= request.Adults && rt.CapacityChildren >= request.Children)
                .ToListAsync();

            var result = new List<AvailableRoomResponse>();

            foreach (var rt in roomTypes)
            {
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
            string bookingCode = "BK-" + DateTime.Now.ToString("yyyyMMddHHmmss");

            Voucher appliedVoucher = null;
            if (!string.IsNullOrEmpty(request.VoucherCode))
            {
                appliedVoucher = await _context.Vouchers.FirstOrDefaultAsync(v => v.Code == request.VoucherCode && v.IsActive);
                if (appliedVoucher == null) return (false, null, "Mã khuyến mãi không hợp lệ hoặc đã hết hạn.");
            }

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
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync(); 

            try
            {
                bool isWalkIn = false;

                foreach (var item in request.Rooms)
                {
                    if (item.RoomId.HasValue && item.RoomId.Value > 0)
                    {
                        isWalkIn = true;

                        decimal currentPrice = 0;
                        var roomType = await _context.RoomTypes.FindAsync(item.RoomTypeId);
                        if (roomType != null)
                        {
                            currentPrice = item.PriceType == "HOURLY" ? roomType.PricePerHour : roomType.BasePrice;
                        }

                        bool isRoomBusy = await _context.BookingDetails.AnyAsync(bd =>
                            bd.RoomId == item.RoomId &&
                            bd.Booking.Status != "Cancelled" &&
                            !(bd.CheckOutDate <= item.CheckInDate || bd.CheckInDate >= item.CheckOutDate)
                        );

                        if (isRoomBusy)
                        {
                            _context.Bookings.Remove(booking);
                            await _context.SaveChangesAsync();
                            return (false, null, $"Phòng số này vừa bị người khác đặt mất. Vui lòng chọn phòng khác.");
                        }

                        var detail = new BookingDetail
                        {
                            BookingId = booking.Id,
                            RoomTypeId = item.RoomTypeId,
                            RoomId = item.RoomId.Value, 
                            CheckInDate = item.CheckInDate,
                            CheckOutDate = item.CheckOutDate,
                            AppliedPrice = currentPrice,
                            PriceType = item.PriceType
                        };
                        _context.BookingDetails.Add(detail);

                        var physicalRoom = await _context.Rooms.FindAsync(item.RoomId.Value);
                        if (physicalRoom != null)
                        {
                            physicalRoom.Status = "Occupied";
                        }
                    }
                    else
                    {
                        await _context.Database.ExecuteSqlInterpolatedAsync($"EXEC sp_BookAndLockRooms {booking.Id}, {item.RoomTypeId}, {item.CheckInDate}, {item.CheckOutDate}, {item.Quantity}, {item.PriceType}");
                    }
                }

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

            // =======================================================
            // 5. TÍNH TIỀN PHÒNG & XỬ LÝ DỊCH VỤ MUA TRƯỚC
            // =======================================================
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

            // 🔥 FIX MỚI NHẤT: Thêm logic tạo Dịch vụ gán vào phòng đại diện
            decimal totalServiceAmount = 0;
            if (request.Services != null && request.Services.Any() && details.Any())
            {
                var primaryDetail = details.First(); // Lấy phòng đầu tiên làm đại diện
                var order = new OrderService
                {
                    BookingDetailId = primaryDetail.Id,
                    OrderDate = DateTime.Now,
                    Status = "Pending",
                    Notes = "Khách đặt kèm lúc book phòng Online",
                    CreatedAt = DateTime.Now
                };

                foreach (var srvReq in request.Services)
                {
                    var serviceInfo = await _context.Services.FindAsync(srvReq.ServiceId);
                    if (serviceInfo != null && serviceInfo.IsActive)
                    {
                        order.OrderServiceDetails.Add(new OrderServiceDetail
                        {
                            ServiceId = srvReq.ServiceId,
                            Quantity = srvReq.Quantity,
                            UnitPrice = serviceInfo.Price
                        });
                        totalServiceAmount += (srvReq.Quantity * serviceInfo.Price);
                    }
                }

                if (order.OrderServiceDetails.Any())
                {
                    order.TotalAmount = totalServiceAmount;
                    _context.OrderServices.Add(order);
                    await _context.SaveChangesAsync();
                }
            }

            // Tính Voucher dựa trên tiền phòng
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

            // 🔥 Tính Thuế VAT (Bao gồm cả tiền phòng + tiền dịch vụ - Voucher)
            decimal subTotal = totalRoomAmount + totalServiceAmount - discountAmount;
            decimal taxAmount = subTotal * 0.10m;
            decimal finalTotal = subTotal + taxAmount;

            var invoice = new Invoice
            {
                BookingId = booking.Id,
                TotalRoomAmount = totalRoomAmount,
                TotalServiceAmount = totalServiceAmount, // Ghi nhận tiền dịch vụ
                DiscountAmount = discountAmount,
                TaxAmount = taxAmount,
                FinalTotal = finalTotal,
                Status = "Unpaid",
                CreatedAt = DateTime.Now
            };
            _context.Invoices.Add(invoice);
            await _context.SaveChangesAsync();

            await _notificationService.SendToPermissionAsync("MANAGE_BOOKINGS", "Có đơn đặt phòng mới", $"Khách hàng vừa đặt phòng. Mã đơn: {bookingCode}. Đang chờ thanh toán.");

            return (true, new BookingSuccessResponse
            {
                BookingId = booking.Id,
                BookingCode = bookingCode,
                TotalAmount = finalTotal,
                ExpireAt = DateTime.Now.AddMinutes(15), 
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
        // CÁC HÀM CÒN LẠI GIỮ NGUYÊN HOÀN TOÀN
        // ==========================================================
        public async Task<List<BookingListResponse>> GetAllBookingsAsync(string status = null)
        {
            var query = _context.Bookings.Include(b => b.BookingDetails).AsQueryable();
            if (!string.IsNullOrEmpty(status)) query = query.Where(b => b.Status == status);

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

        // Nằm ở file BookingService.cs
        public async Task<bool> UpdateBookingStatusAsync(int id, string status, string reason)
        {
            // BẮT BUỘC Include BookingDetails để biết khách ở phòng nào
            var booking = await _context.Bookings
                .Include(b => b.BookingDetails)
                .FirstOrDefaultAsync(b => b.Id == id);
            
            if (booking == null) return false;

            booking.Status = status;
            booking.CancellationReason = reason;

            // 1. NẾU KHÁCH NHẬN PHÒNG (CHECK-IN) -> TỰ ĐỘNG ĐỔI SƠ ĐỒ THÀNH CÓ KHÁCH
            if (status == "Checked_in")
            {
                booking.ActualCheckIn = DateTime.Now;
                foreach (var detail in booking.BookingDetails)
                {
                    if (detail.RoomId.HasValue)
                    {
                        var physicalRoom = await _context.Rooms.FindAsync(detail.RoomId.Value);
                        if (physicalRoom != null && physicalRoom.Status != "Maintenance")
                        {
                            physicalRoom.Status = "Occupied"; // Khóa sơ đồ phòng
                        }
                    }
                }
            }
            // 2. NẾU KHÁCH TRẢ PHÒNG (CHECK-OUT) -> TỰ ĐỘNG XẢ PHÒNG, BÁO DƠ
            else if (status == "Completed")
            {
                booking.ActualCheckOut = DateTime.Now;
                foreach (var detail in booking.BookingDetails)
                {
                    if (detail.RoomId.HasValue)
                    {
                        var physicalRoom = await _context.Rooms.FindAsync(detail.RoomId.Value);
                        if (physicalRoom != null)
                        {
                            physicalRoom.Status = "Available"; // Trả lại phòng trống
                            physicalRoom.CleaningStatus = "Dirty"; // Báo Buồng phòng đi dọn
                        }
                    }
                }
            }
            // 3. NẾU HỦY ĐƠN (CANCELLED)
            else if (status == "Cancelled")
            {
                var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.BookingId == id);
                if (invoice != null && invoice.Status == "Unpaid")
                {
                    invoice.Status = "Cancelled";
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<List<object>> GetAvailableSpecificRoomsAsync(int roomTypeId, DateTime checkIn, DateTime checkOut)
        {
            var bookedRoomIds = await _context.BookingDetails
               .Where(bd => bd.RoomId != null && bd.Booking.Status != "Cancelled" &&
                            !(bd.CheckOutDate <= checkIn || bd.CheckInDate >= checkOut))
               .Select(bd => bd.RoomId)
               .ToListAsync();

            var availableRooms = await _context.Rooms
               .Where(r => r.RoomTypeId == roomTypeId && r.Status == "Available" && !bookedRoomIds.Contains(r.Id))
               .Select(r => new { RoomId = r.Id, RoomNumber = r.RoomNumber })
               .ToListAsync();

            return availableRooms.Cast<object>().ToList();
        }

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
                    ExpectedCheckIn = b.BookingDetails.Any() ? b.BookingDetails.Min(d => d.CheckInDate) : (DateTime?)null,
                    ExpectedCheckOut = b.BookingDetails.Any() ? b.BookingDetails.Max(d => d.CheckOutDate) : (DateTime?)null
                })
                .ToListAsync();
            return bookings;
        }
    }
}
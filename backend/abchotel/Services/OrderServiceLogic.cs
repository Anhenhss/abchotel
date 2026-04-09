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
    public interface IOrderServiceLogic
    {
        Task<List<OrderServiceResponse>> GetOrdersByBookingDetailAsync(int bookingDetailId);
        Task<(bool IsSuccess, string Message)> CreateOrderAsync(CreateOrderServiceRequest request);
        Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus);
    }

    public class OrderServiceLogic : IOrderServiceLogic
    {
        private readonly HotelDbContext _context;
        private readonly INotificationService _notificationService;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public OrderServiceLogic(HotelDbContext context, INotificationService notificationService, IHttpContextAccessor httpContextAccessor)
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
            return "Hệ thống";
        }

        public async Task<List<OrderServiceResponse>> GetOrdersByBookingDetailAsync(int bookingDetailId)
        {
            return await _context.OrderServices
                .Include(o => o.OrderServiceDetails).ThenInclude(od => od.Service)
                .Include(o => o.BookingDetail).ThenInclude(bd => bd.Room)
                .Where(o => o.BookingDetailId == bookingDetailId)
                .OrderByDescending(o => o.OrderDate)
                .Select(o => new OrderServiceResponse
                {
                    Id = o.Id,
                    BookingDetailId = o.BookingDetailId,
                    RoomNumber = o.BookingDetail.Room != null ? o.BookingDetail.Room.RoomNumber : "Chưa xếp phòng",
                    OrderDate = o.OrderDate,
                    DeliveryTime = o.DeliveryTime,
                    TotalAmount = o.TotalAmount ?? 0,
                    Status = o.Status,
                    Notes = o.Notes,
                    Items = o.OrderServiceDetails.Select(od => new OrderDetailResponse
                    {
                        ServiceId = od.ServiceId ?? 0,
                        ServiceName = od.Service.Name,
                        Quantity = od.Quantity,
                        UnitPrice = od.UnitPrice
                    }).ToList()
                }).ToListAsync();
        }

        public async Task<(bool IsSuccess, string Message)> CreateOrderAsync(CreateOrderServiceRequest request)
        {
            var bookingDetail = await _context.BookingDetails.FindAsync(request.BookingDetailId);
            if (bookingDetail == null) return (false, "Không tìm thấy thông tin đặt phòng.");

            // Khởi tạo Order
            var order = new OrderService
            {
                BookingDetailId = request.BookingDetailId,
                OrderDate = DateTime.Now,
                DeliveryTime = request.DeliveryTime,
                Notes = request.Notes,
                Status = "Pending",
                CreatedAt = DateTime.Now
            };

            decimal totalAmount = 0;

            // Xử lý từng món dịch vụ khách gọi
            foreach (var item in request.Items)
            {
                var service = await _context.Services.FindAsync(item.ServiceId);
                if (service == null || !service.IsActive) continue; // Bỏ qua nếu dịch vụ bị khóa

                var orderDetail = new OrderServiceDetail
                {
                    ServiceId = item.ServiceId,
                    Quantity = item.Quantity,
                    UnitPrice = service.Price // Chốt giá tại thời điểm order
                };

                order.OrderServiceDetails.Add(orderDetail);
                totalAmount += (item.Quantity * service.Price);
            }

            if (!order.OrderServiceDetails.Any()) return (false, "Không có dịch vụ nào hợp lệ để đặt.");

            order.TotalAmount = totalAmount;
            _context.OrderServices.Add(order);
            await _context.SaveChangesAsync();

            // Cập nhật lại tổng tiền dịch vụ bên bảng Invoices (nếu hóa đơn đã được tạo)
            var invoice = await _context.Invoices.FirstOrDefaultAsync(i => i.BookingId == bookingDetail.BookingId);
            if (invoice != null)
            {
                invoice.TotalServiceAmount = (invoice.TotalServiceAmount ?? 0) + totalAmount;
                invoice.FinalTotal = (invoice.TotalRoomAmount ?? 0) + invoice.TotalServiceAmount - (invoice.DiscountAmount ?? 0) + (invoice.TaxAmount ?? 0);
                await _context.SaveChangesAsync();
            }

            // Bắn thông báo Realtime cho bộ phận liên quan
            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_SERVICES", "Order Dịch vụ mới", $"[{userName}] vừa tạo một yêu cầu dịch vụ trị giá {totalAmount:N0}đ.");

            return (true, "Tạo yêu cầu dịch vụ thành công.");
        }

        public async Task<bool> UpdateOrderStatusAsync(int orderId, string newStatus)
        {
            var order = await _context.OrderServices.FindAsync(orderId);
            if (order == null) return false;

            order.Status = newStatus;
            order.UpdatedAt = DateTime.Now;
            await _context.SaveChangesAsync();

            string userName = await GetCurrentUserNameAsync();
            await _notificationService.SendToPermissionAsync("MANAGE_SERVICES", "Cập nhật Order", $"[{userName}] đã đổi trạng thái order #{orderId} thành: {newStatus}.");

            return true;
        }
    }
}
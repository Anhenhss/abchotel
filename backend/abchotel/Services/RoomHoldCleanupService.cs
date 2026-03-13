using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using abchotel.Data; 

namespace abchotel.Services
{
    // Kế thừa BackgroundService để file này chạy ngầm độc lập với các API
    public class RoomHoldCleanupService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<RoomHoldCleanupService> _logger;

        public RoomHoldCleanupService(IServiceProvider serviceProvider, ILogger<RoomHoldCleanupService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Khởi động hệ thống Dọn dẹp phòng Hold (15 phút)...");

            // Vòng lặp vô hạn: Chạy liên tục cho đến khi tắt server
            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    // Vì BackgroundService sống mãi mãi, ta phải tạo một "Scope" mới để gọi Database an toàn
                    using (var scope = _serviceProvider.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<HotelDbContext>();

                        // Tính mốc thời gian quá hạn (Hiện tại trừ đi 15 phút)
                        var expiredTime = DateTime.Now.AddMinutes(-15);

                        // Tìm các Booking đang 'Pending' và thời gian tạo đã cũ hơn 15 phút
                        var expiredBookings = await dbContext.Bookings
                            .Where(b => b.Status == "Pending" && b.Created_at <= expiredTime)
                            .ToListAsync(stoppingToken);

                        if (expiredBookings.Any())
                        {
                            foreach (var booking in expiredBookings)
                            {
                                // Đổi trạng thái thành Cancelled
                                booking.Status = "Cancelled";
                                _logger.LogInformation($"[Giải phóng phòng] Đã tự động hủy Booking ID {booking.Id} do khách không thanh toán trong 15 phút.");
                            }

                            // Lưu thay đổi xuống Database. 
                            // Ngay khi status chuyển thành Cancelled, Stored Procedure tìm phòng sẽ tự động lấy lại được phòng này!
                            await dbContext.SaveChangesAsync(stoppingToken);
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Có lỗi xảy ra khi chạy dọn dẹp phòng Hold.");
                }

                // Nghỉ 1 phút rồi mới quét lại Database (Tránh làm quá tải máy chủ)
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }
        }
    }
}
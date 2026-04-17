using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.Models;

namespace abchotel.Services
{
    public class BirthdayVoucherWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<BirthdayVoucherWorker> _logger;

        public BirthdayVoucherWorker(IServiceProvider serviceProvider, ILogger<BirthdayVoucherWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Job tự động phát mã Voucher Sinh nhật đã khởi chạy.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<HotelDbContext>();

                    int currentMonth = DateTime.Now.Month;
                    int currentDay = DateTime.Now.Day;
                    int currentYear = DateTime.Now.Year;

                    // 1. Tìm các khách hàng có ngày sinh nhật là hôm nay và tài khoản đang hoạt động
                    var birthdayUsers = await db.Users
                        .Where(u => u.IsActive && u.DateOfBirth.HasValue 
                                    && u.DateOfBirth.Value.Month == currentMonth 
                                    && u.DateOfBirth.Value.Day == currentDay)
                        .ToListAsync(stoppingToken);

                    if (birthdayUsers.Any())
                    {
                        foreach (var user in birthdayUsers)
                        {
                            // 2. Rào chắn: Kiểm tra xem năm nay đã tặng mã cho người này chưa (tránh 1 ngày chạy nhiều lần tặng nhiều mã)
                            string expectedPrefix = $"HPBD{currentYear}-{user.Id}";
                            bool alreadyGiven = await db.Vouchers.AnyAsync(v => v.Code.StartsWith(expectedPrefix), stoppingToken);

                            if (!alreadyGiven)
                            {
                                // 3. Khởi tạo mã Voucher Độc Quyền (Giảm 20% cho toàn bộ đơn)
                                string uniqueCode = $"{expectedPrefix}-{Guid.NewGuid().ToString("N").Substring(0, 4).ToUpper()}";

                                var birthdayVoucher = new Voucher
                                {
                                    Code = uniqueCode,
                                    DiscountType = "PERCENT",
                                    DiscountValue = 20, // Giảm 20%
                                    MinBookingValue = 0,
                                    MaxDiscountAmount = 500000, // Tối đa 500k
                                    ValidFrom = DateTime.Now.Date,
                                    ValidTo = DateTime.Now.Date.AddDays(7), // Hạn dùng 7 ngày
                                    UsageLimit = 1, // Chỉ được xài 1 lần duy nhất
                                    MaxUsesPerUser = 1,
                                    IsForNewCustomer = false,
                                    IsActive = true,
                                    CreatedAt = DateTime.Now
                                };

                                db.Vouchers.Add(birthdayVoucher);

                                // 4. Gắn thông báo gửi thẳng cho Khách hàng
                                var notification = new Notification
                                {
                                    UserId = user.Id,
                                    Title = "🎉 Chúc mừng sinh nhật!",
                                    Content = $"ABC Luxury Hotel thân tặng bạn mã giảm giá 20% (Tối đa 500k) cho lần đặt phòng tiếp theo. Mã của bạn là: {uniqueCode}. Hạn sử dụng 7 ngày. Chúc bạn một ngày sinh nhật thật tuyệt vời!",
                                    Type = "PROMOTION",
                                    IsRead = false,
                                    CreatedAt = DateTime.Now
                                };
                                db.Notifications.Add(notification);

                                _logger.LogInformation($"[Birthday] Đã tự động phát mã {uniqueCode} cho khách hàng {user.FullName} (ID: {user.Id}).");
                            }
                        }

                        // Lưu toàn bộ Voucher và Thông báo xuống DB cùng 1 lúc
                        await db.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi chạy Job phát mã Voucher Sinh nhật.");
                }

                // Tính toán thời gian ngủ cho đến đúng 1:00 SÁNG ngày hôm sau
                DateTime now = DateTime.Now;
                DateTime nextRunTime = now.Date.AddDays(1).AddHours(1); // 1h sáng ngày mai
                TimeSpan delaySpan = nextRunTime - now;

                _logger.LogInformation($"Job Sinh nhật đã quét xong. Ngủ đông chờ đến đợt quét tiếp theo lúc {nextRunTime:dd/MM/yyyy HH:mm:ss}");

                await Task.Delay(delaySpan, stoppingToken);
            }
        }
    }
}
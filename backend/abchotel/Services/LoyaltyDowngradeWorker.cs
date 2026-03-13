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
    public class LoyaltyDowngradeWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<LoyaltyDowngradeWorker> _logger;

        public LoyaltyDowngradeWorker(IServiceProvider serviceProvider, ILogger<LoyaltyDowngradeWorker> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Job quét hạ hạng thành viên (12 tháng) đã khởi chạy.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var db = scope.ServiceProvider.GetRequiredService<HotelDbContext>();

                    // Mốc thời gian 12 tháng trước
                    var expirationDate = DateTime.Now.AddMonths(-12);

                    // Tìm các user có LastActivityDate cũ hơn 12 tháng VÀ tổng điểm > 0
                    var inactiveUsers = await db.Users
                        .Where(u => u.LastActivityDate < expirationDate && u.TotalPoints > 0)
                        .ToListAsync(stoppingToken);

                    // Lấy ID hạng bét nhất (Bronze - 0 điểm)
                    var lowestTier = await db.Memberships.OrderBy(m => m.MinPoints).FirstOrDefaultAsync(stoppingToken);

                    foreach (var user in inactiveUsers)
                    {
                        int pointsLost = user.TotalPoints;
                        
                        // Xóa sạch điểm và hạ về hạng thấp nhất
                        user.TotalPoints = 0;
                        if (lowestTier != null) user.MembershipId = lowestTier.Id;
                        
                        // Reset lại ngày để không bị quét liên tục
                        user.LastActivityDate = DateTime.Now;

                        // Ghi log mất điểm
                        db.PointHistories.Add(new Models.PointHistory
                        {
                            UserId = user.Id,
                            PointsExpired = pointsLost,
                            Description = "Trừ toàn bộ điểm và hạ hạng do 12 tháng không phát sinh giao dịch",
                            CreatedAt = DateTime.Now
                        });
                        
                        _logger.LogInformation($"[Downgrade] User {user.Id} đã bị hạ hạng và mất {pointsLost} điểm.");
                    }

                    if (inactiveUsers.Any())
                    {
                        await db.SaveChangesAsync(stoppingToken);
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi khi chạy Job hạ hạng thành viên.");
                }

                // Chạy 1 ngày 1 lần (24 tiếng)
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;

namespace abchotel.Services
{
    public class AuditLogCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<AuditLogCleanupService> _logger;
        
        // Cấu hình thời gian lưu giữ (Ví dụ: 6 tháng)
        private const int RETENTION_MONTHS = 6; 

        public AuditLogCleanupService(IServiceScopeFactory scopeFactory, ILogger<AuditLogCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Dịch vụ tự động dọn dẹp Audit Log đã khởi động.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    _logger.LogInformation("Bắt đầu tiến trình kiểm tra và xóa log cũ...");

                    using (var scope = _scopeFactory.CreateScope())
                    {
                        var dbContext = scope.ServiceProvider.GetRequiredService<HotelDbContext>();

                        // Xác định mốc thời gian xóa (Hiện tại trừ đi số tháng cấu hình)
                        var cutoffDate = DateTime.Now.AddMonths(-RETENTION_MONTHS);

                        // Tìm các log cũ hơn mốc thời gian trên
                        var oldLogs = dbContext.AuditLogs
                            .Where(l => l.CreatedAt < cutoffDate);

                        int count = await oldLogs.ExecuteDeleteAsync(stoppingToken);

                        if (count > 0)
                        {
                            _logger.LogInformation($"Đã xóa thành công {count} bản ghi log cũ hơn ngày {cutoffDate:dd/MM/yyyy}.");
                        }
                        else
                        {
                            _logger.LogInformation("Không có log nào cần xóa.");
                        }
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Lỗi xảy ra trong quá trình dọn dẹp Audit Log.");
                }

                // Chờ 24 giờ trước khi thực hiện lần kiểm tra tiếp theo
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
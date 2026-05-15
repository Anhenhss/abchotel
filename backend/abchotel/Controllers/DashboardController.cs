using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Đã gỡ Policy "VIEW_DASHBOARD" ở đây để Role_Permissions tự quản lý chặn từ Frontend
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService) 
        { 
            _dashboardService = dashboardService; 
        }

        [HttpGet("config")]
        public async Task<IActionResult> GetDashboardConfig()
        {
            var roleIdClaim = User.FindFirst("roleId")?.Value ?? User.FindFirst(ClaimTypes.Role)?.Value;
            if (int.TryParse(roleIdClaim, out int roleId)) 
            {
                return Content(await _dashboardService.GetDashboardConfigAsync(roleId), "application/json");
            }
            return BadRequest(new { message = "Lỗi xác thực Vai trò." });
        }

        // =========================================================================
        // 1. NHÓM CHỈ SỐ TỔNG QUÁT (STATISTIC CARDS)
        // =========================================================================
        [HttpGet("widget/revenue")] 
        public async Task<IActionResult> GetRev() => Ok(await _dashboardService.GetRevenueStatsAsync());
        
        [HttpGet("widget/new-bookings")] 
        public async Task<IActionResult> GetBk() => Ok(await _dashboardService.GetNewBookingsCountAsync());
        
        [HttpGet("widget/available-rooms")] 
        public async Task<IActionResult> GetRm() => Ok(await _dashboardService.GetAvailableRoomsCountAsync());
        
        [HttpGet("widget/pending-issues")] 
        public async Task<IActionResult> GetIss() => Ok(await _dashboardService.GetPendingIssuesCountAsync());
        
        [HttpGet("widget/users-count")] 
        public async Task<IActionResult> GetUsr() => Ok(await _dashboardService.GetUserCountAsync());
        
        [HttpGet("widget/articles-count")] 
        public async Task<IActionResult> GetArt() => Ok(await _dashboardService.GetArticleCountAsync());

        [HttpGet("widget/inventory-count")] 
        public async Task<IActionResult> GetInvCnt() => Ok(await _dashboardService.GetInventoryCountAsync());

        [HttpGet("widget/damaged-items-count")] 
        public async Task<IActionResult> GetDamagedCnt() => Ok(await _dashboardService.GetDamagedItemsCountAsync());

        // =========================================================================
        // 2. TRUNG TÂM CẢNH BÁO QUẢN TRỊ (ACTIONABLE ALERTS)
        // =========================================================================
        [HttpGet("widget/admin-alerts")] 
        public async Task<IActionResult> GetAl() => Ok(await _dashboardService.GetAdminAlertsAsync());

        // =========================================================================
        // 3. NHÓM BIỂU ĐỒ (CHARTS)
        // =========================================================================
        [HttpGet("widget/revenue-chart")] 
        public async Task<IActionResult> GetRevCh() => Ok(await _dashboardService.GetRevenueChartAsync());
        
        [HttpGet("widget/room-pie")] 
        public async Task<IActionResult> GetRmPie() => Ok(await _dashboardService.GetRoomStatusPieAsync());
        
        [HttpGet("widget/inventory-pie")] 
        public async Task<IActionResult> GetInvPie() => Ok(await _dashboardService.GetInventoryPieAsync());

        [HttpGet("widget/role-membership-dist")] 
        public async Task<IActionResult> GetRoleDist() => Ok(await _dashboardService.GetRoleMembershipDistAsync());

        [HttpGet("widget/revenue-by-method")] 
        public async Task<IActionResult> GetRevMethod() => Ok(await _dashboardService.GetRevenueByMethodPieAsync());

        // =========================================================================
        // 4. NHÓM BẢNG & DANH SÁCH (TABLES & ACTIVITY FEED)
        // =========================================================================
        [HttpGet("widget/recent-bookings")] 
        public async Task<IActionResult> GetRecBk() => Ok(await _dashboardService.GetRecentBookingsTableAsync());
        
        [HttpGet("widget/today-checkin")] 
        public async Task<IActionResult> GetTodCi() => Ok(await _dashboardService.GetTodayCheckInTableAsync());
        
        [HttpGet("widget/system-logs")] 
        public async Task<IActionResult> GetSysLog() => Ok(await _dashboardService.GetSystemLogsAsync());

        [HttpGet("widget/cleaning-queue")] 
        public async Task<IActionResult> GetCQ() => Ok(await _dashboardService.GetCleaningQueueTableAsync());

        [HttpGet("widget/maintenance-list")] 
        public async Task<IActionResult> GetML() => Ok(await _dashboardService.GetMaintenanceListAsync());

        [HttpGet("widget/live-service-orders")] 
        public async Task<IActionResult> GetLSO() => Ok(await _dashboardService.GetLiveServiceOrdersTableAsync());
    }
}
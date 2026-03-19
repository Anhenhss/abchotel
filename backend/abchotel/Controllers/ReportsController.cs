using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using abchotel.Services;

namespace abchotel.Controllers
{
    [ApiController]
    [Route("api/[controller]")] 
    [Authorize(Policy = "VIEW_AUDIT_LOGS")]
    public class ReportsController : ControllerBase
    {
        private readonly IAuditReportService _auditReportService;

        public ReportsController(IAuditReportService auditReportService)
        {
            _auditReportService = auditReportService;
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogs([FromQuery] string tableName, [FromQuery] int top = 100)
        {
            var logs = await _auditReportService.GetSystemAuditLogsAsync(tableName, top);
            return Ok(logs);
        }

        [HttpGet("staff-performance")]
        public async Task<IActionResult> GetStaffPerformance([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var report = await _auditReportService.GetStaffPerformanceReportAsync(startDate, endDate);
            return Ok(report);
        }
    }
}
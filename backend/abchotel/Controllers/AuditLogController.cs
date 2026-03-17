using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;

namespace abchotel.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuditLogController : ControllerBase
    {
        [HttpGet]
        public IActionResult GetLogs() 
            => Ok("Danh sách lịch sử thay đổi hệ thống (Audit Logs)");

        [HttpGet("reports/staff-performance")]
        public IActionResult GetStaffPerformance() 
            => Ok("Báo cáo hiệu suất nhân viên (Module 6.3)");
    }
}

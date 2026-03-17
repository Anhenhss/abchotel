using Microsoft.AspNetCore.Mvc;
using System;

namespace abchotel.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ShiftsController : ControllerBase
    {
        [HttpPost("check-in")]
        public IActionResult CheckIn() => Ok(new { message = "Điểm danh vào ca thành công", time = DateTime.Now });

        [HttpPost("check-out")]
        public IActionResult CheckOut() => Ok(new { message = "Kết thúc ca thành công", time = DateTime.Now });

        [HttpPost("handover")]
        public IActionResult Handover() => Ok("Đã lập biên bản bàn giao ca.");

        [HttpGet]
        public IActionResult GetAllShifts() => Ok("Danh sách ca làm việc (Lọc theo ngày/user)");

        [HttpGet("current")]
        public IActionResult GetCurrentShift() => Ok("Thông tin ca hiện tại của bạn");
    }
}
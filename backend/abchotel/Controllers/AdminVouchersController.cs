using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using abchotel.Models;
using abchotel.Services;

namespace abchotel.Controllers.Admin
{
    [ApiController]
    [Route("api/admin/vouchers")]
    public class AdminVouchersController : ControllerBase
    {
        private readonly IVoucherService _voucherService;

        // Controller giờ chỉ gọi Service, không thọc tay vào Database nữa
        public AdminVouchersController(IVoucherService voucherService)
        {
            _voucherService = voucherService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Voucher>>> GetVouchers()
        {
            var vouchers = await _voucherService.GetAllVouchersAsync();
            return Ok(vouchers);
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Voucher>> GetVoucher(int id)
        {
            var voucher = await _voucherService.GetVoucherByIdAsync(id);
            if (voucher == null) return NotFound(new { message = "Không tìm thấy mã khuyến mãi này." });
            
            return Ok(voucher);
        }

        [HttpPost]
        public async Task<ActionResult<Voucher>> CreateVoucher([FromBody] Voucher voucher)
        {
            try
            {
                var newVoucher = await _voucherService.CreateVoucherAsync(voucher);
                return CreatedAtAction(nameof(GetVoucher), new { id = newVoucher.Id }, newVoucher);
            }
            catch (Exception ex)
            {
                // Bắt lỗi trùng mã code từ Service ném ra
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVoucher(int id, [FromBody] Voucher updatedVoucher)
        {
            if (id != updatedVoucher.Id) return BadRequest(new { message = "ID truyền vào không khớp." });

            var result = await _voucherService.UpdateVoucherAsync(id, updatedVoucher);

            if (result == "NOT_FOUND") return NotFound(new { message = "Không tìm thấy mã khuyến mãi." });
            if (result == "DUPLICATE_CODE") return BadRequest(new { message = "Mã code mới này đã bị trùng!" });

            return Ok(new { message = "Cập nhật thành công!" });
        }

        [HttpPatch("{id}/toggle")]
        public async Task<IActionResult> ToggleVoucherStatus(int id)
        {
            var voucher = await _voucherService.ToggleVoucherStatusAsync(id);
            
            if (voucher == null) return NotFound(new { message = "Không tìm thấy mã khuyến mãi." });

            var statusMsg = voucher.IsActive ? "Đã MỞ LẠI mã khuyến mãi." : "Đã TẠM DỪNG mã khuyến mãi.";
            return Ok(new { message = statusMsg, isActive = voucher.IsActive });
        }
    }
}
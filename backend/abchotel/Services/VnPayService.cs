using System;
using System.Linq; // Bổ sung thư viện này để dùng FirstOrDefault
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using abchotel.Helpers;
using abchotel.DTOs;

namespace abchotel.Services
{
    public interface IVnPayService
    {
        string CreatePaymentUrl(HttpContext context, int invoiceId, decimal amount, string orderInfo);
        (bool IsSuccess, int InvoiceId, string TransactionId, string Message) PaymentExecute(IQueryCollection collections);
    }

    public class VnPayService : IVnPayService
    {
        private readonly IConfiguration _config;

        public VnPayService(IConfiguration config)
        {
            _config = config;
        }

        public string CreatePaymentUrl(HttpContext context, int invoiceId, decimal amount, string orderInfo)
        {
            // 🔥 ÉP CỨNG LẤY GIỜ VIỆT NAM (UTC + 7) ĐỂ KHÔNG BỊ LỖI TIMEOUT VNPAY
            DateTime vietnamTime = DateTime.UtcNow.AddHours(7);
            var tick = vietnamTime.Ticks.ToString();
            var vnpay = new VnPayLibrary();

            vnpay.AddRequestData("vnp_Version", "2.1.0");
            vnpay.AddRequestData("vnp_Command", "pay");
            vnpay.AddRequestData("vnp_TmnCode", _config["VnPay:TmnCode"]);
            
            // VNPay tính tiền bằng VND nhưng nhân 100 (VD: 100.000đ thì gửi lên 10.000.000)
            vnpay.AddRequestData("vnp_Amount", ((long)(amount * 100)).ToString()); 
            
            // 🔥 GỬI THỜI GIAN TẠO VÀ THỜI GIAN HẾT HẠN (15 PHÚT) THEO CHUẨN GIỜ VN
            vnpay.AddRequestData("vnp_CreateDate", vietnamTime.ToString("yyyyMMddHHmmss"));
            vnpay.AddRequestData("vnp_ExpireDate", vietnamTime.AddMinutes(15).ToString("yyyyMMddHHmmss"));
            
            vnpay.AddRequestData("vnp_CurrCode", "VND");
            vnpay.AddRequestData("vnp_IpAddr", Utils.GetIpAddress(context));
            vnpay.AddRequestData("vnp_Locale", "vn");
            
            vnpay.AddRequestData("vnp_OrderInfo", orderInfo);
            vnpay.AddRequestData("vnp_OrderType", "other"); // Mã loại hàng hóa
            vnpay.AddRequestData("vnp_ReturnUrl", _config["VnPay:ReturnUrl"]);
            
            // TxnRef là mã giao dịch duy nhất. Ta gắn mã InvoiceId vào đây để lúc về còn biết của Hóa đơn nào
            vnpay.AddRequestData("vnp_TxnRef", $"{invoiceId}_{tick}");

            var paymentUrl = vnpay.CreateRequestUrl(_config["VnPay:BaseUrl"], _config["VnPay:HashSecret"]);
            return paymentUrl;
        }

        public (bool IsSuccess, int InvoiceId, string TransactionId, string Message) PaymentExecute(IQueryCollection collections)
        {
            var vnpay = new VnPayLibrary();
            foreach (var (key, value) in collections)
            {
                if (!string.IsNullOrEmpty(key) && key.StartsWith("vnp_"))
                {
                    vnpay.AddResponseData(key, value.ToString());
                }
            }

            var vnp_TxnRef = vnpay.GetResponseData("vnp_TxnRef");
            var vnp_TransactionNo = vnpay.GetResponseData("vnp_TransactionNo"); // Mã giao dịch ghi nhận tại VNPay
            var vnp_SecureHash = collections.FirstOrDefault(p => p.Key == "vnp_SecureHash").Value;
            var vnp_ResponseCode = vnpay.GetResponseData("vnp_ResponseCode");

            // Tách InvoiceId từ TxnRef (Ví dụ TxnRef là: "15_63782912389")
            int invoiceId = 0;
            if (!string.IsNullOrEmpty(vnp_TxnRef))
            {
                var splitStr = vnp_TxnRef.Split('_');
                if (splitStr.Length > 0) int.TryParse(splitStr[0], out invoiceId);
            }

            // Kiểm tra chữ ký bảo mật xem có bị hacker can thiệp dọc đường không
            bool checkSignature = vnpay.ValidateSignature(vnp_SecureHash, _config["VnPay:HashSecret"]);
            
            if (!checkSignature) return (false, invoiceId, vnp_TransactionNo, "Chữ ký bảo mật không hợp lệ (Dữ liệu có thể đã bị can thiệp).");

            if (vnp_ResponseCode == "00")
            {
                return (true, invoiceId, vnp_TransactionNo, "Thanh toán thành công.");
            }
            
            return (false, invoiceId, vnp_TransactionNo, $"Lỗi thanh toán từ VNPay. Mã lỗi: {vnp_ResponseCode}");
        }
    }
}
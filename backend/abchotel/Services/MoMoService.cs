using System;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.AspNetCore.Http;
using System.Linq;

namespace abchotel.Services
{
    public interface IMoMoService
    {
        Task<string> CreatePaymentUrlAsync(int invoiceId, decimal amount, string orderInfo);
        (bool IsSuccess, int InvoiceId, string TransactionId, string Message) PaymentExecute(IQueryCollection collections);
    }

    public class MoMoService : IMoMoService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient; // Dùng để gọi API lên máy chủ MoMo

        public MoMoService(IConfiguration config, HttpClient httpClient)
        {
            _config = config;
            _httpClient = httpClient;
        }

        public async Task<string> CreatePaymentUrlAsync(int invoiceId, decimal amount, string orderInfo)
        {
            string partnerCode = _config["MoMo:PartnerCode"];
            string accessKey = _config["MoMo:AccessKey"];
            string secretKey = _config["MoMo:SecretKey"];
            string endpoint = _config["MoMo:Endpoint"];
            string returnUrl = _config["MoMo:ReturnUrl"];
            // IPN Url thường dùng khi public web thật, ở local ta tạm dùng returnUrl
            string ipnUrl = _config["MoMo:ReturnUrl"]; 

            string orderId = $"{invoiceId}_{DateTime.Now.Ticks}"; // Mã đơn hàng duy nhất
            string requestId = Guid.NewGuid().ToString();
            string extraData = "";
            string amountStr = ((long)amount).ToString(); // MoMo nhận tiền nguyên dương
            string requestType = "captureWallet";

            // 1. Tạo chuỗi ký tự theo đúng chuẩn MoMo yêu cầu (Theo thứ tự alphabet)
            string rawHash = $"accessKey={accessKey}&amount={amountStr}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={returnUrl}&requestId={requestId}&requestType={requestType}";

            // 2. Băm chữ ký bảo mật SHA256
            string signature = HmacSHA256(rawHash, secretKey);

            // 3. Đóng gói dữ liệu thành JSON
            var requestData = new
            {
                partnerCode = partnerCode,
                partnerName = "ABC Hotel",
                storeId = "ABC_Store",
                requestId = requestId,
                amount = (long)amount,
                orderId = orderId,
                orderInfo = orderInfo,
                redirectUrl = returnUrl,
                ipnUrl = ipnUrl,
                lang = "vi",
                extraData = extraData,
                requestType = requestType,
                signature = signature
            };

            var content = new StringContent(JsonSerializer.Serialize(requestData), Encoding.UTF8, "application/json");

            // 4. Gửi Request lên máy chủ MoMo
            var response = await _httpClient.PostAsync(endpoint, content);
            var responseString = await response.Content.ReadAsStringAsync();

            // 5. Đọc JSON MoMo trả về để lấy cái Link thanh toán (payUrl)
            using (JsonDocument doc = JsonDocument.Parse(responseString))
            {
                var root = doc.RootElement;
                if (root.TryGetProperty("payUrl", out JsonElement payUrlElement))
                {
                    return payUrlElement.GetString(); // Trả cái Link này về cho React
                }
                
                // Nếu lỗi, trả về nguyên nhân
                string msg = root.TryGetProperty("message", out JsonElement msgElement) ? msgElement.GetString() : "Lỗi không xác định";
                throw new Exception($"Lỗi tạo link MoMo: {msg}");
            }
        }

        public (bool IsSuccess, int InvoiceId, string TransactionId, string Message) PaymentExecute(IQueryCollection collections)
        {
            // Lấy thông tin MoMo ném về URL
            string orderId = collections["orderId"];
            string message = collections["message"];
            string resultCode = collections["resultCode"];
            string transId = collections["transId"];
            
            // Lấy InvoiceId ra từ chuỗi orderId (VD: "15_63782912389" -> 15)
            int invoiceId = 0;
            if (!string.IsNullOrEmpty(orderId))
            {
                var splitStr = orderId.Split('_');
                if (splitStr.Length > 0) int.TryParse(splitStr[0], out invoiceId);
            }

            // resultCode == "0" nghĩa là giao dịch thành công (Quy định của MoMo)
            if (resultCode == "0")
            {
                return (true, invoiceId, transId, "Thanh toán MoMo thành công.");
            }

            return (false, invoiceId, transId, $"Giao dịch thất bại hoặc bị hủy. Chi tiết: {message}");
        }

        private string HmacSHA256(string inputData, string key)
        {
            byte[] keyByte = Encoding.UTF8.GetBytes(key);
            byte[] messageBytes = Encoding.UTF8.GetBytes(inputData);
            using (var hmacsha256 = new HMACSHA256(keyByte))
            {
                byte[] hashmessage = hmacsha256.ComputeHash(messageBytes);
                string hex = BitConverter.ToString(hashmessage);
                return hex.Replace("-", "").ToLower();
            }
        }
    }
}
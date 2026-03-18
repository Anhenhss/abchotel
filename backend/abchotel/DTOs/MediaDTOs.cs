using Microsoft.AspNetCore.Http;

namespace abchotel.DTOs
{
    public class UploadImageResponse
    {
        public string Url { get; set; }
        public string PublicId { get; set; }
    }
}
using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using abchotel.DTOs;

namespace abchotel.Services
{
    public interface IMediaService
    {
        Task<UploadImageResponse> UploadImageAsync(IFormFile file);
        Task<bool> DeleteImageAsync(string publicId);
        string ExtractPublicIdFromUrl(string imageUrl); // Bổ sung hàm tiện ích này
    }

    public class MediaService : IMediaService
    {
        private readonly Cloudinary _cloudinary;

        public MediaService(IConfiguration config)
        {
            var acc = new Account(
                config["Cloudinary:CloudName"],
                config["Cloudinary:ApiKey"],
                config["Cloudinary:ApiSecret"]
            );
            _cloudinary = new Cloudinary(acc);
        }

        public async Task<UploadImageResponse> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;

            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "abchotel", 
                Transformation = new Transformation().Quality("auto").FetchFormat("auto") 
            };

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);

            if (uploadResult.Error != null)
                throw new Exception(uploadResult.Error.Message);

            return new UploadImageResponse
            {
                Url = uploadResult.SecureUrl.ToString(),
                PublicId = uploadResult.PublicId
            };
        }

        public async Task<bool> DeleteImageAsync(string publicId)
        {
            if (string.IsNullOrEmpty(publicId)) return false;

            var deleteParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deleteParams);
            
            return result.Result == "ok";
        }

        // BẢO BỐI: Bóc tách PublicId từ URL bất kỳ của Cloudinary
        public string ExtractPublicIdFromUrl(string imageUrl)
        {
            if (string.IsNullOrEmpty(imageUrl)) return null;

            try
            {
                var uri = new Uri(imageUrl);
                var segments = uri.AbsolutePath.Split('/');
                
                // Cloudinary URL thường có cấu trúc: /.../upload/v1234567/folder/image.jpg
                var uploadIndex = Array.IndexOf(segments, "upload");
                if (uploadIndex == -1 || uploadIndex + 1 >= segments.Length) return null;

                // Bỏ qua version (thư mục bắt đầu bằng chữ 'v' và theo sau là số)
                var startIndex = uploadIndex + 1;
                if (segments[startIndex].StartsWith("v") && segments[startIndex].Length > 1 && char.IsDigit(segments[startIndex][1]))
                {
                    startIndex++;
                }

                // Ghép các phần còn lại thành PublicId (bao gồm cả thư mục)
                var publicIdWithExtension = string.Join("/", segments.Skip(startIndex));
                
                // Cắt bỏ đuôi file (.jpg, .png)
                var lastDotIndex = publicIdWithExtension.LastIndexOf('.');
                if (lastDotIndex > 0)
                {
                    return publicIdWithExtension.Substring(0, lastDotIndex);
                }

                return publicIdWithExtension;
            }
            catch
            {
                return null; // Báo lỗi ngầm nếu URL rác
            }
        }
    }
}
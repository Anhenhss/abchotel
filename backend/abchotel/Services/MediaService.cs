using System;
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
                Folder = "abchotel", // Tự động gom ảnh vào 1 thư mục trên Cloud
                Transformation = new Transformation().Quality("auto").FetchFormat("auto") // Tối ưu dung lượng
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
            var deleteParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deleteParams);
            
            return result.Result == "ok";
        }
    }
}
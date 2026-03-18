using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;

namespace abchotel.Services
{
    public interface IAttractionService
    {
        Task<List<AttractionResponse>> GetAllAttractionsAsync(bool onlyActive = false);
        Task<AttractionResponse> GetAttractionByIdAsync(int id);
        Task<(bool IsSuccess, string Message, AttractionResponse Data)> CreateAttractionAsync(CreateAttractionRequest request);
        Task<bool> UpdateAttractionAsync(int id, UpdateAttractionRequest request);
        Task<bool> ToggleSoftDeleteAsync(int id);
    }

    public class AttractionService : IAttractionService
    {
        private readonly HotelDbContext _context;

        public AttractionService(HotelDbContext context) => _context = context;

        public async Task<List<AttractionResponse>> GetAllAttractionsAsync(bool onlyActive = false)
        {
            var query = _context.Attractions.AsQueryable();

            if (onlyActive)
            {
                query = query.Where(a => a.IsActive);
            }

            return await query.OrderBy(a => a.DistanceKm).Select(a => new AttractionResponse
            {
                Id = a.Id,
                Name = a.Name,
                DistanceKm = a.DistanceKm,
                Description = a.Description,
                MapEmbedLink = a.MapEmbedLink,
                Latitude = a.Latitude,
                Longitude = a.Longitude,
                Address = a.Address,
                IsActive = a.IsActive
            }).ToListAsync();
        }

        public async Task<AttractionResponse> GetAttractionByIdAsync(int id)
        {
            var attraction = await _context.Attractions.FindAsync(id);
            if (attraction == null) return null;

            return new AttractionResponse
            {
                Id = attraction.Id,
                Name = attraction.Name,
                DistanceKm = attraction.DistanceKm,
                Description = attraction.Description,
                MapEmbedLink = attraction.MapEmbedLink,
                Latitude = attraction.Latitude,
                Longitude = attraction.Longitude,
                Address = attraction.Address,
                IsActive = attraction.IsActive
            };
        }

        public async Task<(bool IsSuccess, string Message, AttractionResponse Data)> CreateAttractionAsync(CreateAttractionRequest request)
        {
            var attraction = new Attraction
            {
                Name = request.Name,
                DistanceKm = request.DistanceKm,
                Description = request.Description,
                MapEmbedLink = request.MapEmbedLink,
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Address = request.Address,
                IsActive = true 
            };

            _context.Attractions.Add(attraction);
            await _context.SaveChangesAsync();

            var response = new AttractionResponse
            {
                Id = attraction.Id,
                Name = attraction.Name,
                DistanceKm = attraction.DistanceKm,
                Description = attraction.Description,
                MapEmbedLink = attraction.MapEmbedLink,
                Latitude = attraction.Latitude,
                Longitude = attraction.Longitude,
                Address = attraction.Address,
                IsActive = attraction.IsActive
            };

            return (true, "Thêm điểm du lịch thành công.", response);
        }

        public async Task<bool> UpdateAttractionAsync(int id, UpdateAttractionRequest request)
        {
            var attraction = await _context.Attractions.FindAsync(id);
            if (attraction == null) return false;

            attraction.Name = request.Name;
            attraction.DistanceKm = request.DistanceKm;
            attraction.Description = request.Description;
            attraction.MapEmbedLink = request.MapEmbedLink;
            attraction.Latitude = request.Latitude;
            attraction.Longitude = request.Longitude;
            attraction.Address = request.Address;

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> ToggleSoftDeleteAsync(int id)
        {
            var attraction = await _context.Attractions.FindAsync(id);
            if (attraction == null) return false;

            attraction.IsActive = !attraction.IsActive; 
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
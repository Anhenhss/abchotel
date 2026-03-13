using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using abchotel.Data;     // Chứa HotelDbContext của bạn
using abchotel.DTOs;

namespace abchotel.Services
{
    public interface IRoomService
    {
        Task<List<SearchRoomResponse>> SearchRoomsAsync(SearchRoomRequest request);
    }

    public class RoomService : IRoomService
    {
        private readonly HotelDbContext _context;

        public RoomService(HotelDbContext context)
        {
            _context = context;
        }

        public async Task<List<SearchRoomResponse>> SearchRoomsAsync(SearchRoomRequest request)
        {
            // Dùng SqlQueryRaw để gọi thẳng Stored Procedure và map kết quả vào DTO
            var availableRooms = await _context.Database.SqlQueryRaw<SearchRoomResponse>(
                "EXEC sp_SearchAvailableRooms @CheckIn={0}, @CheckOut={1}, @Adults={2}, @Children={3}, @RequestedRooms={4}, @MinPrice={5}, @MaxPrice={6}",
                request.CheckIn, 
                request.CheckOut, 
                request.Adults, 
                request.Children, 
                request.RequestedRooms, 
                request.MinPrice, 
                request.MaxPrice
            ).ToListAsync();

            return availableRooms;
        }
    }
}
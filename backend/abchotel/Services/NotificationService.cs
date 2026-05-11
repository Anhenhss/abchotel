using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using abchotel.Hubs;
using abchotel.Data;
using abchotel.Models;

namespace abchotel.Services
{
    public interface INotificationService
    {
        Task SendToPermissionAsync(string permission, string title, string content, string type = "Info", string link = null);
        Task BroadcastGlobalAsync(string title, string content, string type = "Info");
    }

    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly HotelDbContext _context;

        public NotificationService(IHubContext<NotificationHub> hubContext, HotelDbContext context)
        {
            _hubContext = hubContext;
            _context = context;
        }

        public async Task SendToPermissionAsync(string permission, string title, string content, string type = "Info", string link = null)
        {
            // 1. TÌM TẤT CẢ USER CÓ QUYỀN NÀY ĐỂ LƯU DATABASE
            var usersToNotify = await _context.Users
                .Include(u => u.Role)
                .ThenInclude(r => r.RolePermissions)
                .ThenInclude(rp => rp.Permission)
                .Where(u => u.IsActive && u.Role.RolePermissions.Any(rp => rp.Permission.Name == permission))
                .ToListAsync();

            var notifications = usersToNotify.Select(u => new Notification
            {
                UserId = u.Id,
                Title = title,
                Content = content,
                Type = type,
                ReferenceLink = link,
                CreatedAt = DateTime.Now,
                IsRead = false
            }).ToList();

            if (notifications.Any())
            {
                _context.Notifications.AddRange(notifications);
                await _context.SaveChangesAsync();
            }

            // 2. BẮN SIGNALR ĐỂ HIỆN POPUP REALTIME TRÊN MÀN HÌNH
            await _hubContext.Clients.Group(permission).SendAsync("ReceiveNotification", new 
            { 
                title = title, 
                content = content, 
                type = type,
                createdAt = DateTime.Now
            });
        }

        public async Task BroadcastGlobalAsync(string title, string content, string type = "Info")
    {
        // Gửi đến TẤT CẢ các client đang kết nối SignalR
        // Chúng ta gửi kèm field "type" để Frontend nhận biết đây là lệnh cần reload dữ liệu
        await _hubContext.Clients.All.SendAsync("ReceiveNotification", new 
        { 
            title = title, 
            content = content, 
            type = type, // Ví dụ truyền "RELOAD_ARTICLES"
            createdAt = DateTime.Now 
        });
    }
}
        }
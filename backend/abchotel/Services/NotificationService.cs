using abchotel.Data;
using abchotel.Hubs;
using abchotel.Models;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace abchotel.Services
{
    public interface INotificationService
    {
        Task SendToRolesAsync(List<string> roles, string title, string content, string type, string link = null);
    }

    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;
        private readonly HotelDbContext _db;

        public NotificationService(IHubContext<NotificationHub> hubContext, HotelDbContext db)
        {
            _hubContext = hubContext;
            _db = db;
        }

        public async Task SendToRolesAsync(List<string> roles, string title, string content, string type, string link = null)
        {
            // 1. Lưu DB cho tất cả Admin/Manager xem lại sau
            var notification = new Notification
            {
                Title = title,
                Content = content,
                Type = type,
                ReferenceLink = link,
                IsRead = false,
                CreatedAt = DateTime.Now
            };
            _db.Notifications.Add(notification);
            await _db.SaveChangesAsync();

            // 2. Đẩy SignalR tới những ai đang Online
            foreach (var role in roles)
            {
                await _hubContext.Clients.Group(role).SendAsync("ReceiveNotification", new
                {
                    id = notification.Id,
                    title = notification.Title,
                    content = notification.Content,
                    type = notification.Type,
                    createdAt = notification.CreatedAt
                });
            }
        }
    }
}
using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;
using abchotel.Hubs;

namespace abchotel.Services
{
    public interface INotificationService
    {
        Task SendToRolesAsync(List<string> roles, string title, string content, string type = "Info");
        Task SendToPermissionAsync(string permission, string title, string content, string type = "Info");
    }

    public class NotificationService : INotificationService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public NotificationService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task SendToRolesAsync(List<string> roles, string title, string content, string type = "Info")
        {
            foreach (var role in roles)
            {
                await _hubContext.Clients.Group(role).SendAsync("ReceiveNotification", new 
                { 
                    title = title, 
                    content = content, 
                    type = type 
                });
            }
        }

        // HÀM MỚI: Gửi thông báo cho TẤT CẢ những ai có Quyền (Permission) cụ thể
        public async Task SendToPermissionAsync(string permission, string title, string content, string type = "Info")
        {
            await _hubContext.Clients.Group(permission).SendAsync("ReceiveNotification", new 
            { 
                title = title, 
                content = content, 
                type = type 
            });
        }
    }
}
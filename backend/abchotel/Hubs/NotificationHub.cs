using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace abchotel.Hubs
{
    [Authorize]
    public class NotificationHub : Hub
    {
        public override async Task OnConnectedAsync()
        {
            try 
            {
                // 1. Nhóm theo Chức vụ (Admin, Manager...)
                var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
                if (!string.IsNullOrEmpty(role))
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, role);
                }

                // 2. Nhóm theo QUYỀN HẠN (MANAGE_USERS, MANAGE_ROLES...)
                var claims = Context.User?.Claims.ToList();
                if (claims != null)
                {
                    foreach (var claim in claims)
                    {
                        if (claim.Type == "Permission")
                        {
                            await Groups.AddToGroupAsync(Context.ConnectionId, claim.Value);
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine("Lỗi SignalR: " + ex.Message);
            }
            
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            // Gỡ kết nối tương tự như lúc vào
            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
            if (!string.IsNullOrEmpty(role)) await Groups.RemoveFromGroupAsync(Context.ConnectionId, role);

            var claims = Context.User?.Claims.ToList();
            if (claims != null)
            {
                foreach (var claim in claims)
                {
                    if (claim.Type == "Permission") await Groups.RemoveFromGroupAsync(Context.ConnectionId, claim.Value);
                }
            }

            await base.OnDisconnectedAsync(exception);
        }
    }
}
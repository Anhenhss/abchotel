using System;
using System.Collections.Generic;

namespace abchotel.DTOs
{
    public class DashboardStatsResponse
    {
        public decimal Revenue { get; set; } // Doanh thu tháng này
        public int NewBookings { get; set; } // Số đặt phòng hôm nay
        public int AvailableRooms { get; set; } // Số phòng sẵn sàng
        public int PendingIssues { get; set; } // Sự cố chờ xử lý
    }

    public class DashboardRoomStatusResponse
    {
        public int Total { get; set; }
        public int Occupied { get; set; }
        public int Available { get; set; }
        public int Cleaning { get; set; }
        public int Maintenance { get; set; }
    }

    public class DashboardRecentBookingResponse
    {
        public string Id { get; set; }
        public string Customer { get; set; }
        public string Room { get; set; }
        public decimal Amount { get; set; }
        public string Status { get; set; }
        public DateTime Date { get; set; }
    }

    public class DashboardActivityResponse
    {
        public int Id { get; set; }
        public string Time { get; set; }
        public string Desc { get; set; }
        public string Color { get; set; }
    }
    public class DashboardReviewResponse
    {
        public int Id { get; set; }
        public string CustomerName { get; set; }
        public string RoomTypeName { get; set; }
        public int Rating { get; set; }
        public string Comment { get; set; }
        public DateTime Date { get; set; }
    }
    public class DashboardResponse
    {
        public DashboardStatsResponse Stats { get; set; } = new DashboardStatsResponse();
        public DashboardRoomStatusResponse RoomStatus { get; set; } = new DashboardRoomStatusResponse();
        public List<DashboardRecentBookingResponse> RecentBookings { get; set; } = new List<DashboardRecentBookingResponse>();
        public List<DashboardActivityResponse> Activities { get; set; } = new List<DashboardActivityResponse>();
        public List<DashboardReviewResponse> RecentReviews { get; set; } = new List<DashboardReviewResponse>();

    }
    
}
using System;

namespace abchotel.DTOs
{
    public class HandoverRequest
    {
        public string Notes { get; set; }
    }

    public class ShiftResponse
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string FullName { get; set; }
        public DateTime CheckInTime { get; set; }
        public DateTime? CheckOutTime { get; set; }
        public string HandoverNotes { get; set; }
        public double? TotalHoursWorked { get; set; }
    }
}
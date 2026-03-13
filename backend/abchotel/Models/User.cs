using System;
using System.Collections.Generic;

namespace abchotel.Models;

public partial class User
{
    public int Id { get; set; }

    public int? RoleId { get; set; }

    public int? MembershipId { get; set; }

    public string FullName { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string? Phone { get; set; }

    public string PasswordHash { get; set; } = null!;

    public bool? Status { get; set; }

    public virtual ICollection<Article> Articles { get; set; } = new List<Article>();

    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    public virtual Membership? Membership { get; set; }

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual Role? Role { get; set; }
    public int TotalPoints { get; set; }
    public DateTime? LastActivityDate { get; set; }
    public virtual ICollection<PointHistory> PointHistories { get; set; } = new List<PointHistory>();
    }

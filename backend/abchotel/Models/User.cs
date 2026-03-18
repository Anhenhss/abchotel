using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace abchotel.Models;

[Index("RefreshToken", Name = "IX_Users_RefreshToken")]
[Index("Email", Name = "UQ__Users__AB6E61646999EC13", IsUnique = true)]
public partial class User
{
    [Key]
    [Column("id")]
    public int Id { get; set; }

    [Column("role_id")]
    public int? RoleId { get; set; }

    [Column("membership_id")]
    public int? MembershipId { get; set; }

    [Column("full_name")]
    [StringLength(255)]
    public string FullName { get; set; } = null!;

    [Column("email")]
    [StringLength(255)]
    public string Email { get; set; } = null!;

    [Column("phone")]
    [StringLength(50)]
    public string? Phone { get; set; }

    [Column("password_hash")]
    public string PasswordHash { get; set; } = null!;

    [Column("status")]
    public bool? Status { get; set; }

    [Column("avatar_url")]
    [StringLength(500)]
    public string? AvatarUrl { get; set; }

    [Column("date_of_birth")]
    public DateOnly? DateOfBirth { get; set; }

    [Column("gender")]
    [StringLength(50)]
    public string? Gender { get; set; }

    [Column("address")]
    public string? Address { get; set; }

    [Column("refresh_token")]
    [StringLength(255)]
    [Unicode(false)]
    public string? RefreshToken { get; set; }

    [Column("refresh_token_expiry", TypeName = "datetime")]
    public DateTime? RefreshTokenExpiry { get; set; }

    [Column("created_at", TypeName = "datetime")]
    public DateTime? CreatedAt { get; set; }

    [Column("created_by")]
    public int? CreatedBy { get; set; }

    [Column("updated_at", TypeName = "datetime")]
    public DateTime? UpdatedAt { get; set; }

    [Column("updated_by")]
    public int? UpdatedBy { get; set; }

    [Column("total_points")]
    public int TotalPoints { get; set; }

    [Column("last_activity_date", TypeName = "datetime")]
    public DateTime? LastActivityDate { get; set; }

    [Column("is_active")]
    public bool IsActive { get; set; }

    [InverseProperty("Author")]
    public virtual ICollection<Article> Articles { get; set; } = new List<Article>();

    [InverseProperty("User")]
    public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();

    [InverseProperty("User")]
    public virtual ICollection<Booking> Bookings { get; set; } = new List<Booking>();

    [InverseProperty("ReportedByNavigation")]
    public virtual ICollection<LossAndDamage> LossAndDamages { get; set; } = new List<LossAndDamage>();

    [ForeignKey("MembershipId")]
    [InverseProperty("Users")]
    public virtual Membership? Membership { get; set; }

    [InverseProperty("User")]
    public virtual ICollection<PointHistory> PointHistories { get; set; } = new List<PointHistory>();

    [InverseProperty("User")]
    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    [ForeignKey("RoleId")]
    [InverseProperty("Users")]
    public virtual Role? Role { get; set; }

    [InverseProperty("User")]
    public virtual ICollection<Shift> Shifts { get; set; } = new List<Shift>();
}

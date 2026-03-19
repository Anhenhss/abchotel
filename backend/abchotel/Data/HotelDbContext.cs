using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using abchotel.Models;
using System.Threading;

namespace abchotel.Data;

public partial class HotelDbContext : DbContext
{
    public HotelDbContext()
    {
    }

    public HotelDbContext(DbContextOptions<HotelDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Amenity> Amenities { get; set; }

    public virtual DbSet<Article> Articles { get; set; }

    public virtual DbSet<ArticleCategory> ArticleCategories { get; set; }

    public virtual DbSet<Attraction> Attractions { get; set; }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Booking> Bookings { get; set; }

    public virtual DbSet<BookingDetail> BookingDetails { get; set; }

    public virtual DbSet<Invoice> Invoices { get; set; }

    public virtual DbSet<LossAndDamage> LossAndDamages { get; set; }

    public virtual DbSet<Membership> Memberships { get; set; }

    public virtual DbSet<OrderService> OrderServices { get; set; }

    public virtual DbSet<OrderServiceDetail> OrderServiceDetails { get; set; }

    public virtual DbSet<Payment> Payments { get; set; }

    public virtual DbSet<Permission> Permissions { get; set; }

    public virtual DbSet<PointHistory> PointHistories { get; set; }

    public virtual DbSet<Review> Reviews { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<RolePermission> RolePermissions { get; set; }

    public virtual DbSet<Room> Rooms { get; set; }

    public virtual DbSet<RoomImage> RoomImages { get; set; }

    public virtual DbSet<RoomInventory> RoomInventories { get; set; }

    public virtual DbSet<RoomType> RoomTypes { get; set; }

    public virtual DbSet<RoomTypeAmenity> RoomTypeAmenities { get; set; }

    public virtual DbSet<Service> Services { get; set; }

    public virtual DbSet<ServiceCategory> ServiceCategories { get; set; }

    public virtual DbSet<Shift> Shifts { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<Voucher> Vouchers { get; set; }

    //     protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    // #warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
    //         => optionsBuilder.UseSqlServer("Server=.\\SQLEXPRESS;Database=HotelManagementDB;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Amenity>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Amenitie__3213E83F8CF8D4D6");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Article>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Articles__3213E83F41D01CE6");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PublishedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Author).WithMany(p => p.Articles).HasConstraintName("FK__Articles__author__00200768");

            entity.HasOne(d => d.Category).WithMany(p => p.Articles).HasConstraintName("FK__Articles__catego__01142BA1");
        });

        modelBuilder.Entity<ArticleCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Article___3213E83F86F6A5FF");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<Attraction>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Attracti__3213E83F3028DE2D");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Audit_Lo__3213E83FDC442CE8");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.User).WithMany(p => p.AuditLogs).HasConstraintName("FK__Audit_Log__user___02084FDA");
        });

        modelBuilder.Entity<Booking>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Bookings__3213E83F5E9138FF");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status).HasDefaultValue("Pending");

            entity.HasOne(d => d.User).WithMany(p => p.Bookings).HasConstraintName("FK__Bookings__user_i__05D8E0BE");

            entity.HasOne(d => d.Voucher).WithMany(p => p.Bookings).HasConstraintName("FK__Bookings__vouche__06CD04F7");
        });

        modelBuilder.Entity<BookingDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Booking___3213E83F3B69EDA8");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Booking).WithMany(p => p.BookingDetails).HasConstraintName("FK__Booking_D__booki__02FC7413");

            entity.HasOne(d => d.Room).WithMany(p => p.BookingDetails).HasConstraintName("FK__Booking_D__room___03F0984C");

            entity.HasOne(d => d.RoomType).WithMany(p => p.BookingDetails).HasConstraintName("FK__Booking_D__room___04E4BC85");
        });

        modelBuilder.Entity<Invoice>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Invoices__3213E83FB0379276");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.DiscountAmount).HasDefaultValue(0m);
            entity.Property(e => e.FinalTotal).HasDefaultValue(0m);
            entity.Property(e => e.Status).HasDefaultValue("Unpaid");
            entity.Property(e => e.TaxAmount).HasDefaultValue(0m);
            entity.Property(e => e.TotalRoomAmount).HasDefaultValue(0m);
            entity.Property(e => e.TotalServiceAmount).HasDefaultValue(0m);

            entity.HasOne(d => d.Booking).WithMany(p => p.Invoices).HasConstraintName("FK__Invoices__bookin__07C12930");
        });

        modelBuilder.Entity<LossAndDamage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Loss_And__3213E83F4B67A78C");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IssueType).HasDefaultValue("DAMAGE");
            entity.Property(e => e.Status).HasDefaultValue("PENDING");

            entity.HasOne(d => d.BookingDetail).WithMany(p => p.LossAndDamages).HasConstraintName("FK__Loss_And___booki__08B54D69");

            entity.HasOne(d => d.Invoice).WithMany(p => p.LossAndDamages).HasConstraintName("FK__Loss_And___invoi__2180FB33");

            entity.HasOne(d => d.ReportedByNavigation).WithMany(p => p.LossAndDamages).HasConstraintName("FK__Loss_And___repor__208CD6FA");

            entity.HasOne(d => d.RoomInventory).WithMany(p => p.LossAndDamages).HasConstraintName("FK__Loss_And___room___09A971A2");
        });

        modelBuilder.Entity<Membership>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Membersh__3213E83FEDBCB1C6");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.DiscountPercent).HasDefaultValue(0.00m);
            entity.Property(e => e.MinPoints).HasDefaultValue(0);
        });

        modelBuilder.Entity<OrderService>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Order_Se__3213E83FDDDA9BD7");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.OrderDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status).HasDefaultValue("Pending");
            entity.Property(e => e.TotalAmount).HasDefaultValue(0m);

            entity.HasOne(d => d.BookingDetail).WithMany(p => p.OrderServices).HasConstraintName("FK__Order_Ser__booki__0C85DE4D");
        });

        modelBuilder.Entity<OrderServiceDetail>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Order_Se__3213E83FABFA43B1");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.OrderService).WithMany(p => p.OrderServiceDetails).HasConstraintName("FK__Order_Ser__order__0A9D95DB");

            entity.HasOne(d => d.Service).WithMany(p => p.OrderServiceDetails).HasConstraintName("FK__Order_Ser__servi__0B91BA14");
        });

        modelBuilder.Entity<Payment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Payments__3213E83F1C9D688D");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.PaymentDate).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Invoice).WithMany(p => p.Payments).HasConstraintName("FK__Payments__invoic__0D7A0286");
        });

        modelBuilder.Entity<Permission>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Permissi__3213E83F3E6F9D88");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
        });

        modelBuilder.Entity<PointHistory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Point_Hi__3213E83F4F177071");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Invoice).WithMany(p => p.PointHistories).HasConstraintName("FK__Point_His__invoi__40058253");

            entity.HasOne(d => d.User).WithMany(p => p.PointHistories)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Point_His__user___3F115E1A");
        });

        modelBuilder.Entity<Review>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Reviews__3213E83F2040F557");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsVisible).HasDefaultValue(true);

            entity.HasOne(d => d.RoomType).WithMany(p => p.Reviews).HasConstraintName("FK__Reviews__room_ty__0E6E26BF");

            entity.HasOne(d => d.User).WithMany(p => p.Reviews).HasConstraintName("FK__Reviews__user_id__0F624AF8");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Roles__3213E83F2CE955FA");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
        });

        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.HasKey(e => new { e.RoleId, e.PermissionId }).HasName("PK__Role_Per__C85A54635AFD9604");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Permission).WithMany(p => p.RolePermissions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Role_Perm__permi__10566F31");

            entity.HasOne(d => d.Role).WithMany(p => p.RolePermissions)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Role_Perm__role___114A936A");
        });

        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Rooms__3213E83F65A6BDD6");

            entity.Property(e => e.CleaningStatus).HasDefaultValue("Clean");
            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Status).HasDefaultValue("Available");

            entity.HasOne(d => d.RoomType).WithMany(p => p.Rooms).HasConstraintName("FK__Rooms__room_type__14270015");
        });

        modelBuilder.Entity<RoomImage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Room_Ima__3213E83F92838867");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.IsPrimary).HasDefaultValue(false);

            entity.HasOne(d => d.RoomType).WithMany(p => p.RoomImages).HasConstraintName("FK__Room_Imag__room___123EB7A3");
        });

        modelBuilder.Entity<RoomInventory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Room_Inv__3213E83F686910FF");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PriceIfLost).HasDefaultValue(0m);
            entity.Property(e => e.Quantity).HasDefaultValue(1);

            entity.HasOne(d => d.Room).WithMany(p => p.RoomInventories).HasConstraintName("FK__Room_Inve__room___1332DBDC");
        });

        modelBuilder.Entity<RoomType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Room_Typ__3213E83FB855C336");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        modelBuilder.Entity<RoomTypeAmenity>(entity =>
        {
            entity.HasKey(e => new { e.RoomTypeId, e.AmenityId }).HasName("PK__RoomType__8CA9DAD6393CF523");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Amenity).WithMany(p => p.RoomTypeAmenities)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RoomType___ameni__151B244E");

            entity.HasOne(d => d.RoomType).WithMany(p => p.RoomTypeAmenities)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__RoomType___room___160F4887");
        });

        modelBuilder.Entity<Service>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Services__3213E83FAB2B8473");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.Category).WithMany(p => p.Services).HasConstraintName("FK__Services__catego__17036CC0");
        });

        modelBuilder.Entity<ServiceCategory>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Service___3213E83FFAEA3B98");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
        });

        modelBuilder.Entity<Shift>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Shifts__3213E83F6C7A9F21");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);

            entity.HasOne(d => d.User).WithMany(p => p.Shifts)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__Shifts__user_id__625A9A57");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3213E83FA7CB9A52");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.LastActivityDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status).HasDefaultValue(true);

            entity.HasOne(d => d.Membership).WithMany(p => p.Users).HasConstraintName("FK__Users__membershi__17F790F9");

            entity.HasOne(d => d.Role).WithMany(p => p.Users).HasConstraintName("FK__Users__role_id__18EBB532");
        });

        modelBuilder.Entity<Voucher>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Vouchers__3213E83F637F2CE3");

            entity.Property(e => e.CreatedAt).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.MaxUsesPerUser).HasDefaultValue(1);
            entity.Property(e => e.MinBookingValue).HasDefaultValue(0m);

            entity.HasOne(d => d.RoomType).WithMany(p => p.Vouchers).HasConstraintName("FK__Vouchers__room_t__3A4CA8FD");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
    public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        // 1. Lấy UserId từ đâu đó (Tạm thời để 1 hoặc lấy từ Claims nếu có)
        // Nếu có dùng HttpContextAccessor thì lấy UserId từ Token ở đây
        int currentUserId = 1; 

        var auditEntries = new List<AuditLog>();
        var entries = ChangeTracker.Entries()
            .Where(e => e.State == EntityState.Added || e.State == EntityState.Modified || e.State == EntityState.Deleted)
            .ToList();

        foreach (var entry in entries)
        {
            if (entry.Entity is AuditLog) continue;

            var log = new AuditLog
            {
                UserId = currentUserId,
                Action = entry.State.ToString().ToUpper(),
                TableName = entry.Metadata.GetTableName(),
                CreatedAt = DateTime.Now,
                
                // Ép kiểu an toàn về số nguyên (int), nếu lỗi hoặc null thì gán bằng 0
                RecordId = int.TryParse(entry.Properties.FirstOrDefault(p => p.Metadata.IsPrimaryKey())?.CurrentValue?.ToString(), out int parsedId) ? parsedId : 0,
                
                OldValue = entry.State == EntityState.Modified || entry.State == EntityState.Deleted 
                        ? System.Text.Json.JsonSerializer.Serialize(entry.OriginalValues.ToObject()) : "{}",
                NewValue = entry.State == EntityState.Added || entry.State == EntityState.Modified 
                        ? System.Text.Json.JsonSerializer.Serialize(entry.CurrentValues.ToObject()) : "{}"
            };
                auditEntries.Add(log);
            }

        // 2. Thêm các dòng log vào bảng AuditLogs
        if (auditEntries.Any())
        {
            await AuditLogs.AddRangeAsync(auditEntries);
        }

        return await base.SaveChangesAsync(cancellationToken);
    }
}

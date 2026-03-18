using System;
using System.Text;
using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

// Khai báo namespace của project (Để nhận diện được DbContext và Services)
using abchotel.Data;
using abchotel.Services;

var builder = WebApplication.CreateBuilder(args);

// ==========================================
// 1. CẤU HÌNH DATABASE (SQL SERVER)
// ==========================================
builder.Services.AddDbContext<HotelDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

// ==========================================
// 2. ĐĂNG KÝ DEPENDENCY INJECTION (SERVICES)
// ==========================================
// Khai báo cho phép sử dụng Controller
builder.Services.AddControllers();

// Nhóm Module 6.1 (Auth, Roles)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IRoleService, RoleService>();
builder.Services.AddScoped<IUserService, UserService>();
// builder.Services.AddScoped<IUserProfileService, UserProfileService>();
// builder.Services.AddScoped<IShiftService, ShiftService>();
// builder.Services.AddScoped<IAuditReportService, AuditReportService>();
// builder.Services.AddScoped<IMediaService, MediaService>();
// builder.Services.AddScoped<IArticleCategoryService, ArticleCategoryService>();
// builder.Services.AddScoped<IArticleService, ArticleService>();
// builder.Services.AddScoped<IAttractionService, AttractionService>();
// builder.Services.AddScoped<IRoomTypeService, RoomTypeService>();
// builder.Services.AddScoped<IRoomService, RoomService>();
// builder.Services.AddScoped<IRoomInventoryService, RoomInventoryService>();
// builder.Services.AddScoped<ILossDamageService, LossDamageService>();
// builder.Services.AddScoped<IAmenityService, AmenityService>();
// builder.Services.AddScoped<IReviewService, ReviewService>();
// // Nhóm Module 2 (Rooms, Vouchers, Loyalty - Của đợt trước)
// builder.Services.AddScoped<IRoomService, RoomService>();
// builder.Services.AddScoped<IVoucherService, VoucherService>();
// builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();

// // Đăng ký Background Workers (Chạy ngầm)
// builder.Services.AddHostedService<RoomHoldCleanupService>();
// builder.Services.AddHostedService<LoyaltyDowngradeWorker>();

// ==========================================
// 3. CẤU HÌNH AUTHENTICATION & JWT (Bảo mật)
// ==========================================
var jwtSettings = builder.Configuration.GetSection("Jwt");
var secretKey = jwtSettings["Key"];

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.RequireHttpsMetadata = false;
    options.SaveToken = true;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey!)),
        ValidateIssuer = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidateAudience = true,
        ValidAudience = jwtSettings["Audience"],
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero // Token hết hạn là bị từ chối ngay lập tức
    };
});

// Cấu hình Policy cho từng Permission
builder.Services.AddAuthorization(options =>
{
    var permissions = new[] { 
        "VIEW_DASHBOARD", "MANAGE_USERS", "MANAGE_ROLES", "MANAGE_ROOMS", 
        "MANAGE_BOOKINGS", "MANAGE_INVOICES", "MANAGE_SERVICES", "VIEW_REPORTS", 
        "MANAGE_CONTENT", "MANAGE_INVENTORY", "MANAGE_SHIFTS", "VIEW_AUDIT_LOGS", "MANAGE_VOUCHERS" 
    };

    foreach (var permission in permissions)
    {
        options.AddPolicy(permission, policy => policy.RequireClaim("Permission", permission));
    }
});

// ==========================================
// 4. CẤU HÌNH CORS (Cho phép Frontend gọi API)
// ==========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// ==========================================
// 5. CẤU HÌNH SWAGGER (Có tích hợp nút ổ khóa nhập Token)
// ==========================================
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "Hotel Management ERP API", 
        Version = "v1",
        Description = "API cho dự án Quản trị Khách sạn (.NET 10)" 
    });

    // Cấu hình nút Ổ khóa để nhập Token
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập Token theo cú pháp: Bearer {Access_Token_Của_Bạn}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// ==========================================
// 6. PIPELINE MIDDLEWARES (Thứ tự rất quan trọng)
// ==========================================
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c => 
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Hotel API v1");
        c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.None); // Thu gọn danh sách API cho gọn
    });
}

// Bật CORS
app.UseCors("AllowAll");

app.UseHttpsRedirection();

// Xác thực (Authentication) phải nằm trước Phân quyền (Authorization)
app.UseAuthentication();
app.UseAuthorization();

// Map các Controller thay vì dùng Minimal API (WeatherForecast)
app.MapControllers();

app.Run();
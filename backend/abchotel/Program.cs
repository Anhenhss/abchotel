using Microsoft.EntityFrameworkCore;
using abchotel.Data;     
using abchotel.Services; 

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<HotelDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IRoomService, RoomService>();
builder.Services.AddScoped<IVoucherService, VoucherService>();
builder.Services.AddScoped<ILoyaltyService, LoyaltyService>();

// Đăng ký Background Service chạy ngầm 
builder.Services.AddHostedService<RoomHoldCleanupService>(); //dọn phòng Hold 
builder.Services.AddHostedService<LoyaltyDowngradeWorker>(); //tự động rớt hạng


var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
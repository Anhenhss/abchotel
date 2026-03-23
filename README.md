# abchotel
Sử dung .NET 10.0 SDK
Bước 1: Chạy SQL create database, use database, execute hết các dữ liệu
Bước 2: Chạy lệnh sau
dotnet tool install --global dotnet-ef
dotnet restore
dotnet clean
dotnet build
 
Bước 3: Nếu Models đã có 20 class rồi thì không cần chạy câu lệnh này
dotnet ef dbcontext scaffold "Server=.\SQLEXPRESS;Database=HotelManagementDB;Trusted_Connection=True;TrustServerCertificate=True;" Microsoft.EntityFrameworkCore.SqlServer -o Models --context-dir Data -c HotelDbContext --namespace abchotel.Models --context-namespace abchotel.Data --data-annotations -f
Bước 4:




Lưu ý: Lúc git clone về là abchotel sẽ bao gồm các mục backend, fontend,... nên khi làm cần:
- Lúc chay các thư viện dotnet, hay chạy chương trình cần cd backend -> cd abchotel rồi mới dotnet
- Lúc lưu cần cd .. rồi cd .. một lần nữa mới git add . -> git commit -m "ghi chi tiết rõ ràng" -> git push
- Dotnet run xong kiểm tra cổng là bao nhiêu xem có trùng với cổng ở api.js không. Nếu không đúng Đổi lại port này theo đúng cổng mà backend ASP.NET Core đang chạy (vd: 5001, 7123...)
const BASE_URL = 'https://localhost:5035/api'; 
- Muốn xem web thì nên Open with Live Server hoặc theo đường link cổng ví dụ https://localhost:5500/index.html  
lưu ý dotnet run phần backend thì fontend mới chạy





THƯ VIỆN không cài đặt nó tự có sẵn khi cùng net
dotnet add package Microsoft.EntityFrameworkCore 
dotnet add package Microsoft.EntityFrameworkCore.Design 
dotnet add package Microsoft.EntityFrameworkCore.SqlServer 
dotnet add package Microsoft.EntityFrameworkCore.Tools 
dotnet add package Microsoft.AspNetCore.Authentication.JwtBearer
dotnet add package BCrypt.Net-Next --version 4.0.3
dotnet add package AutoMapper
dotnet add package Google.Apis.Auth
dotnet add package Swashbuckle.AspNetCore
dotnet add package CloudinaryDotNet
dotnet add package MailKit
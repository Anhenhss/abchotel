using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using abchotel.Data;
using abchotel.DTOs;
using abchotel.Models;
using System.Collections.Generic;

namespace abchotel.Services
{
    public interface IAuthService
    {
        Task<(bool IsSuccess, string Message)> RegisterAsync(RegisterRequest request);
        Task<(bool IsSuccess, string Message, TokenResponse Data)> LoginAsync(LoginRequest request);
        Task<(bool IsSuccess, string Message, TokenResponse Data)> RefreshTokenAsync(RefreshTokenRequest request);
        Task<UserProfileResponse> GetMeAsync(int userId);
        Task<bool> LogoutAsync(int userId);
        Task<(bool IsSuccess, string Message)> ForgotPasswordAsync(string email);
    }

    public class AuthService : IAuthService
    {
        private readonly HotelDbContext _context;
        private readonly IConfiguration _config;
        private readonly IEmailService _emailService;

        public AuthService(HotelDbContext context, IConfiguration config, IEmailService emailService)
        {
            _context = context;
            _config = config;
            _emailService = emailService;
        }

        public async Task<(bool IsSuccess, string Message)> RegisterAsync(RegisterRequest request)
        {
            var userExists = await _context.Users.AnyAsync(u => u.Email == request.Email);
            if (userExists) return (false, "Email này đã được đăng ký sử dụng.");

            var defaultMembership = await _context.Memberships.OrderBy(m => m.MinPoints).FirstOrDefaultAsync();

            var user = new User
            {
                FullName = request.FullName,
                Email = request.Email,
                Phone = request.Phone,
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
                RoleId = request.RoleId != 0 ? request.RoleId : 10, 
                MembershipId = defaultMembership?.Id,
                TotalPoints = 0,
                IsActive = true,
                CreatedAt = DateTime.Now
            };

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return (true, "Đăng ký tài khoản thành công.");
        }

        public async Task<(bool IsSuccess, string Message, TokenResponse Data)> LoginAsync(LoginRequest request)
        {
            var user = await _context.Users
                .Include(u => u.Role)
                .FirstOrDefaultAsync(u => u.Email == request.Email);

            if (user == null || !user.IsActive) 
                return (false, "Tài khoản không tồn tại hoặc đã bị khóa.", null);

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash);
            if (!isPasswordValid) 
                return (false, "Mật khẩu không chính xác.", null);

            // 🔥 TRUY XUẤT QUYỀN HẠN ĐỂ NHÚNG VÀO TOKEN LÚC ĐĂNG NHẬP
            List<string> permissions = new List<string>();
            try
            {
                permissions = await _context.RolePermissions
                    .Where(rp => rp.RoleId == user.RoleId)
                    .Select(rp => rp.Permission.Name)
                    .ToListAsync();
            }
            catch (Exception) { }

            // Gọi hàm sinh Token mới có kèm danh sách quyền
            var jwtToken = GenerateJwtToken(user, permissions);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.Now.AddDays(7);
            await _context.SaveChangesAsync();

            return (true, "Đăng nhập thành công.", new TokenResponse { AccessToken = jwtToken, RefreshToken = refreshToken });
        }

        public async Task<(bool IsSuccess, string Message, TokenResponse Data)> RefreshTokenAsync(RefreshTokenRequest request)
        {
            var principal = GetPrincipalFromExpiredToken(request.AccessToken);
            var userIdStr = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!int.TryParse(userIdStr, out int userId))
                return (false, "Token không hợp lệ.", null);

            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null || user.RefreshToken != request.RefreshToken || user.RefreshTokenExpiry <= DateTime.Now)
                return (false, "Phiên đăng nhập hết hạn hoặc Hộp mã làm mới không hợp lệ.", null);

            // 🔥 LẤY QUYỀN LÚC REFRESH ĐỂ ĐẢM BẢO REALTIME ROLE LUÔN ĐÚNG
            List<string> permissions = new List<string>();
            try
            {
                permissions = await _context.RolePermissions
                    .Where(rp => rp.RoleId == user.RoleId)
                    .Select(rp => rp.Permission.Name)
                    .ToListAsync();
            }
            catch (Exception) { }

            var jwtToken = GenerateJwtToken(user, permissions);
            var refreshToken = GenerateRefreshToken();

            user.RefreshToken = refreshToken;
            user.RefreshTokenExpiry = DateTime.Now.AddDays(7);
            await _context.SaveChangesAsync();

            return (true, "Làm mới Token thành công.", new TokenResponse { AccessToken = jwtToken, RefreshToken = refreshToken });
        }

        public async Task<UserProfileResponse> GetMeAsync(int userId)
        {
            var user = await _context.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null) return null;

            List<string> permissions = new List<string>();
            try
            {
                permissions = await _context.RolePermissions
                    .Where(rp => rp.RoleId == user.RoleId)
                    .Select(rp => rp.Permission.Name)
                    .ToListAsync();
            }
            catch (Exception) { }

            return new UserProfileResponse
            {
                Id = user.Id,
                FullName = user.FullName ?? "",
                Email = user.Email ?? "",
                Phone = user.Phone ?? "", 
                AvatarUrl = user.AvatarUrl ?? "",
                RoleName = user.Role?.Name ?? "Guest",
                Permissions = permissions
            };
        }

        public async Task<bool> LogoutAsync(int userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return false;

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<(bool IsSuccess, string Message)> ForgotPasswordAsync(string email)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
            if (user == null) return (false, "Không tìm thấy tài khoản gắn liền với Email này.");

            string newPassword = "Abc@" + new Random().Next(10000, 99999).ToString();
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(newPassword);
            await _context.SaveChangesAsync();

            string emailBody = $"<h3>Mật khẩu mới của bạn là: {newPassword}</h3><p>Vui lòng đăng nhập và tiến hành đổi lại mật khẩu bảo mật riêng của bạn ngay.</p>";
            await _emailService.SendEmailAsync(user.Email, "Cấp lại mật khẩu - ABC Hotel", emailBody);

            return (true, "Mật khẩu mới đã được gửi vào cấu trúc hộp thư Email của bạn.");
        }

        // 🔥 THÊM THAM SỐ PERMISSIONS ĐỂ ĐÓNG DẤU VÀO TOKEN
        private string GenerateJwtToken(User user, List<string> permissions)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);

            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.FullName ?? ""),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(ClaimTypes.Role, user.Role?.Name ?? ""),
                
                // 🔥 ĐÂY LÀ DÒNG QUAN TRỌNG NHẤT ĐỂ SỬA LỖI 400 DASHBOARD
                new Claim("roleId", user.RoleId.ToString()), 
                
                new Claim(ClaimTypes.MobilePhone, user.Phone ?? ""),
                new Claim("phone", user.Phone ?? "")
            };

            // Đóng dấu các quyền (Permissions) để qua ải 403
            if (permissions != null && permissions.Any())
            {
                foreach (var perm in permissions)
                {
                    claims.Add(new Claim("Permission", perm));
                }
            }

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(Convert.ToDouble(_config["Jwt:DurationInMinutes"] ?? "120")),
                Issuer = _config["Jwt:Issuer"],
                Audience = _config["Jwt:Audience"],
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };

            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
        private string GenerateRefreshToken()
        {
            var randomNumber = new byte[64];
            using var rng = RandomNumberGenerator.Create();
            rng.GetBytes(randomNumber);
            return Convert.ToBase64String(randomNumber);
        }

        private ClaimsPrincipal GetPrincipalFromExpiredToken(string token)
        {
            var tokenValidationParameters = new TokenValidationParameters
            {
                ValidateAudience = false,
                ValidateIssuer = false,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"])),
                ValidateLifetime = false
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var principal = tokenHandler.ValidateToken(token, tokenValidationParameters, out SecurityToken securityToken);
            if (securityToken is not JwtSecurityToken jwtSecurityToken || !jwtSecurityToken.Header.Alg.Equals(SecurityAlgorithms.HmacSha256, StringComparison.InvariantCultureIgnoreCase))
                throw new SecurityTokenException("Mã thông báo không hợp lệ.");

            return principal;
        }
    }
}
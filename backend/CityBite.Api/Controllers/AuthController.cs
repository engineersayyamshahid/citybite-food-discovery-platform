using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>
/// Signup, OTP verification, login and password reset for customers and restaurant owners.
/// Flow: signup -> verify-otp (returns token) -> later: login (returns token).
/// </summary>
[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokens, OtpService otp) : ControllerBase
{
    // ---------------- Signup ----------------

    /// <summary>Customer signup (screen 05). Sends an OTP; the account is active after verify-otp.</summary>
    [HttpPost("signup/customer")]
    public async Task<ActionResult<OtpSentResponse>> SignupCustomer(CustomerSignupRequest req)
    {
        var contact = Contact.Parse(req.EmailOrPhone);
        if (contact == null) return BadRequest(new MessageResponse("Enter a valid email or a mobile number like 03001234567."));

        var existing = await FindUserAsync(contact);
        if (existing != null)
        {
            if (existing.IsVerified) return Conflict(new MessageResponse("An account with this email or number already exists. Please log in."));
            // Unverified earlier signup: refresh details and resend the code.
            existing.FullName = req.FullName.Trim();
            existing.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            await db.SaveChangesAsync();
            return await SendOtpAsync(existing, OtpService.Signup);
        }

        var user = new User
        {
            Role = Roles.Customer,
            FullName = req.FullName.Trim(),
            Email = contact.Email,
            Mobile = contact.Mobile,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            IsVerified = false,
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return await SendOtpAsync(user, OtpService.Signup);
    }

    /// <summary>Restaurant signup (screen 06). Creates the owner account and the restaurant, then sends an OTP.</summary>
    [HttpPost("signup/restaurant")]
    public async Task<ActionResult<OtpSentResponse>> SignupRestaurant(RestaurantSignupRequest req)
    {
        var contact = Contact.Parse(req.EmailOrPhone);
        if (contact == null) return BadRequest(new MessageResponse("Enter a valid email or a mobile number like 03001234567."));

        if (!await db.Areas.AnyAsync(a => a.AreaId == req.AreaId))
            return BadRequest(new MessageResponse("Choose a valid area."));

        if (await FindUserAsync(contact) != null)
            return Conflict(new MessageResponse("An account with this email or number already exists. Please log in."));

        var user = new User
        {
            Role = Roles.RestaurantOwner,
            FullName = req.RestaurantName.Trim(),
            Email = contact.Email,
            Mobile = contact.Mobile,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
            IsVerified = false,
            AreaId = req.AreaId,
        };
        user.Restaurant = new Restaurant
        {
            Name = req.RestaurantName.Trim(),
            AreaId = req.AreaId,
            Address = req.Address.Trim(),
            DineIn = true,
        };
        db.Users.Add(user);           // saves the user and the restaurant together
        await db.SaveChangesAsync();

        return await SendOtpAsync(user, OtpService.Signup);
    }

    // ---------------- OTP ----------------

    /// <summary>Verify the signup code (screens 07/08). On success the account is active and a token is returned.</summary>
    [HttpPost("verify-otp")]
    public async Task<ActionResult<AuthResponse>> VerifyOtp(VerifyOtpRequest req)
    {
        var user = await FindUserAsync(Contact.Parse(req.EmailOrPhone));
        if (user == null) return NotFound(new MessageResponse("No account found for this email or number."));

        if (!await otp.VerifyAsync(user.UserId, OtpService.Signup, req.Code))
            return BadRequest(new MessageResponse("The code is wrong or has expired."));

        user.IsVerified = true;
        await db.SaveChangesAsync();
        return Ok(await BuildAuthResponseAsync(user));
    }

    /// <summary>"Resend code" on the verify screen.</summary>
    [HttpPost("resend-otp")]
    public async Task<ActionResult<OtpSentResponse>> ResendOtp(ResendOtpRequest req)
    {
        var user = await FindUserAsync(Contact.Parse(req.EmailOrPhone));
        if (user == null) return NotFound(new MessageResponse("No account found for this email or number."));
        if (user.IsVerified) return BadRequest(new MessageResponse("This account is already verified. Please log in."));
        return await SendOtpAsync(user, OtpService.Signup);
    }

    // ---------------- Login ----------------

    /// <summary>Login (screens 02/03). Role must match the tab: "customer" or "restaurant_owner".</summary>
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await FindUserAsync(Contact.Parse(req.EmailOrPhone));
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new MessageResponse("Wrong email/number or password."));

        if (user.Role != req.Role)
            return Unauthorized(new MessageResponse(user.Role == Roles.RestaurantOwner
                ? "This is a restaurant account. Use the Restaurant tab."
                : "This is a customer account. Use the Customer tab."));

        if (!user.IsVerified)
            return StatusCode(StatusCodes.Status403Forbidden,
                new MessageResponse("Please verify your number first. Use resend-otp to get a new code."));

        return Ok(await BuildAuthResponseAsync(user));
    }

    // ---------------- Password reset ----------------

    /// <summary>"Send code" on the reset password screen (screen 04).</summary>
    [HttpPost("forgot-password")]
    public async Task<ActionResult<OtpSentResponse>> ForgotPassword(ForgotPasswordRequest req)
    {
        var user = await FindUserAsync(Contact.Parse(req.EmailOrPhone));
        if (user == null) return NotFound(new MessageResponse("No account found for this email or number."));
        return await SendOtpAsync(user, OtpService.Reset);
    }

    /// <summary>Set a new password using the reset code.</summary>
    [HttpPost("reset-password")]
    public async Task<ActionResult<MessageResponse>> ResetPassword(ResetPasswordRequest req)
    {
        var user = await FindUserAsync(Contact.Parse(req.EmailOrPhone));
        if (user == null) return NotFound(new MessageResponse("No account found for this email or number."));

        if (!await otp.VerifyAsync(user.UserId, OtpService.Reset, req.Code))
            return BadRequest(new MessageResponse("The code is wrong or has expired."));

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        user.IsVerified = true;   // they proved they own the number/email
        await db.SaveChangesAsync();
        return Ok(new MessageResponse("Password changed. You can log in now."));
    }

    // ---------------- Current user ----------------

    /// <summary>Who am I? Apps call this on startup with the saved token.</summary>
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> Me()
    {
        var user = await db.Users.Include(u => u.Restaurant)
            .FirstOrDefaultAsync(u => u.UserId == User.GetUserId());
        if (user == null) return Unauthorized();
        return Ok(ToDto(user));
    }

    // ---------------- Helpers ----------------

    private async Task<User?> FindUserAsync(Contact? contact)
    {
        if (contact == null) return null;
        return contact.Email != null
            ? await db.Users.FirstOrDefaultAsync(u => u.Email == contact.Email)
            : await db.Users.FirstOrDefaultAsync(u => u.Mobile == contact.Mobile);
    }

    private async Task<OtpSentResponse> SendOtpAsync(User user, string purpose)
    {
        string code = await otp.CreateAsync(user, purpose);
        return new OtpSentResponse(
            "We sent a verification code.",
            user.Email ?? user.Mobile ?? "",
            otp.ShowInResponse ? code : null);
    }

    private async Task<AuthResponse> BuildAuthResponseAsync(User user)
    {
        await db.Entry(user).Reference(u => u.Restaurant).LoadAsync();
        var (token, expires) = tokens.CreateToken(user, user.Restaurant?.RestaurantId);
        return new AuthResponse(token, expires, ToDto(user));
    }

    private static UserDto ToDto(User u) =>
        new(u.UserId, u.FullName, u.Role, u.Email, u.Mobile, u.AreaId, u.Restaurant?.RestaurantId);
}

/// <summary>Turns "03001234567" / "0300 123 4567" / "Ali@Mail.com" into a normalized email or mobile.</summary>
public record Contact(string? Email, string? Mobile)
{
    public static Contact? Parse(string? input)
    {
        if (string.IsNullOrWhiteSpace(input)) return null;
        input = input.Trim();

        if (input.Contains('@'))
        {
            var email = input.ToLowerInvariant();
            return System.Net.Mail.MailAddress.TryCreate(email, out _) ? new Contact(email, null) : null;
        }

        var digits = new string(input.Where(char.IsDigit).ToArray());
        if (digits.StartsWith("92") && digits.Length == 12) digits = "0" + digits[2..];   // +92 300... -> 0300...
        return digits.Length == 11 && digits.StartsWith("03") ? new Contact(null, digits) : null;
    }
}

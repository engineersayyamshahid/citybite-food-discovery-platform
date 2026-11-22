using System.Security.Cryptography;
using CityBite.Api.Data;
using CityBite.Api.Models;
using CityBite.Api.Options;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace CityBite.Api.Services;

/// <summary>
/// One-time codes for signup verification and password reset.
/// Only a hash of the code is saved in OtpVerifications.
/// Offline: the code is written to the console log (and returned as devOtp when Otp:ShowInResponse = true).
/// </summary>
public class OtpService(AppDbContext db, IOptions<OtpOptions> options, ILogger<OtpService> logger)
{
    public const string Signup = "signup";
    public const string Reset = "reset";

    private readonly OtpOptions _opt = options.Value;

    /// <summary>Creates a new code for the user and returns the plain code (to "send").</summary>
    public async Task<string> CreateAsync(User user, string purpose)
    {
        int max = (int)Math.Pow(10, _opt.Length);
        string code = RandomNumberGenerator.GetInt32(0, max).ToString().PadLeft(_opt.Length, '0');

        db.OtpVerifications.Add(new OtpVerification
        {
            UserId = user.UserId,
            Purpose = purpose,
            CodeHash = BCrypt.Net.BCrypt.HashPassword(code),
            ExpiresAt = DateTime.UtcNow.AddMinutes(_opt.ExpiresMinutes),
        });
        await db.SaveChangesAsync();

        // No SMS/email offline — show the code in the API console instead.
        logger.LogWarning("OTP for user {UserId} ({Contact}) [{Purpose}]: {Code}",
            user.UserId, user.Email ?? user.Mobile, purpose, code);

        return code;
    }

    /// <summary>Checks the latest unused, unexpired code. Marks it used when correct.</summary>
    public async Task<bool> VerifyAsync(int userId, string purpose, string code)
    {
        var otp = await db.OtpVerifications
            .Where(o => o.UserId == userId && o.Purpose == purpose && o.VerifiedAt == null)
            .OrderByDescending(o => o.OtpId)
            .FirstOrDefaultAsync();

        if (otp == null || otp.ExpiresAt < DateTime.UtcNow) return false;
        if (!BCrypt.Net.BCrypt.Verify(code.Trim(), otp.CodeHash)) return false;

        otp.VerifiedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        return true;
    }

    public bool ShowInResponse => _opt.ShowInResponse;
}

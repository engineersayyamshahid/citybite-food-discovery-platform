using System.ComponentModel.DataAnnotations;

namespace CityBite.Api.DTOs;

// ---------- Requests (what the apps send) ----------

/// <summary>Screen 05 "Create your account" (customer).</summary>
public record CustomerSignupRequest(
    [Required, StringLength(120, MinimumLength = 2)] string FullName,
    [Required] string EmailOrPhone,
    [Required, MinLength(6)] string Password);

/// <summary>Screen 06 "Set up your restaurant".</summary>
public record RestaurantSignupRequest(
    [Required, StringLength(120, MinimumLength = 2)] string RestaurantName,
    [Required] int AreaId,
    [Required, StringLength(255, MinimumLength = 3)] string Address,
    [Required] string EmailOrPhone,
    [Required, MinLength(6)] string Password);

/// <summary>Screens 07/08 "Verify your number".</summary>
public record VerifyOtpRequest(
    [Required] string EmailOrPhone,
    [Required] string Code);

public record ResendOtpRequest([Required] string EmailOrPhone);

/// <summary>Screens 02/03 "Log in". Role is "customer" or "restaurant_owner" (the tab the user picked).</summary>
public record LoginRequest(
    [Required] string EmailOrPhone,
    [Required] string Password,
    [Required] string Role);

/// <summary>Screen 04 "Reset password" step 1.</summary>
public record ForgotPasswordRequest([Required] string EmailOrPhone);

/// <summary>Screen 04 "Reset password" step 2: code + new password.</summary>
public record ResetPasswordRequest(
    [Required] string EmailOrPhone,
    [Required] string Code,
    [Required, MinLength(6)] string NewPassword);

// ---------- Responses (what the API returns) ----------

public record UserDto(
    int UserId,
    string FullName,
    string Role,
    string? Email,
    string? Mobile,
    int? AreaId,
    int? RestaurantId);

/// <summary>Returned after login or successful verification. Save Token in the app.</summary>
public record AuthResponse(string Token, DateTime ExpiresAt, UserDto User);

/// <summary>Returned after signup / resend / forgot password.</summary>
public record OtpSentResponse(
    string Message,
    string SentTo,
    string? DevOtp);   // only filled in offline demo mode (Otp:ShowInResponse = true)

public record MessageResponse(string Message);

public record AreaDto(int AreaId, string Name, string City);

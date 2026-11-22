namespace CityBite.Api.Options;

/// <summary>Settings from appsettings.json -> "Jwt".</summary>
public class JwtOptions
{
    public string Key { get; set; } = "";
    public string Issuer { get; set; } = "";
    public string Audience { get; set; } = "";
    public int ExpiresDays { get; set; } = 30;
}

/// <summary>Settings from appsettings.json -> "Otp".</summary>
public class OtpOptions
{
    public int Length { get; set; } = 4;
    public int ExpiresMinutes { get; set; } = 10;

    /// <summary>
    /// Offline demo mode: SMS/email can't be sent without internet, so the code is
    /// returned in the API response (devOtp) and printed in the console. Set false for real use.
    /// </summary>
    public bool ShowInResponse { get; set; } = true;
}

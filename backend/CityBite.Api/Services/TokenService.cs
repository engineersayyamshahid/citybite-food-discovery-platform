using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using CityBite.Api.Models;
using CityBite.Api.Options;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace CityBite.Api.Services;

/// <summary>Creates the JWT that apps send back in "Authorization: Bearer ..." on every request.</summary>
public class TokenService(IOptions<JwtOptions> options)
{
    private readonly JwtOptions _jwt = options.Value;

    public (string Token, DateTime ExpiresAt) CreateToken(User user, int? restaurantId)
    {
        var claims = new List<Claim>
        {
            new(AppClaims.UserId, user.UserId.ToString()),
            new(AppClaims.Role, user.Role),
            new(AppClaims.Name, user.FullName),
        };
        if (restaurantId != null)
            claims.Add(new Claim(AppClaims.RestaurantId, restaurantId.Value.ToString()));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_jwt.Key));
        var expires = DateTime.UtcNow.AddDays(_jwt.ExpiresDays);

        var token = new JwtSecurityToken(
            issuer: _jwt.Issuer,
            audience: _jwt.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256));

        return (new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}

/// <summary>Claim names stored inside the token.</summary>
public static class AppClaims
{
    public const string UserId = "sub";
    public const string Role = "role";
    public const string Name = "name";
    public const string RestaurantId = "restaurant_id";
}

/// <summary>Role values stored in Users.Role.</summary>
public static class Roles
{
    public const string Customer = "customer";
    public const string RestaurantOwner = "restaurant_owner";
}

/// <summary>Helpers to read the logged-in user from a controller (User.GetUserId()).</summary>
public static class ClaimsPrincipalExtensions
{
    public static int GetUserId(this ClaimsPrincipal user) =>
        int.Parse(user.FindFirstValue(AppClaims.UserId)!);

    public static int? GetRestaurantId(this ClaimsPrincipal user) =>
        int.TryParse(user.FindFirstValue(AppClaims.RestaurantId), out var id) ? id : null;
}

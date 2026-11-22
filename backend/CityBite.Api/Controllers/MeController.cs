using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>
/// The logged-in user's own account: profile, password, area (screen 11) and taste picks (screen 10).
/// Works for customers and restaurant owners.
/// </summary>
[ApiController]
[Route("api/me")]
[Authorize]
public class MeController(AppDbContext db) : ControllerBase
{
    // ================= Profile =================

    [HttpGet]
    public async Task<ActionResult<ProfileDto>> Profile()
    {
        int uid = User.GetUserId();
        var p = await db.Users.Where(u => u.UserId == uid)
            .Select(u => new ProfileDto(u.UserId, u.FullName, u.Role, u.Email, u.Mobile, u.AreaId,
                u.Area != null ? u.Area.Name : null,
                u.Restaurant != null ? u.Restaurant.RestaurantId : null,
                u.CreatedAt, u.Reviews.Count, u.FavoriteDishes.Count + u.FavoriteRestaurants.Count))
            .FirstOrDefaultAsync();
        return p == null ? Unauthorized() : p;
    }

    /// <summary>Change the display name. (Email/mobile can't be changed here because that needs a new OTP.)</summary>
    [HttpPut]
    public async Task<ActionResult<ProfileDto>> UpdateProfile(UpdateProfileRequest req)
    {
        int uid = User.GetUserId();
        var user = await db.Users.FirstAsync(u => u.UserId == uid);
        if (user.Role == Roles.RestaurantOwner)
            return BadRequest(new MessageResponse("Change the restaurant name in Restaurant settings."));
        user.FullName = req.FullName.Trim();
        await db.SaveChangesAsync();
        return await Profile();
    }

    [HttpPut("password")]
    public async Task<ActionResult<MessageResponse>> ChangePassword(ChangePasswordRequest req)
    {
        int uid = User.GetUserId();
        var user = await db.Users.FirstAsync(u => u.UserId == uid);
        if (!BCrypt.Net.BCrypt.Verify(req.CurrentPassword, user.PasswordHash))
            return BadRequest(new MessageResponse("Your current password is wrong."));
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.NewPassword);
        await db.SaveChangesAsync();
        return new MessageResponse("Password changed.");
    }

    // ================= Area (screen 11) =================

    [HttpPut("area")]
    public async Task<ActionResult<ProfileDto>> SetArea(SetAreaRequest req)
    {
        if (!await db.Areas.AnyAsync(a => a.AreaId == req.AreaId))
            return BadRequest(new MessageResponse("Choose a valid area."));
        int uid = User.GetUserId();
        var user = await db.Users.FirstAsync(u => u.UserId == uid);
        user.AreaId = req.AreaId;
        await db.SaveChangesAsync();
        return await Profile();
    }

    // ================= Taste picker (screen 10) =================

    [HttpGet("taste")]
    public async Task<ActionResult<TasteDto>> Taste()
    {
        int uid = User.GetUserId();
        var types = await db.Users.Where(u => u.UserId == uid)
            .SelectMany(u => u.FoodTypes).OrderBy(f => f.Name)
            .Select(f => new FoodTypeDto(f.FoodTypeId, f.Name)).ToListAsync();
        return new TasteDto(types.Select(t => t.FoodTypeId).ToList(), types);
    }

    /// <summary>Save the ticked food types (replaces the old picks). These become the chips on Home.</summary>
    [HttpPut("taste")]
    public async Task<ActionResult<TasteDto>> SetTaste(SetTasteRequest req)
    {
        var ids = req.FoodTypeIds.Distinct().ToList();
        var types = await db.FoodTypes.Where(f => ids.Contains(f.FoodTypeId)).ToListAsync();
        if (types.Count != ids.Count) return BadRequest(new MessageResponse("Unknown food type in the list."));

        int uid = User.GetUserId();
        var user = await db.Users.Include(u => u.FoodTypes).FirstAsync(u => u.UserId == uid);
        user.FoodTypes.Clear();
        foreach (var t in types) user.FoodTypes.Add(t);
        await db.SaveChangesAsync();
        return await Taste();
    }
}

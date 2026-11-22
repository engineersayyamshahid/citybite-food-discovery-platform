using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>Home screen (12) and cuisines/food types (taste picker 10, "Browse by cuisine" 13, filters 14).</summary>
[ApiController]
[Route("api")]
public class HomeController(AppDbContext db, BrowseService browse, PromotionService promos) : ControllerBase
{
    /// <summary>
    /// Everything the Home screen needs. Works with or without a token:
    /// with a token the chips are the user's taste picks, without one the most reviewed food types.
    /// Tap a chip -> call again with ?foodTypeId=…
    /// </summary>
    [HttpGet("home")]
    public async Task<ActionResult<HomeDto>> Home([FromQuery] int? foodTypeId)
    {
        int? userId = User.TryGetUserId();
        string? areaName = null;
        var chips = new List<FoodTypeDto>();

        if (userId != null)
        {
            var user = await db.Users.Include(u => u.Area).Include(u => u.FoodTypes)
                .FirstOrDefaultAsync(u => u.UserId == userId);
            areaName = user?.Area?.Name;
            chips = user?.FoodTypes.OrderBy(f => f.Name).Select(f => new FoodTypeDto(f.FoodTypeId, f.Name)).ToList() ?? [];
        }
        if (chips.Count == 0)
        {
            chips = await db.FoodTypes
                .OrderByDescending(f => f.Dishes.Sum(d => d.ReviewCount))
                .Take(3).Select(f => new FoodTypeDto(f.FoodTypeId, f.Name)).ToListAsync();
        }

        int? selected = foodTypeId ?? chips.FirstOrDefault()?.FoodTypeId;
        var top = selected == null ? [] : await browse.ToDishCardsAsync(db.Dishes
            .Where(d => d.FoodTypeId == selected && d.ReviewCount > 0)
            .OrderByDescending(d => d.AvgRating).ThenByDescending(d => d.ReviewCount).ThenBy(d => d.DishId)
            .Take(3));

        var sponsoredIds = await browse.SponsoredRestaurantIdsAsync("home");
        var sponsored = sponsoredIds.Count == 0 ? null
            : (await browse.ToRestaurantCardsAsync(db.Restaurants.Where(r => sponsoredIds.Contains(r.RestaurantId))
                .OrderByDescending(r => r.AvgRating))).FirstOrDefault();
        if (sponsored != null) await promos.CountViewsAsync([sponsored.RestaurantId], "home");

        return new HomeDto(areaName, sponsored, chips, selected, top);
    }

    /// <summary>Cuisines with their food types (taste picker parents and children).</summary>
    [HttpGet("cuisines")]
    public async Task<ActionResult<List<CuisineDto>>> Cuisines() =>
        await db.Cuisines.OrderBy(c => c.CuisineId)
            .Select(c => new CuisineDto(c.CuisineId, c.Name, c.Icon,
                c.FoodTypes.OrderBy(f => f.FoodTypeId).Select(f => new FoodTypeDto(f.FoodTypeId, f.Name)).ToList()))
            .ToListAsync();
}

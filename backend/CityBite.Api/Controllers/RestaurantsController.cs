using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>Restaurant lists (Explore, search "Restaurants" tab) and the restaurant page. No login needed.</summary>
[ApiController]
[Route("api/restaurants")]
public class RestaurantsController(AppDbContext db, BrowseService browse, PromotionService promos) : ControllerBase
{
    /// <summary>
    /// List restaurants. Example: /api/restaurants?q=tabaq&amp;cuisineIds=1&amp;minRating=4&amp;sort=top_rated
    /// sort: top_rated (default) | most_reviewed | name
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<RestaurantCardDto>>> List(
        [FromQuery] string? q, [FromQuery] int[]? cuisineIds, [FromQuery] int? areaId, [FromQuery] decimal? minRating,
        [FromQuery] bool openNow = false, [FromQuery] string sort = "top_rated", [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = (Math.Max(page, 1), Math.Clamp(pageSize, 1, 50));
        IQueryable<Restaurant> query = db.Restaurants;

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(r => r.Name.Contains(term) || r.Dishes.Any(d => d.Name.Contains(term))
                                     || r.Cuisines.Any(c => c.Name.Contains(term)));
        }
        if (cuisineIds is { Length: > 0 }) query = query.Where(r => r.Cuisines.Any(c => cuisineIds.Contains(c.CuisineId)));
        if (areaId != null) query = query.Where(r => r.AreaId == areaId);
        if (minRating != null) query = query.Where(r => r.AvgRating >= minRating);

        IOrderedQueryable<Restaurant> ordered = sort switch
        {
            "most_reviewed" => query.OrderByDescending(r => r.ReviewCount).ThenByDescending(r => r.AvgRating),
            "name" => query.OrderBy(r => r.Name),
            _ => query.OrderByDescending(r => r.AvgRating).ThenByDescending(r => r.ReviewCount),
        };

        if (openNow)
        {
            // Open-now depends on the clock, so it is filtered after loading (fine for a city-sized list).
            var all = await browse.ToRestaurantCardsAsync(ordered.ThenBy(r => r.RestaurantId));
            var open = all.Where(r => r.IsOpenNow).ToList();
            return new PagedResult<RestaurantCardDto>(open.Skip((page - 1) * pageSize).Take(pageSize).ToList(), open.Count, page, pageSize);
        }

        int total = await ordered.CountAsync();
        var items = await browse.ToRestaurantCardsAsync(ordered.ThenBy(r => r.RestaurantId).Skip((page - 1) * pageSize).Take(pageSize));
        return new PagedResult<RestaurantCardDto>(items, total, page, pageSize);
    }

    /// <summary>
    /// Restaurant page: details, hours, all dishes (best rated first) and customer photos.
    /// Opened from a Sponsored card? Add ?src=sponsored so the promotion counts the tap.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<RestaurantDetailDto>> Get(int id, [FromQuery] string? src)
    {
        var r = await db.Restaurants
            .Include(x => x.Area).Include(x => x.Cuisines).Include(x => x.OpeningHours)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.RestaurantId == id);
        if (r == null) return NotFound(new MessageResponse("Restaurant not found."));
        if (src == "sponsored") await promos.CountTapAsync(id);

        var dishes = await browse.ToDishCardsAsync(db.Dishes.Where(d => d.RestaurantId == id)
            .OrderByDescending(d => d.AvgRating).ThenByDescending(d => d.ReviewCount).ThenBy(d => d.DishId));

        var photos = await db.ReviewPhotos.Where(p => p.Review.Dish.RestaurantId == id)
            .OrderByDescending(p => p.PhotoId).Select(p => p.PhotoUrl).Take(8).ToListAsync();

        bool open = BrowseService.IsOpen(r.OpeningHours, DateTime.Now, out var closesAt);
        int? userId = User.TryGetUserId();
        bool fav = userId != null && await db.FavoriteRestaurants.AnyAsync(f => f.UserId == userId && f.RestaurantId == id);

        return new RestaurantDetailDto(r.RestaurantId, r.Name, r.Description, r.Address, r.Area.Name, r.Area.City,
            r.CoverPhotoUrl, r.LogoUrl, r.Cuisines.Select(c => c.Name).OrderBy(n => n).ToList(), r.DineIn,
            r.AvgRating, r.ReviewCount, open, open && closesAt != null ? BrowseService.Format(closesAt.Value) : null,
            r.OpeningHours.OrderBy(h => h.DayOfWeek).Select(BrowseService.ToDto).ToList(),
            dishes, photos, fav);
    }
}

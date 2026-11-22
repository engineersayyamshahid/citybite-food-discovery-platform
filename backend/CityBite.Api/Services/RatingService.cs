using CityBite.Api.Data;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Services;

/// <summary>
/// Keeps the derived columns Dishes.AvgRating/ReviewCount and Restaurants.AvgRating/ReviewCount
/// in sync with the Reviews table. Call after reviews are added or removed.
/// </summary>
public class RatingService(AppDbContext db)
{
    public async Task RecalculateDishesAsync(IEnumerable<int> dishIds)
    {
        var ids = dishIds.Distinct().ToList();
        if (ids.Count == 0) return;

        var stats = await db.Reviews
            .Where(r => ids.Contains(r.DishId))
            .GroupBy(r => r.DishId)
            .Select(g => new { DishId = g.Key, Avg = g.Average(r => (decimal)r.Rating), Count = g.Count() })
            .ToDictionaryAsync(x => x.DishId);

        var dishes = await db.Dishes.Where(d => ids.Contains(d.DishId)).ToListAsync();
        foreach (var d in dishes)
        {
            stats.TryGetValue(d.DishId, out var s);
            d.AvgRating = s == null ? 0 : Math.Round(s.Avg, 2);
            d.ReviewCount = s?.Count ?? 0;
        }

        var restaurantIds = dishes.Select(d => d.RestaurantId).Distinct().ToList();
        await db.SaveChangesAsync();
        await RecalculateRestaurantsAsync(restaurantIds);
    }

    public async Task RecalculateRestaurantsAsync(IEnumerable<int> restaurantIds)
    {
        var ids = restaurantIds.Distinct().ToList();
        if (ids.Count == 0) return;

        var stats = await db.Reviews
            .Where(r => ids.Contains(r.Dish.RestaurantId))
            .GroupBy(r => r.Dish.RestaurantId)
            .Select(g => new { RestaurantId = g.Key, Avg = g.Average(r => (decimal)r.Rating), Count = g.Count() })
            .ToDictionaryAsync(x => x.RestaurantId);

        var restaurants = await db.Restaurants.Where(r => ids.Contains(r.RestaurantId)).ToListAsync();
        foreach (var r in restaurants)
        {
            stats.TryGetValue(r.RestaurantId, out var s);
            r.AvgRating = s == null ? 0 : Math.Round(s.Avg, 2);
            r.ReviewCount = s?.Count ?? 0;
        }
        await db.SaveChangesAsync();
    }

    public async Task RecalculateAllAsync()
    {
        var all = await db.Dishes.Select(d => d.DishId).ToListAsync();
        await RecalculateDishesAsync(all);
    }
}

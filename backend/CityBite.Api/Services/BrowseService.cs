using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Services;

/// <summary>Shared logic for the browse screens: dish/restaurant cards, rankings, sponsored and open-now.</summary>
public class BrowseService(AppDbContext db)
{
    // ---------- Sponsored ----------

    /// <summary>Restaurants with a promotion running today. placement: "home", "search" or null for any.</summary>
    public async Task<HashSet<int>> SponsoredRestaurantIdsAsync(string? placement = null)
    {
        var today = DateOnly.FromDateTime(DateTime.Now);
        var q = db.Promotions.Where(p => p.Status == "active" && p.StartDate <= today && p.EndDate >= today);
        if (placement != null) q = q.Where(p => p.Package.Placement == placement);
        return (await q.Select(p => p.RestaurantId).Distinct().ToListAsync()).ToHashSet();
    }

    // ---------- Rankings ----------

    /// <summary>
    /// Rank of each dish inside its food type across the city (only dishes with reviews are ranked).
    /// Returns dishId -> (rank, how many ranked dishes of that type).
    /// </summary>
    public async Task<Dictionary<int, (int Rank, int OutOf)>> RanksAsync(IEnumerable<int?> foodTypeIds)
    {
        var ids = foodTypeIds.Where(i => i != null).Select(i => i!.Value).Distinct().ToList();
        if (ids.Count == 0) return [];

        var rows = await db.Dishes
            .Where(d => d.FoodTypeId != null && ids.Contains(d.FoodTypeId.Value) && d.ReviewCount > 0)
            .Select(d => new { d.DishId, FoodTypeId = d.FoodTypeId!.Value, d.AvgRating, d.ReviewCount })
            .ToListAsync();

        var result = new Dictionary<int, (int, int)>();
        foreach (var group in rows.GroupBy(r => r.FoodTypeId))
        {
            var ordered = group.OrderByDescending(r => r.AvgRating).ThenByDescending(r => r.ReviewCount).ThenBy(r => r.DishId).ToList();
            for (int i = 0; i < ordered.Count; i++) result[ordered[i].DishId] = (i + 1, ordered.Count);
        }
        return result;
    }

    // ---------- Cards ----------

    private record DishRow(int DishId, string Name, string? PhotoUrl, decimal Price, decimal AvgRating, int ReviewCount,
        bool IsAvailable, int RestaurantId, string RestaurantName, string AreaName, int? FoodTypeId, string? FoodTypeName);

    /// <summary>Runs a dish query and turns the rows into cards with rank and sponsored flags.</summary>
    public async Task<List<DishCardDto>> ToDishCardsAsync(IQueryable<Dish> query)
    {
        var rows = await query.Select(d => new DishRow(d.DishId, d.Name, d.PhotoUrl, d.BasePrice, d.AvgRating, d.ReviewCount,
            d.IsAvailable, d.RestaurantId, d.Restaurant.Name, d.Restaurant.Area.Name, d.FoodTypeId,
            d.FoodType != null ? d.FoodType.Name : null)).ToListAsync();

        var ranks = await RanksAsync(rows.Select(r => r.FoodTypeId));
        var sponsored = await SponsoredRestaurantIdsAsync();

        return rows.Select(r => new DishCardDto(r.DishId, r.Name, r.PhotoUrl, r.Price, r.AvgRating, r.ReviewCount, r.IsAvailable,
            r.RestaurantId, r.RestaurantName, r.AreaName, r.FoodTypeId, r.FoodTypeName,
            ranks.TryGetValue(r.DishId, out var rk) ? rk.Rank : null,
            sponsored.Contains(r.RestaurantId))).ToList();
    }

    /// <summary>Runs a restaurant query and turns the rows into cards with open-now and sponsored flags.</summary>
    public async Task<List<RestaurantCardDto>> ToRestaurantCardsAsync(IQueryable<Restaurant> query)
    {
        var rows = await query.Select(r => new
        {
            r.RestaurantId, r.Name, r.CoverPhotoUrl, r.LogoUrl, AreaName = r.Area.Name,
            Cuisines = r.Cuisines.OrderBy(c => c.Name).Select(c => c.Name).ToList(),
            r.AvgRating, r.ReviewCount, Hours = r.OpeningHours.ToList(),
        }).ToListAsync();

        var sponsored = await SponsoredRestaurantIdsAsync();
        var now = DateTime.Now;
        return rows.Select(r => new RestaurantCardDto(r.RestaurantId, r.Name, r.CoverPhotoUrl, r.LogoUrl, r.AreaName, r.Cuisines,
            r.AvgRating, r.ReviewCount, IsOpen(r.Hours, now, out _), sponsored.Contains(r.RestaurantId))).ToList();
    }

    // ---------- Opening hours ----------

    private static readonly string[] DayNames = ["", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

    /// <summary>1 = Monday ... 7 = Sunday (same as OpeningHours.DayOfWeek).</summary>
    public static byte DayNumber(DateTime t) => (byte)(t.DayOfWeek == DayOfWeek.Sunday ? 7 : (int)t.DayOfWeek);

    /// <summary>Open now? Handles closing after midnight (e.g. 11:00 AM – 12:00 AM).</summary>
    public static bool IsOpen(IEnumerable<OpeningHour> hours, DateTime now, out TimeOnly? closesAt)
    {
        closesAt = null;
        var time = TimeOnly.FromDateTime(now);
        byte today = DayNumber(now);
        byte yesterday = (byte)(today == 1 ? 7 : today - 1);

        foreach (var h in hours)
        {
            if (h.IsClosed || h.OpenTime == null || h.CloseTime == null) continue;
            bool overnight = h.CloseTime <= h.OpenTime;   // closes after midnight
            if (h.DayOfWeek == today && time >= h.OpenTime && (overnight || time < h.CloseTime))
            { closesAt = h.CloseTime; return true; }
            if (h.DayOfWeek == yesterday && overnight && time < h.CloseTime)
            { closesAt = h.CloseTime; return true; }
        }
        return false;
    }

    public static string Format(TimeOnly t) => t.ToString("h:mm tt", System.Globalization.CultureInfo.InvariantCulture);

    public static OpeningHourDto ToDto(OpeningHour h) => new(h.DayOfWeek, DayNames[h.DayOfWeek],
        h.OpenTime is { } o ? Format(o) : null, h.CloseTime is { } c ? Format(c) : null, h.IsClosed);

    /// <summary>"Ayesha Khan" -> "Ayesha K."</summary>
    public static string ShortName(string fullName)
    {
        var parts = fullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
        return parts.Length < 2 ? fullName : $"{parts[0]} {char.ToUpperInvariant(parts[^1][0])}.";
    }
}

public static class ClaimsPrincipalOptionalExtensions
{
    /// <summary>User id when a valid token was sent, otherwise null (for screens that work with or without login).</summary>
    public static int? TryGetUserId(this System.Security.Claims.ClaimsPrincipal user) =>
        int.TryParse(user.FindFirst(AppClaims.UserId)?.Value, out var id) ? id : null;
}

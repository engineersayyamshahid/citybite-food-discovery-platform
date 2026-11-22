using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Services;

/// <summary>
/// Paid promotions. PromotionPackages.Price is the price for 7 days; longer runs get a small discount.
/// Offline project: "payment" is recorded as AmountPaid, no real payment gateway is called.
/// </summary>
public class PromotionService(AppDbContext db)
{
    /// <summary>days -> multiplier of the 7-day price (14 days = 2x, 30 days = 4x instead of ~4.3x).</summary>
    public static readonly Dictionary<int, decimal> Durations = new() { [7] = 1m, [14] = 2m, [30] = 4m };

    public static decimal PriceFor(PromotionPackage p, int days) =>
        Durations.TryGetValue(days, out var m) ? p.Price * m : throw new ApiException(400, "Choose 7, 14 or 30 days.");

    public static DateOnly Today => DateOnly.FromDateTime(DateTime.Now);

    public static string StatusOf(Promotion p) =>
        p.Status == "ended" || p.EndDate < Today ? "ended" : p.StartDate > Today ? "scheduled" : "active";

    public static PromotionDto ToDto(Promotion p)
    {
        string status = StatusOf(p);
        int? day = status == "active" ? Today.DayNumber - p.StartDate.DayNumber + 1 : null;
        return new PromotionDto(p.PromotionId, p.PackageId, p.Package.Name, p.Package.Placement, p.StartDate, p.EndDate,
            p.DurationDays, p.AmountPaid, status, day, p.Views, p.Taps, p.Saves);
    }

    public static string Describe(string placement) => placement == "home"
        ? "Sponsored spot on Home and Explore"
        : "First result for your cuisine searches";

    /// <summary>Start a promotion today (or right after an existing one of the same package).</summary>
    public async Task<Promotion> CreateAsync(int restaurantId, int packageId, int days, bool queueAfterCurrent)
    {
        var package = await db.PromotionPackages.FirstOrDefaultAsync(p => p.PackageId == packageId)
                      ?? throw new ApiException(400, "Unknown package.");
        decimal price = PriceFor(package, days);

        var latest = await db.Promotions
            .Where(p => p.RestaurantId == restaurantId && p.PackageId == packageId && p.Status == "active" && p.EndDate >= Today)
            .OrderByDescending(p => p.EndDate).FirstOrDefaultAsync();

        if (latest != null && !queueAfterCurrent)
            throw new ApiException(409, $"You already have \"{package.Name}\" running until {latest.EndDate:dd MMM}. Use Extend to add more days.");
        if (latest == null && queueAfterCurrent)
            throw new ApiException(400, "This promotion has ended. Start a new one instead.");

        var start = latest == null ? Today : latest.EndDate.AddDays(1);
        var promo = new Promotion
        {
            RestaurantId = restaurantId, PackageId = packageId, DurationDays = (byte)days,
            StartDate = start, EndDate = start.AddDays(days - 1), AmountPaid = price, Status = "active",
        };
        db.Promotions.Add(promo);
        await db.SaveChangesAsync();
        promo.Package = package;
        return promo;
    }

    // ---------- stats ----------

    /// <summary>+1 view for each restaurant whose sponsored item was shown in this placement.</summary>
    public async Task CountViewsAsync(IEnumerable<int> restaurantIds, string placement)
    {
        var ids = restaurantIds.Distinct().ToList();
        if (ids.Count == 0) return;
        var today = Today;
        await db.Promotions
            .Where(p => ids.Contains(p.RestaurantId) && p.Package.Placement == placement && p.Status == "active"
                        && p.StartDate <= today && p.EndDate >= today)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Views, p => p.Views + 1));
    }

    /// <summary>+1 tap when someone opens a sponsored restaurant from its sponsored card.</summary>
    public async Task CountTapAsync(int restaurantId)
    {
        var today = Today;
        await db.Promotions
            .Where(p => p.RestaurantId == restaurantId && p.Status == "active" && p.StartDate <= today && p.EndDate >= today)
            .ExecuteUpdateAsync(s => s.SetProperty(p => p.Taps, p => p.Taps + 1));
    }
}

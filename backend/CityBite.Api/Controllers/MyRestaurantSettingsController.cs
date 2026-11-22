using System.Globalization;
using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>
/// Restaurant side: Profile -> Restaurant settings (details, logo/cover, opening hours)
/// and the "Reviews" tab (ratings & reviews customers left for this restaurant).
/// </summary>
[ApiController]
[Route("api/my-restaurant")]
[Authorize(Roles = Roles.RestaurantOwner)]
public class MyRestaurantSettingsController(AppDbContext db, ImageStorage images) : ControllerBase
{
    private int RestaurantId => User.GetRestaurantId() ?? throw new ApiException(403, "No restaurant is linked to this account.");

    // ================= Details (screen 37) =================

    [HttpGet]
    public async Task<ActionResult<MyRestaurantDto>> Get()
    {
        int rid = RestaurantId;
        var r = await db.Restaurants.Include(x => x.Area).Include(x => x.Cuisines).Include(x => x.Owner)
            .AsSplitQuery().FirstAsync(x => x.RestaurantId == rid);
        return ToDto(r);
    }

    [HttpPut]
    public async Task<ActionResult<MyRestaurantDto>> Update(UpdateRestaurantRequest req)
    {
        int rid = RestaurantId;
        if (!await db.Areas.AnyAsync(a => a.AreaId == req.AreaId)) return BadRequest(new MessageResponse("Choose a valid area."));

        var cuisineIds = req.CuisineIds.Distinct().ToList();
        var cuisines = await db.Cuisines.Where(c => cuisineIds.Contains(c.CuisineId)).ToListAsync();
        if (cuisines.Count == 0) return BadRequest(new MessageResponse("Choose at least one cuisine."));
        if (cuisines.Count != cuisineIds.Count) return BadRequest(new MessageResponse("Unknown cuisine in the list."));

        var r = await db.Restaurants.Include(x => x.Cuisines).Include(x => x.Owner).FirstAsync(x => x.RestaurantId == rid);
        r.Name = req.Name.Trim();
        r.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
        r.Address = req.Address.Trim();
        r.AreaId = req.AreaId;
        r.Owner.FullName = r.Name;       // owner account shows the restaurant name
        r.Cuisines.Clear();
        foreach (var c in cuisines) r.Cuisines.Add(c);
        await db.SaveChangesAsync();
        return await Get();
    }

    /// <summary>"Change logo". multipart/form-data with field "file".</summary>
    [HttpPost("logo")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<PhotoResponse>> Logo(IFormFile file) => await SavePhoto(file, cover: false);

    /// <summary>"Change cover". multipart/form-data with field "file".</summary>
    [HttpPost("cover")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<PhotoResponse>> Cover(IFormFile file) => await SavePhoto(file, cover: true);

    private async Task<ActionResult<PhotoResponse>> SavePhoto(IFormFile file, bool cover)
    {
        int rid = RestaurantId;
        var r = await db.Restaurants.FirstAsync(x => x.RestaurantId == rid);
        string url = await images.SaveAsync(file, "restaurants");
        if (cover) { images.Delete(r.CoverPhotoUrl); r.CoverPhotoUrl = url; }
        else { images.Delete(r.LogoUrl); r.LogoUrl = url; }
        await db.SaveChangesAsync();
        return new PhotoResponse(url);
    }

    // ================= Opening hours (screen 38) =================

    [HttpGet("opening-hours")]
    public async Task<ActionResult<List<OpeningHourDto>>> Hours()
    {
        int rid = RestaurantId;
        var hours = await db.OpeningHours.Where(h => h.RestaurantId == rid).OrderBy(h => h.DayOfWeek).ToListAsync();
        // Days never saved show as closed so the app always gets 7 rows.
        return Enumerable.Range(1, 7).Select(day => hours.FirstOrDefault(h => h.DayOfWeek == day) is { } h
            ? BrowseService.ToDto(h)
            : BrowseService.ToDto(new OpeningHour { DayOfWeek = (byte)day, IsClosed = true })).ToList();
    }

    /// <summary>"Save hours": send all 7 days. Times as "11:00" / "23:30" (or "11:00 AM"). Close "00:00" = midnight.</summary>
    [HttpPut("opening-hours")]
    public async Task<ActionResult<List<OpeningHourDto>>> SaveHours(UpdateOpeningHoursRequest req)
    {
        int rid = RestaurantId;
        if (req.Days.Select(d => d.DayOfWeek).Distinct().Count() != 7)
            return BadRequest(new MessageResponse("Send each day from 1 (Monday) to 7 (Sunday) once."));

        var existing = await db.OpeningHours.Where(h => h.RestaurantId == rid).ToListAsync();
        foreach (var d in req.Days)
        {
            TimeOnly? open = null, close = null;
            if (!d.IsClosed)
            {
                open = ParseTime(d.OpenTime) ?? throw new ApiException(400, $"Day {d.DayOfWeek}: enter an opening time like 11:00.");
                close = ParseTime(d.CloseTime) ?? throw new ApiException(400, $"Day {d.DayOfWeek}: enter a closing time like 23:00.");
                if (open == close) throw new ApiException(400, $"Day {d.DayOfWeek}: opening and closing time can't be the same.");
            }

            var row = existing.FirstOrDefault(h => h.DayOfWeek == d.DayOfWeek);
            if (row == null) db.OpeningHours.Add(row = new OpeningHour { RestaurantId = rid, DayOfWeek = (byte)d.DayOfWeek });
            row.IsClosed = d.IsClosed;
            row.OpenTime = open;
            row.CloseTime = close;
        }
        await db.SaveChangesAsync();
        return await Hours();
    }

    private static TimeOnly? ParseTime(string? s)
    {
        if (string.IsNullOrWhiteSpace(s)) return null;
        string[] formats = ["H:mm", "HH:mm", "h:mm tt", "hh:mm tt", "h tt", "H:mm:ss", "HH:mm:ss"];
        return TimeOnly.TryParseExact(s.Trim(), formats, CultureInfo.InvariantCulture, DateTimeStyles.None, out var t) ? t : null;
    }

    // ================= Ratings & reviews (screen 34) =================

    [HttpGet("reviews")]
    public async Task<ActionResult<MyRestaurantReviewsDto>> Reviews([FromQuery] int? dishId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = (Math.Max(page, 1), Math.Clamp(pageSize, 1, 50));
        int rid = RestaurantId;
        var r = await db.Restaurants.FirstAsync(x => x.RestaurantId == rid);

        var all = db.Reviews.Where(v => v.Dish.RestaurantId == rid);
        var counts = await all.GroupBy(v => v.Rating).Select(g => new { Stars = (int)g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Stars, x => x.Count);
        var breakdown = Enumerable.Range(1, 5).Reverse().ToDictionary(s => s, s => counts.GetValueOrDefault(s));

        var q = dishId == null ? all : all.Where(v => v.DishId == dishId);
        int total = await q.CountAsync();
        var rows = await q.OrderByDescending(v => v.CreatedAt).ThenByDescending(v => v.ReviewId)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(v => new { v.ReviewId, v.User.FullName, v.DishId, DishName = v.Dish.Name, v.Rating, v.Comment,
                               Photos = v.ReviewPhotos.Select(p => p.PhotoUrl).ToList(), v.CreatedAt })
            .ToListAsync();

        var items = rows.Select(v => new MyRestaurantReviewDto(v.ReviewId, BrowseService.ShortName(v.FullName), v.DishId,
            v.DishName, v.Rating, v.Comment, v.Photos, v.CreatedAt)).ToList();
        return new MyRestaurantReviewsDto(r.AvgRating, r.ReviewCount, breakdown, new PagedResult<MyRestaurantReviewDto>(items, total, page, pageSize));
    }

    private static MyRestaurantDto ToDto(Restaurant r) => new(r.RestaurantId, r.Name, r.Description, r.Address, r.AreaId, r.Area.Name,
        r.LogoUrl, r.CoverPhotoUrl, r.Cuisines.OrderBy(c => c.Name).Select(c => c.CuisineId).ToList(),
        r.Cuisines.OrderBy(c => c.Name).Select(c => c.Name).ToList(), r.Owner.Email, r.Owner.Mobile, r.AvgRating, r.ReviewCount);
}

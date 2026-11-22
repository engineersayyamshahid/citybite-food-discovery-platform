using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>Restaurant side: "Promote my restaurant" (screen 39) and "Your promotion" (screen 40).</summary>
[ApiController]
[Route("api")]
public class PromotionsController(AppDbContext db, PromotionService promos) : ControllerBase
{
    private int RestaurantId => User.GetRestaurantId() ?? throw new ApiException(403, "No restaurant is linked to this account.");

    /// <summary>Packages with prices for 7, 14 and 30 days.</summary>
    [HttpGet("promotion-packages")]
    public async Task<ActionResult<List<PromotionPackageDto>>> Packages()
    {
        var packages = await db.PromotionPackages.OrderBy(p => p.Price).ToListAsync();
        return packages.Select(p => new PromotionPackageDto(p.PackageId, p.Name, p.Placement, PromotionService.Describe(p.Placement), p.Price,
            PromotionService.Durations.Keys.Select(d => new DurationOptionDto(d, PromotionService.PriceFor(p, d))).ToList())).ToList();
    }

    /// <summary>All promotions of my restaurant: running and scheduled first, then past ones.</summary>
    [Authorize(Roles = Roles.RestaurantOwner)]
    [HttpGet("my-restaurant/promotions")]
    public async Task<ActionResult<List<PromotionDto>>> Mine()
    {
        int rid = RestaurantId;
        var list = await db.Promotions.Include(p => p.Package).Where(p => p.RestaurantId == rid)
            .OrderByDescending(p => p.EndDate).ThenByDescending(p => p.PromotionId).ToListAsync();
        var order = new Dictionary<string, int> { ["active"] = 0, ["scheduled"] = 1, ["ended"] = 2 };
        return list.Select(PromotionService.ToDto).OrderBy(p => order[p.Status]).ToList();
    }

    [Authorize(Roles = Roles.RestaurantOwner)]
    [HttpGet("my-restaurant/promotions/{id:int}")]
    public async Task<ActionResult<PromotionDto>> One(int id)
    {
        var p = await db.Promotions.Include(x => x.Package).FirstOrDefaultAsync(x => x.PromotionId == id && x.RestaurantId == RestaurantId);
        return p == null ? NotFound(new MessageResponse("Promotion not found.")) : PromotionService.ToDto(p);
    }

    /// <summary>"Pay &amp; promote": starts today. (Offline project: payment is recorded, not charged.)</summary>
    [Authorize(Roles = Roles.RestaurantOwner)]
    [HttpPost("my-restaurant/promotions")]
    public async Task<ActionResult<PromotionDto>> Create(CreatePromotionRequest req)
    {
        var p = await promos.CreateAsync(RestaurantId, req.PackageId, req.DurationDays, queueAfterCurrent: false);
        return CreatedAtAction(nameof(One), new { id = p.PromotionId }, PromotionService.ToDto(p));
    }

    /// <summary>"Extend": adds days right after the current run of the same package (as a scheduled promotion).</summary>
    [Authorize(Roles = Roles.RestaurantOwner)]
    [HttpPost("my-restaurant/promotions/{id:int}/extend")]
    public async Task<ActionResult<PromotionDto>> Extend(int id, ExtendPromotionRequest req)
    {
        var current = await db.Promotions.FirstOrDefaultAsync(x => x.PromotionId == id && x.RestaurantId == RestaurantId);
        if (current == null) return NotFound(new MessageResponse("Promotion not found."));
        var p = await promos.CreateAsync(RestaurantId, current.PackageId, req.DurationDays, queueAfterCurrent: true);
        return PromotionService.ToDto(p);
    }

    /// <summary>"Stop promotion": ends it now (and cancels days already queued after it). No refund.</summary>
    [Authorize(Roles = Roles.RestaurantOwner)]
    [HttpPost("my-restaurant/promotions/{id:int}/stop")]
    public async Task<ActionResult<PromotionDto>> Stop(int id)
    {
        int rid = RestaurantId;
        var p = await db.Promotions.Include(x => x.Package).FirstOrDefaultAsync(x => x.PromotionId == id && x.RestaurantId == rid);
        if (p == null) return NotFound(new MessageResponse("Promotion not found."));
        if (PromotionService.StatusOf(p) == "ended") return BadRequest(new MessageResponse("This promotion has already ended."));

        var today = PromotionService.Today;
        var queued = await db.Promotions.Where(x => x.RestaurantId == rid && x.PackageId == p.PackageId && x.Status == "active"
                                                    && x.StartDate > today && x.PromotionId != id).ToListAsync();
        foreach (var q in queued.Append(p))
        {
            q.Status = "ended";
            if (q.EndDate > today) q.EndDate = q.StartDate > today ? q.StartDate : today;
        }
        await db.SaveChangesAsync();
        return PromotionService.ToDto(p);
    }
}

using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>
/// Restaurant side: "Bill" tab. Only a logged-in restaurant owner can use these,
/// and only for their own restaurant (taken from the token, not from the request).
/// </summary>
[ApiController]
[Route("api/my-restaurant")]
[Authorize(Roles = Roles.RestaurantOwner)]
public class MyRestaurantBillsController(AppDbContext db, BillService bills) : ControllerBase
{
    private int RestaurantId => User.GetRestaurantId() ?? throw new ApiException(403, "No restaurant is linked to this account.");

    /// <summary>Menu for the Generate bill screen (all dishes with sizes; unavailable ones are flagged).</summary>
    [HttpGet("bill-menu")]
    public async Task<ActionResult<List<BillMenuItemDto>>> BillMenu()
    {
        int rid = RestaurantId;
        return await db.Dishes.Where(d => d.RestaurantId == rid)
            .OrderBy(d => d.Category != null ? d.Category.SortOrder : int.MaxValue).ThenBy(d => d.Name)
            .Select(d => new BillMenuItemDto(d.DishId, d.Name, d.Category != null ? d.Category.Name : null, d.PhotoUrl,
                d.IsAvailable, d.BasePrice,
                d.DishSizes.OrderBy(s => s.Price).Select(s => new DishSizeDto(s.SizeId, s.Label, s.Price)).ToList()))
            .ToListAsync();
    }

    /// <summary>Generate bill: saves it and returns the printable bill with its review code.</summary>
    [HttpPost("bills")]
    public async Task<ActionResult<BillDto>> Create(CreateBillRequest req)
    {
        var bill = await bills.CreateAsync(RestaurantId, req);
        return CreatedAtAction(nameof(Get), new { id = bill.BillId }, bill);
    }

    /// <summary>One bill (to show or print again).</summary>
    [HttpGet("bills/{id:int}")]
    public async Task<ActionResult<BillDto>> Get(int id)
    {
        var bill = await bills.GetAsync(RestaurantId, id);
        return bill == null ? NotFound(new MessageResponse("Bill not found.")) : bill;
    }

    /// <summary>Recent bills, newest first.</summary>
    [HttpGet("bills")]
    public async Task<ActionResult<PagedResult<BillSummaryDto>>> List([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = (Math.Max(page, 1), Math.Clamp(pageSize, 1, 50));
        int rid = RestaurantId;
        var q = db.Bills.Where(b => b.RestaurantId == rid);
        int total = await q.CountAsync();
        var items = await q.OrderByDescending(b => b.CreatedAt).ThenByDescending(b => b.BillId)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(b => new BillSummaryDto(b.BillId, b.BillNo, b.TableNo, b.CreatedAt, b.BillItems.Sum(i => i.Qty), b.Total, b.ReviewCode, b.UsedCount))
            .ToListAsync();
        return new PagedResult<BillSummaryDto>(items, total, page, pageSize);
    }
}

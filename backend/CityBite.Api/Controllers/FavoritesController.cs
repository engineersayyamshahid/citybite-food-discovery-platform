using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>
/// Favourites (screen 19) and the heart button on dish/restaurant pages.
/// PUT adds (safe to call twice), DELETE removes.
/// </summary>
[ApiController]
[Route("api/me/favorites")]
[Authorize(Roles = Roles.Customer)]
public class FavoritesController(AppDbContext db, BrowseService browse) : ControllerBase
{
    /// <summary>Both tabs at once, newest first.</summary>
    [HttpGet]
    public async Task<ActionResult<FavoritesDto>> Get()
    {
        int uid = User.GetUserId();
        var dishIds = await db.FavoriteDishes.Where(f => f.UserId == uid).OrderByDescending(f => f.CreatedAt).Select(f => f.DishId).ToListAsync();
        var restIds = await db.FavoriteRestaurants.Where(f => f.UserId == uid).OrderByDescending(f => f.CreatedAt).Select(f => f.RestaurantId).ToListAsync();

        var dishes = await browse.ToDishCardsAsync(db.Dishes.Where(d => dishIds.Contains(d.DishId)));
        var restaurants = await browse.ToRestaurantCardsAsync(db.Restaurants.Where(r => restIds.Contains(r.RestaurantId)));

        // keep the "newest first" order of the favourites
        return new FavoritesDto(
            dishes.OrderBy(d => dishIds.IndexOf(d.DishId)).ToList(),
            restaurants.OrderBy(r => restIds.IndexOf(r.RestaurantId)).ToList());
    }

    [HttpPut("dishes/{dishId:int}")]
    public async Task<IActionResult> AddDish(int dishId)
    {
        int uid = User.GetUserId();
        if (!await db.Dishes.AnyAsync(d => d.DishId == dishId)) return NotFound(new MessageResponse("Dish not found."));
        if (!await db.FavoriteDishes.AnyAsync(f => f.UserId == uid && f.DishId == dishId))
        {
            db.FavoriteDishes.Add(new FavoriteDish { UserId = uid, DishId = dishId, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();
        }
        return NoContent();
    }

    [HttpDelete("dishes/{dishId:int}")]
    public async Task<IActionResult> RemoveDish(int dishId)
    {
        int uid = User.GetUserId();
        await db.FavoriteDishes.Where(f => f.UserId == uid && f.DishId == dishId).ExecuteDeleteAsync();
        return NoContent();
    }

    [HttpPut("restaurants/{restaurantId:int}")]
    public async Task<IActionResult> AddRestaurant(int restaurantId)
    {
        int uid = User.GetUserId();
        if (!await db.Restaurants.AnyAsync(r => r.RestaurantId == restaurantId)) return NotFound(new MessageResponse("Restaurant not found."));
        if (!await db.FavoriteRestaurants.AnyAsync(f => f.UserId == uid && f.RestaurantId == restaurantId))
        {
            db.FavoriteRestaurants.Add(new FavoriteRestaurant { UserId = uid, RestaurantId = restaurantId, CreatedAt = DateTime.UtcNow });
            await db.SaveChangesAsync();

            // promotions count how many people saved a sponsored restaurant
            var today = DateOnly.FromDateTime(DateTime.Now);
            await db.Promotions.Where(p => p.RestaurantId == restaurantId && p.Status == "active" && p.StartDate <= today && p.EndDate >= today)
                .ExecuteUpdateAsync(s => s.SetProperty(p => p.Saves, p => p.Saves + 1));
        }
        return NoContent();
    }

    [HttpDelete("restaurants/{restaurantId:int}")]
    public async Task<IActionResult> RemoveRestaurant(int restaurantId)
    {
        int uid = User.GetUserId();
        await db.FavoriteRestaurants.Where(f => f.UserId == uid && f.RestaurantId == restaurantId).ExecuteDeleteAsync();
        return NoContent();
    }
}

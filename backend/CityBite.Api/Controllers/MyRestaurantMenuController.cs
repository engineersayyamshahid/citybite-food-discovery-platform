using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>
/// Restaurant side: "Menu" tab — categories, dishes, sizes, availability and dish photos.
/// Works only on the logged-in owner's own restaurant.
/// </summary>
[ApiController]
[Route("api/my-restaurant")]
[Authorize(Roles = Roles.RestaurantOwner)]
public class MyRestaurantMenuController(AppDbContext db, ImageStorage images) : ControllerBase
{
    private int RestaurantId => User.GetRestaurantId() ?? throw new ApiException(403, "No restaurant is linked to this account.");

    // ================= Categories (chips: All, Karahi, BBQ, ... "+ New") =================

    [HttpGet("categories")]
    public async Task<ActionResult<List<CategoryDto>>> Categories()
    {
        int rid = RestaurantId;
        return await db.Categories.Where(c => c.RestaurantId == rid)
            .OrderBy(c => c.SortOrder).ThenBy(c => c.Name)
            .Select(c => new CategoryDto(c.CategoryId, c.Name, c.SortOrder, c.Dishes.Count))
            .ToListAsync();
    }

    [HttpPost("categories")]
    public async Task<ActionResult<CategoryDto>> AddCategory(SaveCategoryRequest req)
    {
        int rid = RestaurantId;
        string name = req.Name.Trim();
        if (await db.Categories.AnyAsync(c => c.RestaurantId == rid && c.Name == name))
            return Conflict(new MessageResponse($"You already have a \"{name}\" category."));

        int sort = req.SortOrder ?? (await db.Categories.Where(c => c.RestaurantId == rid).MaxAsync(c => (int?)c.SortOrder) ?? -1) + 1;
        var cat = new Category { RestaurantId = rid, Name = name, SortOrder = sort };
        db.Categories.Add(cat);
        await db.SaveChangesAsync();
        return new CategoryDto(cat.CategoryId, cat.Name, cat.SortOrder, 0);
    }

    [HttpPut("categories/{id:int}")]
    public async Task<ActionResult<CategoryDto>> RenameCategory(int id, SaveCategoryRequest req)
    {
        var cat = await db.Categories.Include(c => c.Dishes).FirstOrDefaultAsync(c => c.CategoryId == id && c.RestaurantId == RestaurantId);
        if (cat == null) return NotFound(new MessageResponse("Category not found."));
        cat.Name = req.Name.Trim();
        if (req.SortOrder != null) cat.SortOrder = req.SortOrder.Value;
        await db.SaveChangesAsync();
        return new CategoryDto(cat.CategoryId, cat.Name, cat.SortOrder, cat.Dishes.Count);
    }

    /// <summary>Deletes a category. Its dishes stay on the menu without a category.</summary>
    [HttpDelete("categories/{id:int}")]
    public async Task<IActionResult> DeleteCategory(int id)
    {
        var cat = await db.Categories.Include(c => c.Dishes).FirstOrDefaultAsync(c => c.CategoryId == id && c.RestaurantId == RestaurantId);
        if (cat == null) return NotFound(new MessageResponse("Category not found."));
        foreach (var d in cat.Dishes) d.CategoryId = null;
        db.Categories.Remove(cat);
        await db.SaveChangesAsync();
        return NoContent();
    }

    // ================= Dishes =================

    /// <summary>"Your menu" list. Filter by category with ?categoryId=…</summary>
    [HttpGet("dishes")]
    public async Task<ActionResult<List<MyDishDto>>> Dishes([FromQuery] int? categoryId)
    {
        int rid = RestaurantId;
        var q = db.Dishes.Where(d => d.RestaurantId == rid);
        if (categoryId != null) q = q.Where(d => d.CategoryId == categoryId);
        return await Project(q.OrderBy(d => d.Category != null ? d.Category.SortOrder : int.MaxValue).ThenBy(d => d.Name)).ToListAsync();
    }

    [HttpGet("dishes/{id:int}")]
    public async Task<ActionResult<MyDishDto>> Dish(int id)
    {
        var dto = await Project(db.Dishes.Where(d => d.DishId == id && d.RestaurantId == RestaurantId)).FirstOrDefaultAsync();
        return dto == null ? NotFound(new MessageResponse("Dish not found.")) : dto;
    }

    /// <summary>"Add dish" (screen 32). Upload the photo afterwards with POST dishes/{id}/photo.</summary>
    [HttpPost("dishes")]
    public async Task<ActionResult<MyDishDto>> AddDish(SaveDishRequest req)
    {
        var dish = new Dish { RestaurantId = RestaurantId };
        await ApplyAsync(dish, req);
        db.Dishes.Add(dish);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(Dish), new { id = dish.DishId }, (await Dish(dish.DishId)).Value);
    }

    /// <summary>Edit a dish, including its sizes (screens 32/33). Sizes already on bills can't be removed.</summary>
    [HttpPut("dishes/{id:int}")]
    public async Task<ActionResult<MyDishDto>> EditDish(int id, SaveDishRequest req)
    {
        var dish = await db.Dishes.Include(d => d.DishSizes).FirstOrDefaultAsync(d => d.DishId == id && d.RestaurantId == RestaurantId);
        if (dish == null) return NotFound(new MessageResponse("Dish not found."));
        await ApplyAsync(dish, req);
        await db.SaveChangesAsync();
        return (await Dish(id)).Value!;
    }

    /// <summary>Quick toggle: Available / Not available.</summary>
    [HttpPatch("dishes/{id:int}/availability")]
    public async Task<ActionResult<MyDishDto>> SetAvailability(int id, SetAvailabilityRequest req)
    {
        var dish = await db.Dishes.FirstOrDefaultAsync(d => d.DishId == id && d.RestaurantId == RestaurantId);
        if (dish == null) return NotFound(new MessageResponse("Dish not found."));
        dish.IsAvailable = req.IsAvailable;
        await db.SaveChangesAsync();
        return (await Dish(id)).Value!;
    }

    /// <summary>
    /// "Delete dish". A dish that is already on bills or reviews can't be deleted (that history must stay);
    /// mark it Not available instead.
    /// </summary>
    [HttpDelete("dishes/{id:int}")]
    public async Task<IActionResult> DeleteDish(int id)
    {
        var dish = await db.Dishes.Include(d => d.DishSizes).Include(d => d.FavoriteDishes)
            .FirstOrDefaultAsync(d => d.DishId == id && d.RestaurantId == RestaurantId);
        if (dish == null) return NotFound(new MessageResponse("Dish not found."));
        if (await db.BillItems.AnyAsync(i => i.DishId == id) || await db.Reviews.AnyAsync(r => r.DishId == id))
            return Conflict(new MessageResponse($"{dish.Name} is already on bills or reviews, so it can't be deleted. Mark it Not available instead."));

        db.DishSizes.RemoveRange(dish.DishSizes);
        db.FavoriteDishes.RemoveRange(dish.FavoriteDishes);
        db.Dishes.Remove(dish);
        await db.SaveChangesAsync();
        images.Delete(dish.PhotoUrl);
        return NoContent();
    }

    /// <summary>"Add photo" on the dish form. multipart/form-data with field "file".</summary>
    [HttpPost("dishes/{id:int}/photo")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<PhotoResponse>> DishPhoto(int id, IFormFile file)
    {
        var dish = await db.Dishes.FirstOrDefaultAsync(d => d.DishId == id && d.RestaurantId == RestaurantId);
        if (dish == null) return NotFound(new MessageResponse("Dish not found."));
        string url = await images.SaveAsync(file, "dishes");
        images.Delete(dish.PhotoUrl);
        dish.PhotoUrl = url;
        await db.SaveChangesAsync();
        return new PhotoResponse(url);
    }

    // ================= Helpers =================

    private static IQueryable<MyDishDto> Project(IQueryable<Dish> q) =>
        q.Select(d => new MyDishDto(d.DishId, d.Name, d.CategoryId, d.Category != null ? d.Category.Name : null,
            d.FoodTypeId, d.FoodType != null ? d.FoodType.Name : null, d.BasePrice, d.Description, d.PhotoUrl, d.IsAvailable,
            d.DishSizes.OrderBy(s => s.Price).Select(s => new DishSizeDto(s.SizeId, s.Label, s.Price)).ToList(),
            d.AvgRating, d.ReviewCount));

    /// <summary>Copies the form into the dish and syncs its sizes.</summary>
    private async Task ApplyAsync(Dish dish, SaveDishRequest req)
    {
        int rid = RestaurantId;
        if (req.CategoryId != null && !await db.Categories.AnyAsync(c => c.CategoryId == req.CategoryId && c.RestaurantId == rid))
            throw new ApiException(400, "Choose one of your own categories.");
        if (req.FoodTypeId != null && !await db.FoodTypes.AnyAsync(f => f.FoodTypeId == req.FoodTypeId))
            throw new ApiException(400, "Unknown food type.");

        var sizes = req.Sizes ?? [];
        if (sizes.Count == 0 && req.BasePrice is null or <= 0)
            throw new ApiException(400, "Enter a price, or add sizes.");
        if (sizes.Select(s => s.Label.Trim().ToLowerInvariant()).Distinct().Count() != sizes.Count)
            throw new ApiException(400, "Two sizes have the same name.");

        dish.Name = req.Name.Trim();
        dish.CategoryId = req.CategoryId;
        dish.FoodTypeId = req.FoodTypeId;
        dish.Description = string.IsNullOrWhiteSpace(req.Description) ? null : req.Description.Trim();
        dish.IsAvailable = req.IsAvailable;

        // --- sizes: update kept ones, add new ones, remove missing ones (unless they are on bills) ---
        var keepIds = sizes.Where(s => s.SizeId != null).Select(s => s.SizeId!.Value).ToHashSet();
        foreach (var old in dish.DishSizes.Where(s => !keepIds.Contains(s.SizeId)).ToList())
        {
            if (await db.BillItems.AnyAsync(i => i.SizeId == old.SizeId))
                throw new ApiException(409, $"Size \"{old.Label}\" is on past bills and can't be removed. You can rename it or change its price.");
            dish.DishSizes.Remove(old);
            db.DishSizes.Remove(old);
        }
        foreach (var s in sizes)
        {
            if (s.SizeId == null)
                dish.DishSizes.Add(new DishSize { Label = s.Label.Trim(), Price = s.Price });
            else
            {
                var existing = dish.DishSizes.FirstOrDefault(x => x.SizeId == s.SizeId)
                               ?? throw new ApiException(400, $"Size {s.SizeId} does not belong to this dish.");
                existing.Label = s.Label.Trim();
                existing.Price = s.Price;
            }
        }

        dish.BasePrice = sizes.Count > 0 ? sizes.Min(s => s.Price) : req.BasePrice!.Value;
    }
}

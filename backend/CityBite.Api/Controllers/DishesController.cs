using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>Dish search/filters (screens 14–18), dish page (21/22) and dish reviews (23). No login needed.</summary>
[ApiController]
[Route("api/dishes")]
public class DishesController(AppDbContext db, BrowseService browse, PromotionService promos) : ControllerBase
{
    /// <summary>
    /// Search and filter dishes.
    /// Example: /api/dishes?q=pizza&amp;cuisineIds=1&amp;cuisineIds=2&amp;minPrice=500&amp;maxPrice=1000&amp;minRating=4&amp;sort=top_rated
    /// sort: top_rated (default) | most_reviewed | price_asc | price_desc
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<PagedResult<DishCardDto>>> Search(
        [FromQuery] string? q, [FromQuery] int[]? cuisineIds, [FromQuery] int? foodTypeId, [FromQuery] int? areaId,
        [FromQuery] int? restaurantId, [FromQuery] decimal? minPrice, [FromQuery] decimal? maxPrice,
        [FromQuery] decimal? minRating, [FromQuery] bool withPhotos = false, [FromQuery] bool availableOnly = false,
        [FromQuery] string sort = "top_rated", [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = (Math.Max(page, 1), Math.Clamp(pageSize, 1, 50));
        IQueryable<Dish> query = db.Dishes;

        if (!string.IsNullOrWhiteSpace(q))
        {
            var term = q.Trim();
            query = query.Where(d => d.Name.Contains(term) || d.Restaurant.Name.Contains(term)
                                     || (d.FoodType != null && d.FoodType.Name.Contains(term)));
        }
        if (cuisineIds is { Length: > 0 })
            query = query.Where(d => (d.FoodType != null && cuisineIds.Contains(d.FoodType.CuisineId))
                                     || (d.FoodType == null && d.Restaurant.Cuisines.Any(c => cuisineIds.Contains(c.CuisineId))));
        if (foodTypeId != null) query = query.Where(d => d.FoodTypeId == foodTypeId);
        if (areaId != null) query = query.Where(d => d.Restaurant.AreaId == areaId);
        if (restaurantId != null) query = query.Where(d => d.RestaurantId == restaurantId);
        if (minPrice != null) query = query.Where(d => d.BasePrice >= minPrice);
        if (maxPrice != null) query = query.Where(d => d.BasePrice <= maxPrice);
        if (minRating != null) query = query.Where(d => d.AvgRating >= minRating);
        if (withPhotos) query = query.Where(d => d.Reviews.Any(r => r.ReviewPhotos.Any()));
        if (availableOnly) query = query.Where(d => d.IsAvailable);

        // "Top of search" promotion: when the user searches or filters by cuisine, that restaurant's
        // available dishes come first. Other lists (e.g. browsing one restaurant) keep the normal order.
        bool isSearch = !string.IsNullOrWhiteSpace(q) || cuisineIds is { Length: > 0 } || foodTypeId != null;
        var boosted = isSearch ? (await browse.SponsoredRestaurantIdsAsync("search")).ToList() : [];

        var first = query.OrderByDescending(d => d.IsAvailable && boosted.Contains(d.RestaurantId));
        IOrderedQueryable<Dish> ordered = sort switch
        {
            "most_reviewed" => first.ThenByDescending(d => d.ReviewCount).ThenByDescending(d => d.AvgRating),
            "price_asc" => first.ThenBy(d => d.BasePrice).ThenByDescending(d => d.AvgRating),
            "price_desc" => first.ThenByDescending(d => d.BasePrice).ThenByDescending(d => d.AvgRating),
            _ => first.ThenByDescending(d => d.AvgRating).ThenByDescending(d => d.ReviewCount),
        };

        int total = await query.CountAsync();
        var items = await browse.ToDishCardsAsync(ordered.ThenBy(d => d.DishId).Skip((page - 1) * pageSize).Take(pageSize));

        // count a view for each "Top of search" restaurant shown in these results
        if (boosted.Count > 0)
            await promos.CountViewsAsync(items.Where(i => boosted.Contains(i.RestaurantId)).Select(i => i.RestaurantId), "search");
        return new PagedResult<DishCardDto>(items, total, page, pageSize);
    }

    /// <summary>Dish page with sizes, rating and city rank.</summary>
    [HttpGet("{id:int}")]
    public async Task<ActionResult<DishDetailDto>> Get(int id)
    {
        var d = await db.Dishes
            .Include(x => x.DishSizes)
            .Include(x => x.FoodType)
            .Include(x => x.Restaurant).ThenInclude(r => r.Area)
            .Include(x => x.Restaurant).ThenInclude(r => r.Cuisines)
            .AsSplitQuery()
            .FirstOrDefaultAsync(x => x.DishId == id);
        if (d == null) return NotFound(new MessageResponse("Dish not found."));

        var ranks = await browse.RanksAsync([d.FoodTypeId]);
        ranks.TryGetValue(d.DishId, out var rank);
        int? userId = User.TryGetUserId();
        bool fav = userId != null && await db.FavoriteDishes.AnyAsync(f => f.UserId == userId && f.DishId == id);

        return new DishDetailDto(d.DishId, d.Name, d.Description, d.PhotoUrl, d.BasePrice,
            d.DishSizes.OrderBy(s => s.Price).Select(s => new DishSizeDto(s.SizeId, s.Label, s.Price)).ToList(),
            d.IsAvailable, d.AvgRating, d.ReviewCount, d.RestaurantId, d.Restaurant.Name, d.Restaurant.Area.Name,
            d.Restaurant.Cuisines.Select(c => c.Name).OrderBy(n => n).ToList(),
            d.FoodTypeId, d.FoodType?.Name,
            rank.Rank == 0 ? null : rank.Rank, rank.OutOf == 0 ? null : rank.OutOf,
            d.Restaurant.Area.City, fav);
    }

    /// <summary>All reviews of a dish with the star breakdown and customer photos. Newest first.</summary>
    [HttpGet("{id:int}/reviews")]
    public async Task<ActionResult<DishReviewsDto>> Reviews(int id, [FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = (Math.Max(page, 1), Math.Clamp(pageSize, 1, 50));
        var d = await db.Dishes.Include(x => x.FoodType).Include(x => x.Restaurant).ThenInclude(r => r.Area)
            .FirstOrDefaultAsync(x => x.DishId == id);
        if (d == null) return NotFound(new MessageResponse("Dish not found."));

        var counts = await db.Reviews.Where(r => r.DishId == id)
            .GroupBy(r => r.Rating).Select(g => new { Stars = (int)g.Key, Count = g.Count() })
            .ToDictionaryAsync(x => x.Stars, x => x.Count);
        var breakdown = Enumerable.Range(1, 5).Reverse().ToDictionary(s => s, s => counts.GetValueOrDefault(s));

        var photos = await db.ReviewPhotos.Where(p => p.Review.DishId == id)
            .OrderByDescending(p => p.PhotoId).Select(p => p.PhotoUrl).Take(8).ToListAsync();

        var reviewsQuery = db.Reviews.Where(r => r.DishId == id);
        int total = await reviewsQuery.CountAsync();
        var rows = await reviewsQuery.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.ReviewId)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new { r.ReviewId, r.User.FullName, r.Rating, r.Comment, Photos = r.ReviewPhotos.Select(p => p.PhotoUrl).ToList(), r.CreatedAt })
            .ToListAsync();
        var items = rows.Select(r => new ReviewDto(r.ReviewId, BrowseService.ShortName(r.FullName), r.Rating, r.Comment, r.Photos, r.CreatedAt, true)).ToList();

        var ranks = await browse.RanksAsync([d.FoodTypeId]);
        ranks.TryGetValue(d.DishId, out var rank);

        return new DishReviewsDto(d.DishId, d.Name, d.AvgRating, d.ReviewCount, breakdown,
            rank.Rank == 0 ? null : rank.Rank, rank.OutOf == 0 ? null : rank.OutOf, d.FoodType?.Name, d.Restaurant.Area.City,
            photos, new PagedResult<ReviewDto>(items, total, page, pageSize));
    }
}

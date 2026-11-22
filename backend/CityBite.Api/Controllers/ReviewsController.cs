using CityBite.Api.Data;
using CityBite.Api.DTOs;
using CityBite.Api.Models;
using CityBite.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CityBite.Api.Controllers;

/// <summary>
/// Customer side of reviews: enter the code from the printed bill, see the dishes on it, rate them,
/// add photos, and list your own reviews (Reviews tab).
/// </summary>
[ApiController]
[Route("api/reviews")]
[Authorize(Roles = Roles.Customer)]
public class ReviewsController(AppDbContext db, RatingService ratings, ImageStorage images) : ControllerBase
{
    private const int MaxPhotosPerReview = 3;

    /// <summary>
    /// "Add review" -> enter bill code (screens 24/25). Links the customer to the bill (one of up to 4 people)
    /// and returns the dishes on it. Calling again with the same code is fine and shows what is left to rate.
    /// </summary>
    [HttpPost("redeem")]
    public async Task<ActionResult<RedeemCodeResponse>> Redeem(RedeemCodeRequest req)
    {
        int userId = User.GetUserId();
        string code = ReviewCodes.Normalize(req.Code);
        if (code.Length != ReviewCodes.Length)
            return BadRequest(new MessageResponse("The bill code has 6 letters and numbers, e.g. K7M4QX."));

        var bill = await db.Bills
            .Include(b => b.Restaurant)
            .Include(b => b.BillItems).ThenInclude(i => i.Dish)
            .Include(b => b.BillItems).ThenInclude(i => i.Size)
            .AsSplitQuery()
            .FirstOrDefaultAsync(b => b.ReviewCode == code);
        if (bill == null) return NotFound(new MessageResponse("No bill found for this code. Check the code on your bill."));

        if (DateTime.UtcNow > bill.CodeExpiresAt)
            return BadRequest(new MessageResponse("This code has expired. Codes work for 7 days after the bill."));

        bool joined = await db.CodeUses.AnyAsync(c => c.BillId == bill.BillId && c.UserId == userId);
        if (!joined)
        {
            if (bill.UsedCount >= bill.MaxReviewers)
                return BadRequest(new MessageResponse($"This code was already used by {bill.MaxReviewers} people."));
            db.CodeUses.Add(new CodeUse { BillId = bill.BillId, UserId = userId, RedeemedAt = DateTime.UtcNow });
            bill.UsedCount++;
            await db.SaveChangesAsync();
        }

        var itemIds = bill.BillItems.Select(i => i.BillItemId).ToList();
        var rated = (await db.Reviews.Where(r => r.UserId == userId && itemIds.Contains(r.BillItemId))
            .Select(r => r.BillItemId).ToListAsync()).ToHashSet();

        return new RedeemCodeResponse(bill.BillId, bill.BillNo, bill.RestaurantId, bill.Restaurant.Name,
            bill.CreatedAt, bill.CodeExpiresAt,
            bill.BillItems.OrderBy(i => i.BillItemId).Select(i => new RateableItemDto(i.BillItemId, i.DishId, i.Dish.Name,
                i.Size?.Label, i.Qty, i.LineTotal, i.Dish.PhotoUrl, rated.Contains(i.BillItemId))).ToList());
    }

    /// <summary>Submit star ratings (and optional comments) for dishes of a redeemed bill (screen 26).</summary>
    [HttpPost]
    public async Task<ActionResult<List<CreatedReviewDto>>> Submit(SubmitReviewsRequest req)
    {
        int userId = User.GetUserId();

        var bill = await db.Bills.Include(b => b.BillItems).FirstOrDefaultAsync(b => b.BillId == req.BillId);
        if (bill == null) return NotFound(new MessageResponse("Bill not found."));
        if (!await db.CodeUses.AnyAsync(c => c.BillId == bill.BillId && c.UserId == userId))
            return StatusCode(403, new MessageResponse("Enter the code from this bill first."));
        if (DateTime.UtcNow > bill.CodeExpiresAt)
            return BadRequest(new MessageResponse("This code has expired. Codes work for 7 days after the bill."));

        if (req.Ratings.Select(r => r.BillItemId).Distinct().Count() != req.Ratings.Count)
            return BadRequest(new MessageResponse("Each dish can be rated only once."));

        var items = bill.BillItems.ToDictionary(i => i.BillItemId);
        var ids = req.Ratings.Select(r => r.BillItemId).ToList();
        var alreadyRated = await db.Reviews.Where(r => r.UserId == userId && ids.Contains(r.BillItemId))
            .Select(r => r.BillItemId).ToListAsync();
        if (alreadyRated.Count > 0)
            return Conflict(new MessageResponse("You already rated some of these dishes."));

        var created = new List<Review>();
        foreach (var r in req.Ratings)
        {
            if (!items.TryGetValue(r.BillItemId, out var item))
                return BadRequest(new MessageResponse($"Item {r.BillItemId} is not on this bill."));
            created.Add(new Review
            {
                UserId = userId, BillItemId = item.BillItemId, DishId = item.DishId, Rating = (byte)r.Rating,
                Comment = string.IsNullOrWhiteSpace(r.Comment) ? null : r.Comment.Trim(), CreatedAt = DateTime.UtcNow,
            });
        }
        db.Reviews.AddRange(created);
        await db.SaveChangesAsync();
        await ratings.RecalculateDishesAsync(created.Select(c => c.DishId));

        return created.Select(c => new CreatedReviewDto(c.ReviewId, c.BillItemId, c.DishId, c.Rating)).ToList();
    }

    /// <summary>Add a photo to one of your reviews ("Add photo"). Send as multipart/form-data with field "file".</summary>
    [HttpPost("{reviewId:int}/photos")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<PhotoResponse>> AddPhoto(int reviewId, IFormFile file)
    {
        int userId = User.GetUserId();
        var review = await db.Reviews.Include(r => r.ReviewPhotos).FirstOrDefaultAsync(r => r.ReviewId == reviewId && r.UserId == userId);
        if (review == null) return NotFound(new MessageResponse("Review not found."));
        if (review.ReviewPhotos.Count >= MaxPhotosPerReview)
            return BadRequest(new MessageResponse($"A review can have up to {MaxPhotosPerReview} photos."));
        string url = await images.SaveAsync(file, "reviews");
        db.ReviewPhotos.Add(new ReviewPhoto { ReviewId = reviewId, PhotoUrl = url });
        await db.SaveChangesAsync();
        return new PhotoResponse(url);
    }

    /// <summary>The customer's own reviews, newest first (Reviews tab).</summary>
    [HttpGet("/api/me/reviews")]
    public async Task<ActionResult<PagedResult<MyReviewDto>>> Mine([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        (page, pageSize) = (Math.Max(page, 1), Math.Clamp(pageSize, 1, 50));
        int userId = User.GetUserId();
        var q = db.Reviews.Where(r => r.UserId == userId);
        int total = await q.CountAsync();
        var items = await q.OrderByDescending(r => r.CreatedAt).ThenByDescending(r => r.ReviewId)
            .Skip((page - 1) * pageSize).Take(pageSize)
            .Select(r => new MyReviewDto(r.ReviewId, r.DishId, r.Dish.Name, r.Dish.PhotoUrl, r.Dish.RestaurantId,
                r.Dish.Restaurant.Name, r.Rating, r.Comment, r.ReviewPhotos.Select(p => p.PhotoUrl).ToList(), r.CreatedAt))
            .ToListAsync();
        return new PagedResult<MyReviewDto>(items, total, page, pageSize);
    }
}

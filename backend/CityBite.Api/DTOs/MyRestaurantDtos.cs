using System.ComponentModel.DataAnnotations;

namespace CityBite.Api.DTOs;

// ---------- Menu (screens 31 "Your menu", 32 "Add dish", 33 "Sizes") ----------

public record CategoryDto(int CategoryId, string Name, int SortOrder, int DishCount);

public record SaveCategoryRequest([Required, StringLength(60, MinimumLength = 1)] string Name, int? SortOrder);

public record SizeRequest(
    int? SizeId,                                            // send the id to keep an existing size, null for a new one
    [Required, StringLength(40, MinimumLength = 1)] string Label,
    [Range(1, 1_000_000)] decimal Price);

/// <summary>
/// Add or edit a dish. If Sizes has items, the dish price is the lowest size price and BasePrice is ignored.
/// If Sizes is empty, BasePrice is required.
/// </summary>
public record SaveDishRequest(
    [Required, StringLength(120, MinimumLength = 2)] string Name,
    int? CategoryId,
    int? FoodTypeId,
    [Range(0, 1_000_000)] decimal? BasePrice,
    [StringLength(500)] string? Description,
    bool IsAvailable,
    List<SizeRequest>? Sizes);

public record SetAvailabilityRequest(bool IsAvailable);

/// <summary>A dish as the restaurant owner sees it in "Your menu".</summary>
public record MyDishDto(
    int DishId,
    string Name,
    int? CategoryId,
    string? CategoryName,
    int? FoodTypeId,
    string? FoodTypeName,
    decimal Price,
    string? Description,
    string? PhotoUrl,
    bool IsAvailable,
    List<DishSizeDto> Sizes,
    decimal AvgRating,
    int ReviewCount);

public record PhotoResponse(string PhotoUrl);

// ---------- Restaurant details (screen 37) ----------

public record MyRestaurantDto(
    int RestaurantId,
    string Name,
    string? Description,
    string Address,
    int AreaId,
    string AreaName,
    string? LogoUrl,
    string? CoverPhotoUrl,
    List<int> CuisineIds,
    List<string> Cuisines,
    string? OwnerEmail,
    string? OwnerMobile,
    decimal AvgRating,
    int ReviewCount);

public record UpdateRestaurantRequest(
    [Required, StringLength(120, MinimumLength = 2)] string Name,
    [StringLength(500)] string? Description,
    [Required, StringLength(255, MinimumLength = 3)] string Address,
    [Required] int AreaId,
    [Required] List<int> CuisineIds);

// ---------- Opening hours (screen 38) ----------

/// <summary>One day. DayOfWeek: 1 = Monday ... 7 = Sunday. Times as "11:00" or "23:30" (24-hour). "00:00" close = midnight.</summary>
public record OpeningHourRequest(
    [Range(1, 7)] int DayOfWeek,
    bool IsClosed,
    string? OpenTime,
    string? CloseTime);

public record UpdateOpeningHoursRequest([Required, MinLength(7), MaxLength(7)] List<OpeningHourRequest> Days);

// ---------- Ratings & reviews (screen 34) ----------

public record MyRestaurantReviewDto(
    int ReviewId,
    string UserName,
    int DishId,
    string DishName,
    int Rating,
    string? Comment,
    List<string> Photos,
    DateTime CreatedAt);

public record MyRestaurantReviewsDto(
    decimal AvgRating,
    int ReviewCount,
    Dictionary<int, int> Breakdown,
    PagedResult<MyRestaurantReviewDto> Reviews);

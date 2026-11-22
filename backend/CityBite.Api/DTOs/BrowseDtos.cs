namespace CityBite.Api.DTOs;

/// <summary>A page of results. Ask for the next page with ?page=2.</summary>
public record PagedResult<T>(List<T> Items, int Total, int Page, int PageSize);

/// <summary>Dish row used in lists: search results, filter results, top rated, favourites.</summary>
public record DishCardDto(
    int DishId,
    string Name,
    string? PhotoUrl,
    decimal Price,              // lowest price (smallest size, or the single price)
    decimal AvgRating,
    int ReviewCount,
    bool IsAvailable,
    int RestaurantId,
    string RestaurantName,
    string AreaName,
    int? FoodTypeId,
    string? FoodTypeName,
    int? Rank,                  // 1 = best rated dish of this food type in the city ("#1 rated karahi")
    bool IsSponsored);

/// <summary>Restaurant row used in lists: Explore, search results, favourites.</summary>
public record RestaurantCardDto(
    int RestaurantId,
    string Name,
    string? CoverPhotoUrl,
    string? LogoUrl,
    string AreaName,
    List<string> Cuisines,
    decimal AvgRating,
    int ReviewCount,
    bool IsOpenNow,
    bool IsSponsored);

public record OpeningHourDto(int DayOfWeek, string Day, string? OpenTime, string? CloseTime, bool IsClosed);

public record DishSizeDto(int SizeId, string Label, decimal Price);

/// <summary>Restaurant page (screen 20).</summary>
public record RestaurantDetailDto(
    int RestaurantId,
    string Name,
    string? Description,
    string Address,
    string AreaName,
    string City,
    string? CoverPhotoUrl,
    string? LogoUrl,
    List<string> Cuisines,
    bool DineIn,
    decimal AvgRating,
    int ReviewCount,
    bool IsOpenNow,
    string? OpenUntil,                 // e.g. "12:00 AM" when open now
    List<OpeningHourDto> OpeningHours,
    List<DishCardDto> Dishes,          // best rated first
    List<string> CustomerPhotos,
    bool IsFavorite);

/// <summary>Dish page (screens 21/22).</summary>
public record DishDetailDto(
    int DishId,
    string Name,
    string? Description,
    string? PhotoUrl,
    decimal Price,
    List<DishSizeDto> Sizes,
    bool IsAvailable,
    decimal AvgRating,
    int ReviewCount,
    int RestaurantId,
    string RestaurantName,
    string AreaName,
    List<string> Cuisines,
    int? FoodTypeId,
    string? FoodTypeName,
    int? Rank,          // "#1 of 9 karahi dishes in Multan" -> Rank = 1, RankOutOf = 9, City = Multan
    int? RankOutOf,
    string City,
    bool IsFavorite);

public record ReviewDto(
    int ReviewId,
    string UserName,     // "Ayesha K."
    byte Rating,
    string? Comment,
    List<string> Photos,
    DateTime CreatedAt,
    bool VerifiedBill);

/// <summary>Dish reviews page (screen 23).</summary>
public record DishReviewsDto(
    int DishId,
    string DishName,
    decimal AvgRating,
    int ReviewCount,
    Dictionary<int, int> Breakdown,   // stars -> count, e.g. { 5: 90, 4: 30, ... }
    int? Rank,
    int? RankOutOf,
    string? FoodTypeName,
    string City,
    List<string> CustomerPhotos,
    PagedResult<ReviewDto> Reviews);

public record FoodTypeDto(int FoodTypeId, string Name);

public record CuisineDto(int CuisineId, string Name, string? Icon, List<FoodTypeDto> FoodTypes);

/// <summary>Home screen (screen 12).</summary>
public record HomeDto(
    string? AreaName,
    RestaurantCardDto? Sponsored,
    List<FoodTypeDto> FoodTypeChips,     // the user's taste picks, or popular types for guests
    int? SelectedFoodTypeId,
    List<DishCardDto> TopForSelected);   // #1, #2, #3 for the selected chip

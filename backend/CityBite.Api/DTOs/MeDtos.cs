using System.ComponentModel.DataAnnotations;

namespace CityBite.Api.DTOs;

/// <summary>Profile screen (customer 28 / restaurant 35).</summary>
public record ProfileDto(
    int UserId,
    string FullName,
    string Role,
    string? Email,
    string? Mobile,
    int? AreaId,
    string? AreaName,
    int? RestaurantId,
    DateTime CreatedAt,
    int ReviewCount,
    int FavoriteCount);

public record UpdateProfileRequest([Required, StringLength(120, MinimumLength = 2)] string FullName);

public record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(6)] string NewPassword);

/// <summary>"Choose your area" (screen 11).</summary>
public record SetAreaRequest([Required] int AreaId);

/// <summary>Taste picker (screen 10): the food types the user ticked. An empty list clears them ("Skip for now").</summary>
public record SetTasteRequest([Required] List<int> FoodTypeIds);

public record TasteDto(List<int> FoodTypeIds, List<FoodTypeDto> FoodTypes);

/// <summary>Favourites screen (19): Dishes tab + Restaurants tab.</summary>
public record FavoritesDto(List<DishCardDto> Dishes, List<RestaurantCardDto> Restaurants);

using System.ComponentModel.DataAnnotations;

namespace CityBite.Api.DTOs;

// ---------- Restaurant: generate bill (screens 28/29) ----------

/// <summary>One line on the "Generate bill" screen. SizeId is required when the dish has sizes.</summary>
public record BillLineRequest(
    [Required] int DishId,
    int? SizeId,
    [Range(1, 99)] int Qty);

/// <summary>Only IDs and quantities — prices are taken from the database, never from the app.</summary>
public record CreateBillRequest(
    [Range(1, 999)] int? TableNo,
    [Required, MinLength(1)] List<BillLineRequest> Items);

public record BillItemDto(
    int BillItemId,
    int DishId,
    string DishName,
    string? SizeLabel,
    int Qty,
    decimal UnitPrice,
    decimal LineTotal);

/// <summary>The saved bill, ready to print (screen 29). ReviewCode goes at the bottom of the printout.</summary>
public record BillDto(
    int BillId,
    int BillNo,
    int? TableNo,
    string RestaurantName,
    string RestaurantAddress,
    DateTime CreatedAt,
    List<BillItemDto> Items,
    decimal Total,
    string ReviewCode,
    DateTime CodeExpiresAt,
    int UsedCount,
    int MaxReviewers);

/// <summary>Short row for the restaurant's bill history.</summary>
public record BillSummaryDto(int BillId, int BillNo, int? TableNo, DateTime CreatedAt, int ItemCount, decimal Total,
                             string ReviewCode, int UsedCount);

/// <summary>Menu for the Generate bill screen: every dish with its sizes.</summary>
public record BillMenuItemDto(
    int DishId,
    string Name,
    string? Category,
    string? PhotoUrl,
    bool IsAvailable,
    decimal Price,
    List<DishSizeDto> Sizes);

// ---------- Customer: redeem code and rate (screens 23–26) ----------

public record RedeemCodeRequest([Required] string Code);

/// <summary>A dish on the bill the customer can rate.</summary>
public record RateableItemDto(
    int BillItemId,
    int DishId,
    string DishName,
    string? SizeLabel,
    int Qty,
    decimal LineTotal,
    string? PhotoUrl,
    bool AlreadyRated);

/// <summary>"Bill found" (screen 25).</summary>
public record RedeemCodeResponse(
    int BillId,
    int BillNo,
    int RestaurantId,
    string RestaurantName,
    DateTime BillDate,
    DateTime CodeExpiresAt,
    List<RateableItemDto> Items);

public record RateItemRequest(
    [Required] int BillItemId,
    [Range(1, 5)] int Rating,
    [StringLength(1000)] string? Comment);

/// <summary>Submit ratings for one or more dishes of a redeemed bill (screen 26).</summary>
public record SubmitReviewsRequest(
    [Required] int BillId,
    [Required, MinLength(1)] List<RateItemRequest> Ratings);

public record CreatedReviewDto(int ReviewId, int BillItemId, int DishId, int Rating);

/// <summary>A review in the customer's Reviews tab (screen 23 in v4 numbering: "Your reviews").</summary>
public record MyReviewDto(
    int ReviewId,
    int DishId,
    string DishName,
    string? DishPhotoUrl,
    int RestaurantId,
    string RestaurantName,
    int Rating,
    string? Comment,
    List<string> Photos,
    DateTime CreatedAt);

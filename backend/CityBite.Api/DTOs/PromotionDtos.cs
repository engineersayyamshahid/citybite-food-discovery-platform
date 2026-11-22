using System.ComponentModel.DataAnnotations;

namespace CityBite.Api.DTOs;

public record DurationOptionDto(int Days, decimal Price);

/// <summary>A package on "Promote my restaurant" (screen 39) with the price for 7, 14 and 30 days.</summary>
public record PromotionPackageDto(
    int PackageId,
    string Name,
    string Placement,          // "home" = Featured on Home, "search" = Top of search
    string Description,
    decimal Price,             // price for 7 days
    List<DurationOptionDto> Durations);

/// <summary>"Pay Rs. 2,000 &amp; promote". DurationDays: 7, 14 or 30.</summary>
public record CreatePromotionRequest(
    [Required] int PackageId,
    [Required] int DurationDays);

/// <summary>"Extend": adds another 7/14/30 days right after the current promotion ends.</summary>
public record ExtendPromotionRequest([Required] int DurationDays);

/// <summary>A promotion with its stats ("Your promotion", screen 40).</summary>
public record PromotionDto(
    int PromotionId,
    int PackageId,
    string PackageName,
    string Placement,
    DateOnly StartDate,
    DateOnly EndDate,          // last day the promotion runs
    int DurationDays,
    decimal AmountPaid,
    string Status,             // scheduled | active | ended
    int? DayNumber,            // "Day 1 of 7" while active
    int Views,
    int Taps,
    int Saves);

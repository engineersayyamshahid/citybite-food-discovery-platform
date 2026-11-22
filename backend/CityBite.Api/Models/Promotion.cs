using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class Promotion
{
    public int PromotionId { get; set; }

    public int RestaurantId { get; set; }

    public int PackageId { get; set; }

    public byte DurationDays { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public decimal AmountPaid { get; set; }

    public string Status { get; set; } = null!;

    public int Views { get; set; }

    public int Taps { get; set; }

    public int Saves { get; set; }

    public virtual PromotionPackage Package { get; set; } = null!;

    public virtual Restaurant Restaurant { get; set; } = null!;
}

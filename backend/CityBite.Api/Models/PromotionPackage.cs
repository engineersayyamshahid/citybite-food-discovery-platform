using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class PromotionPackage
{
    public int PackageId { get; set; }

    public string Name { get; set; } = null!;

    public string Placement { get; set; } = null!;

    public decimal Price { get; set; }

    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();
}

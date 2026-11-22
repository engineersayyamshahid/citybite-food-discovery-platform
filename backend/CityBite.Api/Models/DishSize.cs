using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class DishSize
{
    public int SizeId { get; set; }

    public int DishId { get; set; }

    public string Label { get; set; } = null!;

    public decimal Price { get; set; }

    public virtual ICollection<BillItem> BillItems { get; set; } = new List<BillItem>();

    public virtual Dish Dish { get; set; } = null!;
}

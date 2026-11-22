using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class Category
{
    public int CategoryId { get; set; }

    public int RestaurantId { get; set; }

    public string Name { get; set; } = null!;

    public int SortOrder { get; set; }

    public virtual ICollection<Dish> Dishes { get; set; } = new List<Dish>();

    public virtual Restaurant Restaurant { get; set; } = null!;
}

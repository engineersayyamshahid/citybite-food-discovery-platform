using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class Cuisine
{
    public int CuisineId { get; set; }

    public string Name { get; set; } = null!;

    public string? Icon { get; set; }

    public virtual ICollection<FoodType> FoodTypes { get; set; } = new List<FoodType>();

    public virtual ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();
}

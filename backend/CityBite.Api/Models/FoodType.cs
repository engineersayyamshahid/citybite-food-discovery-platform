using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class FoodType
{
    public int FoodTypeId { get; set; }

    public int CuisineId { get; set; }

    public string Name { get; set; } = null!;

    public virtual Cuisine Cuisine { get; set; } = null!;

    public virtual ICollection<Dish> Dishes { get; set; } = new List<Dish>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}

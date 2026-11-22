using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class FavoriteDish
{
    public int UserId { get; set; }

    public int DishId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Dish Dish { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

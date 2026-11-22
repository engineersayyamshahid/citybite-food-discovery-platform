using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class FavoriteRestaurant
{
    public int UserId { get; set; }

    public int RestaurantId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Restaurant Restaurant { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

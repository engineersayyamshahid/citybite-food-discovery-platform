using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class Dish
{
    public int DishId { get; set; }

    public int RestaurantId { get; set; }

    public int? CategoryId { get; set; }

    public int? FoodTypeId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public decimal BasePrice { get; set; }

    public string? PhotoUrl { get; set; }

    public bool IsAvailable { get; set; }

    public decimal AvgRating { get; set; }

    public int ReviewCount { get; set; }

    public virtual ICollection<BillItem> BillItems { get; set; } = new List<BillItem>();

    public virtual Category? Category { get; set; }

    public virtual ICollection<DishSize> DishSizes { get; set; } = new List<DishSize>();

    public virtual ICollection<FavoriteDish> FavoriteDishes { get; set; } = new List<FavoriteDish>();

    public virtual FoodType? FoodType { get; set; }

    public virtual Restaurant Restaurant { get; set; } = null!;

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();
}

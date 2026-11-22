using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class Restaurant
{
    public int RestaurantId { get; set; }

    public int OwnerId { get; set; }

    public int AreaId { get; set; }

    public string Name { get; set; } = null!;

    public string? Description { get; set; }

    public string Address { get; set; } = null!;

    public string? LogoUrl { get; set; }

    public string? CoverPhotoUrl { get; set; }

    public bool DineIn { get; set; }

    public decimal AvgRating { get; set; }

    public int ReviewCount { get; set; }

    public virtual Area Area { get; set; } = null!;

    public virtual ICollection<Bill> Bills { get; set; } = new List<Bill>();

    public virtual ICollection<Category> Categories { get; set; } = new List<Category>();

    public virtual ICollection<Dish> Dishes { get; set; } = new List<Dish>();

    public virtual ICollection<FavoriteRestaurant> FavoriteRestaurants { get; set; } = new List<FavoriteRestaurant>();

    public virtual ICollection<OpeningHour> OpeningHours { get; set; } = new List<OpeningHour>();

    public virtual User Owner { get; set; } = null!;

    public virtual ICollection<Promotion> Promotions { get; set; } = new List<Promotion>();

    public virtual ICollection<Cuisine> Cuisines { get; set; } = new List<Cuisine>();
}

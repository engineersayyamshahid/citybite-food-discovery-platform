using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class User
{
    public int UserId { get; set; }

    public string Role { get; set; } = null!;

    public string FullName { get; set; } = null!;

    public string? Email { get; set; }

    public string? Mobile { get; set; }

    public string PasswordHash { get; set; } = null!;

    public bool IsVerified { get; set; }

    public int? AreaId { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual Area? Area { get; set; }

    public virtual ICollection<CodeUse> CodeUses { get; set; } = new List<CodeUse>();

    public virtual ICollection<FavoriteDish> FavoriteDishes { get; set; } = new List<FavoriteDish>();

    public virtual ICollection<FavoriteRestaurant> FavoriteRestaurants { get; set; } = new List<FavoriteRestaurant>();

    public virtual ICollection<OtpVerification> OtpVerifications { get; set; } = new List<OtpVerification>();

    public virtual Restaurant? Restaurant { get; set; }

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual ICollection<FoodType> FoodTypes { get; set; } = new List<FoodType>();
}

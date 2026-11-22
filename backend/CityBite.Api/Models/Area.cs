using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class Area
{
    public int AreaId { get; set; }

    public string Name { get; set; } = null!;

    public string City { get; set; } = null!;

    public virtual ICollection<Restaurant> Restaurants { get; set; } = new List<Restaurant>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();
}

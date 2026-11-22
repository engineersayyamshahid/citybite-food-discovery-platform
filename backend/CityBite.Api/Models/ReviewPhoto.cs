using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class ReviewPhoto
{
    public int PhotoId { get; set; }

    public int ReviewId { get; set; }

    public string PhotoUrl { get; set; } = null!;

    public virtual Review Review { get; set; } = null!;
}

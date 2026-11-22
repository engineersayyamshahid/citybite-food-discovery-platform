using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class Review
{
    public int ReviewId { get; set; }

    public int UserId { get; set; }

    public int BillItemId { get; set; }

    public int DishId { get; set; }

    public byte Rating { get; set; }

    public string? Comment { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual BillItem BillItem { get; set; } = null!;

    public virtual Dish Dish { get; set; } = null!;

    public virtual ICollection<ReviewPhoto> ReviewPhotos { get; set; } = new List<ReviewPhoto>();

    public virtual User User { get; set; } = null!;
}

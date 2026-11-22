using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class BillItem
{
    public int BillItemId { get; set; }

    public int BillId { get; set; }

    public int DishId { get; set; }

    public int? SizeId { get; set; }

    public int Qty { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal LineTotal { get; set; }

    public virtual Bill Bill { get; set; } = null!;

    public virtual Dish Dish { get; set; } = null!;

    public virtual ICollection<Review> Reviews { get; set; } = new List<Review>();

    public virtual DishSize? Size { get; set; }
}

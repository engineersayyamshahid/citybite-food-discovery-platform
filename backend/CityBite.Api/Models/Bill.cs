using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class Bill
{
    public int BillId { get; set; }

    public int RestaurantId { get; set; }

    public int BillNo { get; set; }

    public int? TableNo { get; set; }

    public decimal Total { get; set; }

    public string ReviewCode { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public DateTime CodeExpiresAt { get; set; }

    public byte MaxReviewers { get; set; }

    public byte UsedCount { get; set; }

    public virtual ICollection<BillItem> BillItems { get; set; } = new List<BillItem>();

    public virtual ICollection<CodeUse> CodeUses { get; set; } = new List<CodeUse>();

    public virtual Restaurant Restaurant { get; set; } = null!;
}

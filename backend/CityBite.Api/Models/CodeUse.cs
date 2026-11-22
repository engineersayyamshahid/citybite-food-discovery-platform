using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class CodeUse
{
    public int BillId { get; set; }

    public int UserId { get; set; }

    public DateTime RedeemedAt { get; set; }

    public virtual Bill Bill { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}

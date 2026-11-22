using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class OpeningHour
{
    public int HoursId { get; set; }

    public int RestaurantId { get; set; }

    public byte DayOfWeek { get; set; }

    public TimeOnly? OpenTime { get; set; }

    public TimeOnly? CloseTime { get; set; }

    public bool IsClosed { get; set; }

    public virtual Restaurant Restaurant { get; set; } = null!;
}

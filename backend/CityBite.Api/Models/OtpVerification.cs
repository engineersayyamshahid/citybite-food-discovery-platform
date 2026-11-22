using System;
using System.Collections.Generic;

namespace CityBite.Api.Models;

public partial class OtpVerification
{
    public int OtpId { get; set; }

    public int UserId { get; set; }

    public string CodeHash { get; set; } = null!;

    public string Purpose { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public virtual User User { get; set; } = null!;
}

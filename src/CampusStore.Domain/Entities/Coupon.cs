using CampusStore.Domain.Common;
using CampusStore.Domain.Enums;

namespace CampusStore.Domain.Entities;

public sealed class Coupon : Entity
{
    public string Code { get; set; } = string.Empty;

    public DiscountType DiscountType { get; set; }

    public decimal DiscountValue { get; set; }

    public decimal MinimumOrderAmount { get; set; }

    public decimal? MaximumDiscountAmount { get; set; }

    public DateTimeOffset StartAt { get; set; }

    public DateTimeOffset EndAt { get; set; }

    public int UsageLimit { get; set; }

    public int UsedCount { get; set; }

    public bool IsActive { get; set; } = true;

    public bool CanApply(decimal subtotal, DateTimeOffset now)
    {
        return IsActive
            && now >= StartAt
            && now <= EndAt
            && UsedCount < UsageLimit
            && subtotal >= MinimumOrderAmount;
    }
}

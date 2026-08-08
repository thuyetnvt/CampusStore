using CampusStore.Domain.Entities;
using CampusStore.Domain.Enums;

namespace CampusStore.UnitTests.Domain;

public sealed class CouponTests
{
    [Fact]
    public void CanApply_ReturnsTrue_WhenCouponIsActiveAndOrderMeetsRules()
    {
        var now = DateTimeOffset.UtcNow;
        var coupon = new Coupon
        {
            Code = "STUDENT10",
            DiscountType = DiscountType.Percentage,
            DiscountValue = 10,
            MinimumOrderAmount = 100_000,
            StartAt = now.AddDays(-1),
            EndAt = now.AddDays(1),
            UsageLimit = 100,
            UsedCount = 5,
            IsActive = true
        };

        Assert.True(coupon.CanApply(150_000, now));
    }

    [Fact]
    public void CanApply_ReturnsFalse_WhenCouponIsExpired()
    {
        var now = DateTimeOffset.UtcNow;
        var coupon = new Coupon
        {
            Code = "OLD",
            DiscountType = DiscountType.FixedAmount,
            DiscountValue = 20_000,
            MinimumOrderAmount = 100_000,
            StartAt = now.AddDays(-3),
            EndAt = now.AddDays(-1),
            UsageLimit = 100,
            UsedCount = 0,
            IsActive = true
        };

        Assert.False(coupon.CanApply(150_000, now));
    }
}

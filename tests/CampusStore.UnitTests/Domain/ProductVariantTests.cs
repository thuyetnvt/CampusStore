using CampusStore.Domain.Entities;

namespace CampusStore.UnitTests.Domain;

public sealed class ProductVariantTests
{
    [Theory]
    [InlineData(10, 1, true)]
    [InlineData(10, 10, true)]
    [InlineData(10, 11, false)]
    [InlineData(10, 0, false)]
    [InlineData(10, -1, false)]
    public void HasEnoughStock_RequiresPositiveQuantityWithinAvailableStock(
        int stock,
        int quantity,
        bool expected)
    {
        var variant = new ProductVariant { StockQuantity = stock };

        Assert.Equal(expected, variant.HasEnoughStock(quantity));
    }
}

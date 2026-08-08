using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class ProductVariant : Entity
{
    public long ProductId { get; set; }

    public string Sku { get; set; } = string.Empty;

    public string? Color { get; set; }

    public string? Size { get; set; }

    public decimal Price { get; set; }

    public int StockQuantity { get; set; }

    public int LowStockThreshold { get; set; }

    public bool IsActive { get; set; } = true;

    public bool HasEnoughStock(int quantity)
    {
        return quantity > 0 && StockQuantity >= quantity;
    }
}

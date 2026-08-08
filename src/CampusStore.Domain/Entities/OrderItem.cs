using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class OrderItem : Entity
{
    public long OrderId { get; set; }

    public long? ProductVariantId { get; set; }

    public string ProductName { get; set; } = string.Empty;

    public string Sku { get; set; } = string.Empty;

    public string VariantDescription { get; set; } = string.Empty;

    public decimal UnitPrice { get; set; }

    public int Quantity { get; set; }

    public decimal LineTotal { get; set; }
}

using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class CartItem : AuditableEntity
{
    public long CartId { get; set; }

    public long ProductVariantId { get; set; }

    public int Quantity { get; set; }
}

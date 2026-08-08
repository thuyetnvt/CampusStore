using CampusStore.Domain.Common;
using CampusStore.Domain.Enums;

namespace CampusStore.Domain.Entities;

public sealed class OrderStatusHistory : Entity
{
    public long OrderId { get; set; }

    public OrderStatus OldStatus { get; set; }

    public OrderStatus NewStatus { get; set; }

    public long ChangedByUserId { get; set; }

    public string? Note { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}

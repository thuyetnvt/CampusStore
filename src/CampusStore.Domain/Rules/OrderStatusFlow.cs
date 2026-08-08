using CampusStore.Domain.Enums;

namespace CampusStore.Domain.Rules;

public static class OrderStatusFlow
{
    private static readonly IReadOnlyDictionary<OrderStatus, OrderStatus[]> AllowedTransitions =
        new Dictionary<OrderStatus, OrderStatus[]>
        {
            [OrderStatus.Pending] = [OrderStatus.Confirmed, OrderStatus.Cancelled],
            [OrderStatus.Confirmed] = [OrderStatus.Preparing, OrderStatus.Cancelled],
            [OrderStatus.Preparing] = [OrderStatus.Shipping, OrderStatus.Cancelled],
            [OrderStatus.Shipping] = [OrderStatus.Completed],
            [OrderStatus.Completed] = [],
            [OrderStatus.Cancelled] = []
        };

    public static bool CanTransition(OrderStatus currentStatus, OrderStatus nextStatus)
    {
        return AllowedTransitions.TryGetValue(currentStatus, out var nextStatuses)
            && nextStatuses.Contains(nextStatus);
    }
}

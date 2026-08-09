using CampusStore.Domain.Enums;

namespace CampusStore.Domain.Rules;

public static class OrderStatusFlow
{
    private const int LegacyHiddenStatus = 3;

    private static readonly IReadOnlyDictionary<OrderStatus, OrderStatus[]> AllowedTransitions =
        new Dictionary<OrderStatus, OrderStatus[]>
        {
            [OrderStatus.Pending] = [OrderStatus.Confirmed, OrderStatus.Cancelled],
            [OrderStatus.Confirmed] = [OrderStatus.Shipping, OrderStatus.Cancelled],
            [OrderStatus.Shipping] = [OrderStatus.Completed],
            [OrderStatus.Completed] = [],
            [OrderStatus.Cancelled] = []
        };

    public static bool CanTransition(OrderStatus currentStatus, OrderStatus nextStatus)
    {
        var normalizedCurrentStatus = NormalizeLegacyStatus(currentStatus);

        return AllowedTransitions.TryGetValue(normalizedCurrentStatus, out var nextStatuses)
            && nextStatuses.Contains(nextStatus);
    }

    private static OrderStatus NormalizeLegacyStatus(OrderStatus status)
    {
        return (int)status == LegacyHiddenStatus ? OrderStatus.Shipping : status;
    }
}

namespace CampusStore.Domain.Enums;

public enum OrderStatus
{
    Pending = 1,
    Confirmed = 2,
    [Obsolete("Only kept so EF can read legacy database rows. Do not expose or select this status.")]
    Preparing = 3,
    Shipping = 4,
    Completed = 5,
    Cancelled = 6
}

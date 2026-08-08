using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class Address : Entity
{
    public long UserId { get; set; }

    public string ReceiverName { get; set; } = string.Empty;

    public string Phone { get; set; } = string.Empty;

    public string Province { get; set; } = string.Empty;

    public string District { get; set; } = string.Empty;

    public string Ward { get; set; } = string.Empty;

    public string Detail { get; set; } = string.Empty;

    public bool IsDefault { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}

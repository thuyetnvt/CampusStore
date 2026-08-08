using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class AuditLog : Entity
{
    public long? UserId { get; set; }

    public string Action { get; set; } = string.Empty;

    public string EntityType { get; set; } = string.Empty;

    public long EntityId { get; set; }

    public string? OldValues { get; set; }

    public string? NewValues { get; set; }

    public string? IpAddress { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}

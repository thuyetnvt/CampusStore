using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class Review : AuditableEntity
{
    public long UserId { get; set; }

    public long OrderItemId { get; set; }

    public long ProductId { get; set; }

    public int Rating { get; set; }

    public string? Comment { get; set; }

    public bool IsVisible { get; set; } = true;
}

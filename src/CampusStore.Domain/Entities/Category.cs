using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class Category : AuditableEntity
{
    public long? ParentId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string? Description { get; set; }

    public bool IsActive { get; set; } = true;
}

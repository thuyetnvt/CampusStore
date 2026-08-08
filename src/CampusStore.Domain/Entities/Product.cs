using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class Product : AuditableEntity
{
    public long CategoryId { get; set; }

    public string Name { get; set; } = string.Empty;

    public string Slug { get; set; } = string.Empty;

    public string Description { get; set; } = string.Empty;

    public decimal BasePrice { get; set; }

    public decimal? SalePrice { get; set; }

    public bool IsActive { get; set; } = true;
}

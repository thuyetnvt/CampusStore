using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class ProductImage : Entity
{
    public long ProductId { get; set; }

    public string ImageUrl { get; set; } = string.Empty;

    public string AltText { get; set; } = string.Empty;

    public int SortOrder { get; set; }

    public bool IsPrimary { get; set; }
}

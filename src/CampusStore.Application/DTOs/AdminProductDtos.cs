namespace CampusStore.Application.Dtos;

public sealed record AdminProductListItemDto(
    long Id,
    string Name,
    string Slug,
    long CategoryId,
    string CategoryName,
    string Description,
    decimal BasePrice,
    decimal? SalePrice,
    bool IsActive,
    int TotalStock,
    int VariantCount,
    string? PrimaryImageUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record AdminProductDetailDto(
    long Id,
    string Name,
    string Slug,
    long CategoryId,
    string CategoryName,
    string Description,
    decimal BasePrice,
    decimal? SalePrice,
    bool IsActive,
    int TotalStock,
    int VariantCount,
    string? PrimaryImageUrl,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record AdminProductUpsertRequest(
    string Name,
    string Slug,
    long CategoryId,
    string Description,
    decimal BasePrice,
    decimal? SalePrice,
    bool IsActive
);

public sealed record AdminProductActiveRequest(bool IsActive);

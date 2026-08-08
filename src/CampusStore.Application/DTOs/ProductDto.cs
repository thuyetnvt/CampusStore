namespace CampusStore.Application.Dtos;

public sealed record ProductDto(
    long Id,
    string Name,
    string Slug,
    decimal BasePrice,
    decimal? SalePrice,
    bool IsActive
);

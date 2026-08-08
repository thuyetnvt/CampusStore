namespace CampusStore.Application.Dtos;

public sealed record ProductVariantDto(
    long Id,
    long ProductId,
    string Sku,
    string? Color,
    string? Size,
    decimal Price,
    int StockQuantity,
    int LowStockThreshold,
    bool IsActive
);

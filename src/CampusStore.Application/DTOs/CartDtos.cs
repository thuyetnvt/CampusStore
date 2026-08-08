namespace CampusStore.Application.Dtos;

public sealed record CartDto(
    long Id,
    IReadOnlyList<CartItemDto> Items,
    decimal Subtotal,
    int TotalQuantity
);

public sealed record CartItemDto(
    long Id,
    long ProductId,
    long ProductVariantId,
    string ProductName,
    string ProductSlug,
    string Sku,
    string? Color,
    string? Size,
    decimal UnitPrice,
    int Quantity,
    int StockQuantity,
    string? PrimaryImageUrl,
    decimal LineTotal
);

public sealed record AddCartItemRequest(long ProductVariantId, int Quantity);

public sealed record UpdateCartItemRequest(int Quantity);

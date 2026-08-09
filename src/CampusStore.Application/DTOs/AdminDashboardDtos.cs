using CampusStore.Domain.Enums;

namespace CampusStore.Application.Dtos;

public sealed record AdminDashboardDto(
    decimal CompletedRevenue,
    int TotalOrders,
    int PendingOrders,
    int CompletedOrders,
    int CancelledOrders,
    int TotalProducts,
    int LowStockVariants,
    int TotalCustomers,
    IReadOnlyList<OrderStatusCountDto> OrdersByStatus,
    IReadOnlyList<TopProductDto> TopProducts,
    IReadOnlyList<LowStockVariantDto> LowStockItems,
    IReadOnlyList<AdminOrderListItemDto> RecentOrders,
    IReadOnlyList<AdminDashboardTrendPointDto> TrendPoints,
    string TrendRange
);

public sealed record OrderStatusCountDto(OrderStatus Status, int Count);

public sealed record TopProductDto(long ProductId, string ProductName, int QuantitySold, decimal Revenue);

public sealed record LowStockVariantDto(
    long ProductId,
    long ProductVariantId,
    string ProductName,
    string Sku,
    int StockQuantity,
    int LowStockThreshold
);

public sealed record AdminDashboardTrendPointDto(
    string Label,
    decimal Revenue,
    int OrderCount
);

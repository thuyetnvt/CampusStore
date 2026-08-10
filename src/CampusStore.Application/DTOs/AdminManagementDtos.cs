using CampusStore.Domain.Enums;

namespace CampusStore.Application.Dtos;

public sealed record AdminCategoryListItemDto(
    long Id,
    string Name,
    string Slug,
    string? Description,
    bool IsActive,
    long? ParentId,
    int ProductCount,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record AdminCategoryUpsertRequest(
    string Name,
    string Slug,
    string? Description,
    long? ParentId,
    bool IsActive
);

public sealed record AdminCategoryActiveRequest(bool IsActive);

public sealed record AdminInventoryItemDto(
    long ProductId,
    long ProductVariantId,
    string ProductName,
    string CategoryName,
    string Sku,
    string? Color,
    string? Size,
    decimal Price,
    int StockQuantity,
    int LowStockThreshold,
    bool IsActive,
    string StockStatus
);

public sealed record AdminInventoryUpdateRequest(
    int StockQuantity,
    int LowStockThreshold,
    bool IsActive,
    string? Reason
);

public sealed record AdminCustomerListItemDto(
    long Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    UserStatus Status,
    int OrderCount,
    decimal TotalSpent,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record AdminUserListItemDto(
    long Id,
    string FullName,
    string Email,
    string? PhoneNumber,
    UserStatus Status,
    IReadOnlyList<string> Roles,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UpdatedAt
);

public sealed record AdminUserStatusRequest(UserStatus Status);

public sealed record AdminUserRolesRequest(IReadOnlyList<string> Roles);

public sealed record AdminCreateStaffRequest(
    string FullName,
    string Email,
    string? PhoneNumber,
    string Password,
    IReadOnlyList<string>? Roles
);

public sealed record AdminCouponListItemDto(
    long Id,
    string Code,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal MinimumOrderAmount,
    decimal? MaximumDiscountAmount,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    int UsageLimit,
    int UsedCount,
    bool IsActive,
    string Status
);

public sealed record AdminCouponUpsertRequest(
    string Code,
    DiscountType DiscountType,
    decimal DiscountValue,
    decimal MinimumOrderAmount,
    decimal? MaximumDiscountAmount,
    DateTimeOffset StartAt,
    DateTimeOffset EndAt,
    int UsageLimit,
    bool IsActive
);

public sealed record AdminCouponActiveRequest(bool IsActive);

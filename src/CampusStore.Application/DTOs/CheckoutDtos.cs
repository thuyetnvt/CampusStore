using CampusStore.Domain.Enums;

namespace CampusStore.Application.Dtos;

public sealed record CheckoutPreviewRequest(string? CouponCode);

public sealed record CheckoutPreviewDto(
    IReadOnlyList<CartItemDto> Items,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal ShippingFee,
    decimal TotalAmount,
    string? CouponCode,
    string? CouponMessage
);

public sealed record CreateOrderRequest(
    string ReceiverName,
    string ReceiverPhone,
    string ShippingAddress,
    PaymentMethod PaymentMethod,
    string? CouponCode,
    string? Note
);

public sealed record OrderCreatedDto(long Id, string OrderCode, decimal TotalAmount);

public sealed record OrderListItemDto(
    long Id,
    string OrderCode,
    decimal TotalAmount,
    OrderStatus OrderStatus,
    PaymentStatus PaymentStatus,
    DateTimeOffset CreatedAt,
    int TotalQuantity
);

public sealed record OrderDetailDto(
    long Id,
    string OrderCode,
    string ReceiverName,
    string ReceiverPhone,
    string ShippingAddress,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal ShippingFee,
    decimal TotalAmount,
    PaymentMethod PaymentMethod,
    PaymentStatus PaymentStatus,
    OrderStatus OrderStatus,
    string? Note,
    string? CancellationReason,
    DateTimeOffset CreatedAt,
    IReadOnlyList<OrderItemDto> Items,
    IReadOnlyList<OrderStatusHistoryDto> StatusHistories
);

public sealed record OrderItemDto(
    long Id,
    long? ProductVariantId,
    long? ProductId,
    string ProductName,
    string Sku,
    string VariantDescription,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal,
    string? PrimaryImageUrl,
    bool HasReview
);

public sealed record OrderStatusHistoryDto(
    OrderStatus OldStatus,
    OrderStatus NewStatus,
    string? Note,
    DateTimeOffset CreatedAt
);

public sealed record CancelOrderRequest(string? Reason);

public sealed record CreateReviewRequest(long OrderItemId, int Rating, string? Comment);

public sealed record AdminOrderListItemDto(
    long Id,
    string OrderCode,
    long UserId,
    string CustomerName,
    string CustomerEmail,
    decimal TotalAmount,
    OrderStatus OrderStatus,
    PaymentStatus PaymentStatus,
    DateTimeOffset CreatedAt,
    int TotalQuantity
);

public sealed record AdminOrderDetailDto(
    long Id,
    string OrderCode,
    long UserId,
    string CustomerName,
    string CustomerEmail,
    string ReceiverName,
    string ReceiverPhone,
    string ShippingAddress,
    decimal Subtotal,
    decimal DiscountAmount,
    decimal ShippingFee,
    decimal TotalAmount,
    PaymentMethod PaymentMethod,
    PaymentStatus PaymentStatus,
    OrderStatus OrderStatus,
    string? Note,
    string? CancellationReason,
    DateTimeOffset CreatedAt,
    IReadOnlyList<OrderItemDto> Items,
    IReadOnlyList<OrderStatusHistoryDto> StatusHistories
);

public sealed record UpdateOrderStatusRequest(OrderStatus Status, string? Note);

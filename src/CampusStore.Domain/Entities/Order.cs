using CampusStore.Domain.Common;
using CampusStore.Domain.Enums;

namespace CampusStore.Domain.Entities;

public sealed class Order : AuditableEntity
{
    public string OrderCode { get; set; } = string.Empty;

    public long UserId { get; set; }

    public string ReceiverName { get; set; } = string.Empty;

    public string ReceiverPhone { get; set; } = string.Empty;

    public string ShippingAddress { get; set; } = string.Empty;

    public decimal Subtotal { get; set; }

    public decimal DiscountAmount { get; set; }

    public decimal ShippingFee { get; set; }

    public decimal TotalAmount { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;

    public OrderStatus OrderStatus { get; set; } = OrderStatus.Pending;

    public string? Note { get; set; }

    public string? CancellationReason { get; set; }
}

using CampusStore.Domain.Common;
using CampusStore.Domain.Enums;

namespace CampusStore.Domain.Entities;

public sealed class Payment : Entity
{
    public long OrderId { get; set; }

    public PaymentMethod Method { get; set; }

    public string? TransactionCode { get; set; }

    public decimal Amount { get; set; }

    public PaymentStatus Status { get; set; }

    public DateTimeOffset? PaidAt { get; set; }

    public DateTimeOffset CreatedAt { get; set; }
}

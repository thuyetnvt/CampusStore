using CampusStore.Domain.Common;

namespace CampusStore.Domain.Entities;

public sealed class Cart : AuditableEntity
{
    public long UserId { get; set; }
}

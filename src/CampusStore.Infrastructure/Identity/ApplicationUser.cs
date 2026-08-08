using CampusStore.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace CampusStore.Infrastructure.Identity;

public sealed class ApplicationUser : IdentityUser<long>
{
    public string FullName { get; set; } = string.Empty;

    public UserStatus Status { get; set; } = UserStatus.Active;

    public DateTimeOffset CreatedAt { get; set; }

    public DateTimeOffset? UpdatedAt { get; set; }
}

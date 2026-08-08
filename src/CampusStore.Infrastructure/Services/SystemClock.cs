using CampusStore.Application.Abstractions;

namespace CampusStore.Infrastructure.Services;

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}

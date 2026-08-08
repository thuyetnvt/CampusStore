namespace CampusStore.Application.Abstractions;

public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

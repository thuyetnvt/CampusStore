namespace CampusStore.Application.Abstractions;

public interface ICurrentUser
{
    long? UserId { get; }

    string? Email { get; }

    IReadOnlyCollection<string> Roles { get; }
}

namespace CampusStore.Application.Dtos;

public sealed record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    string ConfirmPassword,
    string PhoneNumber
);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthUserDto(long Id, string FullName, string Email, IReadOnlyCollection<string> Roles);

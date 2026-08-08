namespace CampusStore.Application.Common;

public sealed class Result
{
    public bool IsSuccess { get; private init; }

    public string? ErrorCode { get; private init; }

    public string? ErrorMessage { get; private init; }

    public static Result Success() => new() { IsSuccess = true };

    public static Result Failure(string code, string message) =>
        new() { IsSuccess = false, ErrorCode = code, ErrorMessage = message };
}

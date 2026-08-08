namespace CampusStore.Application.Dtos;

public sealed record PagedQuery(int Page = 1, int PageSize = 20, string? Keyword = null);

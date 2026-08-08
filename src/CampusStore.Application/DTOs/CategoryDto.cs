namespace CampusStore.Application.Dtos;

public sealed record CategoryDto(long Id, string Name, string Slug, bool IsActive, long? ParentId);

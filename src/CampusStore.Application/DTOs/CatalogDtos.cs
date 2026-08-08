using CampusStore.Application.Common;

namespace CampusStore.Application.Dtos;

public sealed record ProductQuery(
    string? Keyword,
    long? CategoryId,
    string? CategorySlug,
    decimal? MinPrice,
    decimal? MaxPrice,
    bool? InStock,
    int? MinRating,
    string? Sort,
    int Page = 1,
    int PageSize = 20
);

public sealed record ProductListItemDto(
    long Id,
    string Name,
    string Slug,
    string CategoryName,
    decimal BasePrice,
    decimal? SalePrice,
    string? PrimaryImageUrl,
    int TotalStock,
    double AverageRating,
    int ReviewCount
);

public sealed record ProductDetailDto(
    long Id,
    string Name,
    string Slug,
    string Description,
    CategoryDto Category,
    decimal BasePrice,
    decimal? SalePrice,
    string? PrimaryImageUrl,
    IReadOnlyList<ProductImageDto> Images,
    IReadOnlyList<ProductVariantDto> Variants,
    IReadOnlyList<ReviewSummaryDto> Reviews,
    double AverageRating,
    int ReviewCount
);

public sealed record ProductImageDto(long Id, string ImageUrl, string AltText, int SortOrder, bool IsPrimary);

public sealed record ReviewSummaryDto(long Id, int Rating, string? Comment, DateTimeOffset CreatedAt);

public sealed record ProductListResponse(PagedResult<ProductListItemDto> Products);

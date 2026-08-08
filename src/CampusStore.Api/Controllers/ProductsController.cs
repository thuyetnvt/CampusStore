using CampusStore.Application.Common;
using CampusStore.Application.Dtos;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Route("api/products")]
public sealed class ProductsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public ProductsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<ProductListItemDto>>> Get(
        [FromQuery] ProductQuery query,
        [FromQuery] bool saleOnly,
        CancellationToken cancellationToken)
    {
        var page = Math.Max(query.Page, 1);
        var pageSize = Math.Clamp(query.PageSize, 1, 60);
        var products = _dbContext.Products.AsNoTracking().Where(product => product.IsActive);

        if (saleOnly)
        {
            products = products.Where(product => product.SalePrice != null && product.SalePrice < product.BasePrice);
        }

        if (!string.IsNullOrWhiteSpace(query.Keyword))
        {
            var keyword = query.Keyword.Trim();
            products = products.Where(product => product.Name.Contains(keyword) || product.Description.Contains(keyword));
        }

        if (query.CategoryId is not null)
        {
            products = products.Where(product => product.CategoryId == query.CategoryId);
        }

        if (!string.IsNullOrWhiteSpace(query.CategorySlug))
        {
            var categorySlug = query.CategorySlug.Trim();
            products = products.Where(product => _dbContext.Categories
                .Any(category => category.Id == product.CategoryId && category.Slug == categorySlug));
        }

        if (query.MinPrice is not null)
        {
            products = products.Where(product => (product.SalePrice ?? product.BasePrice) >= query.MinPrice);
        }

        if (query.MaxPrice is not null)
        {
            products = products.Where(product => (product.SalePrice ?? product.BasePrice) <= query.MaxPrice);
        }

        if (query.InStock == true)
        {
            products = products.Where(product => _dbContext.ProductVariants
                .Any(variant => variant.ProductId == product.Id && variant.IsActive && variant.StockQuantity > 0));
        }

        if (query.MinRating is not null)
        {
            products = products.Where(product =>
                (_dbContext.Reviews
                    .Where(review => review.ProductId == product.Id && review.IsVisible)
                    .Select(review => (double?)review.Rating)
                    .Average() ?? 0) >= query.MinRating.Value);
        }

        products = query.Sort switch
        {
            "price_asc" => products.OrderBy(product => product.SalePrice ?? product.BasePrice),
            "price_desc" => products.OrderByDescending(product => product.SalePrice ?? product.BasePrice),
            "best_selling" => products.OrderByDescending(product => _dbContext.OrderItems
                .Where(item => item.ProductVariantId != null)
                .Join(
                    _dbContext.ProductVariants,
                    item => item.ProductVariantId!.Value,
                    variant => variant.Id,
                    (item, variant) => new { item.Quantity, variant.ProductId })
                .Where(item => item.ProductId == product.Id)
                .Sum(item => (int?)item.Quantity) ?? 0),
            _ => products.OrderByDescending(product => product.CreatedAt)
        };

        var totalItems = await products.CountAsync(cancellationToken);
        var items = await products
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(product => new ProductListItemDto(
                product.Id,
                product.Name,
                product.Slug,
                _dbContext.Categories
                    .Where(category => category.Id == product.CategoryId)
                    .Select(category => category.Name)
                    .First(),
                product.BasePrice,
                product.SalePrice,
                _dbContext.ProductImages
                    .Where(image => image.ProductId == product.Id)
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.SortOrder)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault(),
                _dbContext.ProductVariants
                    .Where(variant => variant.ProductId == product.Id && variant.IsActive)
                    .Sum(variant => (int?)variant.StockQuantity) ?? 0,
                _dbContext.Reviews
                    .Where(review => review.ProductId == product.Id && review.IsVisible)
                    .Select(review => (double?)review.Rating)
                    .Average() ?? 0,
                _dbContext.Reviews.Count(review => review.ProductId == product.Id && review.IsVisible)))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<ProductListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpGet("{idOrSlug}")]
    public async Task<ActionResult<ProductDetailDto>> GetByIdOrSlug(
        string idOrSlug,
        CancellationToken cancellationToken)
    {
        var products = _dbContext.Products.AsNoTracking().Where(product => product.IsActive);
        products = long.TryParse(idOrSlug, out var id)
            ? products.Where(product => product.Id == id)
            : products.Where(product => product.Slug == idOrSlug);

        var product = await products.FirstOrDefaultAsync(cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        var category = await _dbContext.Categories
            .AsNoTracking()
            .Where(item => item.Id == product.CategoryId)
            .Select(item => new CategoryDto(item.Id, item.Name, item.Slug, item.IsActive, item.ParentId))
            .FirstAsync(cancellationToken);

        var images = await _dbContext.ProductImages
            .AsNoTracking()
            .Where(image => image.ProductId == product.Id)
            .OrderByDescending(image => image.IsPrimary)
            .ThenBy(image => image.SortOrder)
            .Select(image => new ProductImageDto(image.Id, image.ImageUrl, image.AltText, image.SortOrder, image.IsPrimary))
            .ToListAsync(cancellationToken);

        var variants = await _dbContext.ProductVariants
            .AsNoTracking()
            .Where(variant => variant.ProductId == product.Id && variant.IsActive)
            .OrderBy(variant => variant.Id)
            .Select(variant => new ProductVariantDto(
                variant.Id,
                variant.ProductId,
                variant.Sku,
                variant.Color,
                variant.Size,
                variant.Price,
                variant.StockQuantity,
                variant.LowStockThreshold,
                variant.IsActive))
            .ToListAsync(cancellationToken);

        var reviews = await _dbContext.Reviews
            .AsNoTracking()
            .Where(review => review.ProductId == product.Id && review.IsVisible)
            .OrderByDescending(review => review.CreatedAt)
            .Select(review => new ReviewSummaryDto(review.Id, review.Rating, review.Comment, review.CreatedAt))
            .ToListAsync(cancellationToken);

        var averageRating = reviews.Count == 0 ? 0 : reviews.Average(review => review.Rating);

        return Ok(new ProductDetailDto(
            product.Id,
            product.Name,
            product.Slug,
            product.Description,
            category,
            product.BasePrice,
            product.SalePrice,
            images.FirstOrDefault(image => image.IsPrimary)?.ImageUrl ?? images.FirstOrDefault()?.ImageUrl,
            images,
            variants,
            reviews,
            averageRating,
            reviews.Count));
    }

    [HttpGet("{id:long}/related")]
    public async Task<ActionResult<IReadOnlyList<ProductListItemDto>>> GetRelated(
        long id,
        CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        var query = new ProductQuery(null, product.CategoryId, null, null, null, true, null, "newest", 1, 8);
        var result = await Get(query, false, cancellationToken);
        var page = result.Value;

        return Ok(page?.Items.Where(item => item.Id != id).Take(4).ToArray() ?? []);
    }
}

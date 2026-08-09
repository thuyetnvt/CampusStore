using CampusStore.Api;
using CampusStore.Application.Common;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Entities;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
[Route("api/admin/products")]
public sealed class AdminProductsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminProductsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminProductListItemDto>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null,
        [FromQuery] long? categoryId = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 60);

        var query = _dbContext.Products.AsNoTracking()
            .Join(
                _dbContext.Categories.AsNoTracking(),
                product => product.CategoryId,
                category => category.Id,
                (product, category) => new { product, category });

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var value = keyword.Trim();
            query = query.Where(row =>
                row.product.Name.Contains(value)
                || row.product.Slug.Contains(value)
                || row.product.Description.Contains(value));
        }

        if (categoryId is not null)
        {
            query = query.Where(row => row.product.CategoryId == categoryId.Value);
        }

        if (isActive is not null)
        {
            query = query.Where(row => row.product.IsActive == isActive.Value);
        }

        var ordered = query.OrderByDescending(row => row.product.CreatedAt).ThenByDescending(row => row.product.Id);
        var totalItems = await ordered.CountAsync(cancellationToken);
        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(row => new AdminProductListItemDto(
                row.product.Id,
                row.product.Name,
                row.product.Slug,
                row.category.Id,
                row.category.Name,
                row.product.Description,
                row.product.BasePrice,
                row.product.SalePrice,
                row.product.IsActive,
                _dbContext.ProductVariants
                    .Where(variant => variant.ProductId == row.product.Id && variant.IsActive)
                    .Sum(variant => (int?)variant.StockQuantity) ?? 0,
                _dbContext.ProductVariants.Count(variant => variant.ProductId == row.product.Id),
                _dbContext.ProductImages
                    .Where(image => image.ProductId == row.product.Id)
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.SortOrder)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault(),
                row.product.CreatedAt,
                row.product.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<AdminProductListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<AdminProductDetailDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        var category = await _dbContext.Categories.AsNoTracking()
            .Where(item => item.Id == product.CategoryId)
            .Select(item => new { item.Id, item.Name })
            .FirstAsync(cancellationToken);

        var totalStock = await _dbContext.ProductVariants
            .AsNoTracking()
            .Where(variant => variant.ProductId == product.Id && variant.IsActive)
            .SumAsync(variant => (int?)variant.StockQuantity, cancellationToken) ?? 0;

        var variantCount = await _dbContext.ProductVariants
            .AsNoTracking()
            .CountAsync(variant => variant.ProductId == product.Id, cancellationToken);

        var primaryImageUrl = await _dbContext.ProductImages
            .AsNoTracking()
            .Where(image => image.ProductId == product.Id)
            .OrderByDescending(image => image.IsPrimary)
            .ThenBy(image => image.SortOrder)
            .Select(image => image.ImageUrl)
            .FirstOrDefaultAsync(cancellationToken);

        return Ok(new AdminProductDetailDto(
            product.Id,
            product.Name,
            product.Slug,
            category.Id,
            category.Name,
            product.Description,
            product.BasePrice,
            product.SalePrice,
            product.IsActive,
            totalStock,
            variantCount,
            primaryImageUrl,
            product.CreatedAt,
            product.UpdatedAt));
    }

    [HttpPost]
    public async Task<ActionResult<AdminProductDetailDto>> Create(
        [FromBody] AdminProductUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var normalizedSlug = request.Slug.Trim();
        if (await _dbContext.Products.AsNoTracking().AnyAsync(item => item.Slug == normalizedSlug, cancellationToken))
        {
            return Conflict(new { message = "Slug sản phẩm đã tồn tại." });
        }

        var categoryExists = await _dbContext.Categories.AsNoTracking()
            .AnyAsync(item => item.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Danh mục không hợp lệ." });
        }

        var product = new Product
        {
            CategoryId = request.CategoryId,
            Name = request.Name.Trim(),
            Slug = normalizedSlug,
            Description = request.Description.Trim(),
            BasePrice = request.BasePrice,
            SalePrice = request.SalePrice,
            IsActive = request.IsActive,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Products.Add(product);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = product.Id }, await BuildDetailAsync(product.Id, cancellationToken));
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<AdminProductDetailDto>> Update(
        long id,
        [FromBody] AdminProductUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var product = await _dbContext.Products.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        var normalizedSlug = request.Slug.Trim();
        var duplicateSlug = await _dbContext.Products.AsNoTracking()
            .AnyAsync(item => item.Id != id && item.Slug == normalizedSlug, cancellationToken);
        if (duplicateSlug)
        {
            return Conflict(new { message = "Slug sản phẩm đã tồn tại." });
        }

        var categoryExists = await _dbContext.Categories.AsNoTracking()
            .AnyAsync(item => item.Id == request.CategoryId, cancellationToken);
        if (!categoryExists)
        {
            return BadRequest(new { message = "Danh mục không hợp lệ." });
        }

        product.CategoryId = request.CategoryId;
        product.Name = request.Name.Trim();
        product.Slug = normalizedSlug;
        product.Description = request.Description.Trim();
        product.BasePrice = request.BasePrice;
        product.SalePrice = request.SalePrice;
        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(await BuildDetailAsync(product.Id, cancellationToken));
    }

    [HttpPatch("{id:long}/active")]
    public async Task<IActionResult> SetActive(
        long id,
        [FromBody] AdminProductActiveRequest request,
        CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        product.IsActive = request.IsActive;
        product.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static string? ValidateRequest(AdminProductUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Tên sản phẩm không được để trống.";
        }

        if (request.Name.Trim().Length > 220)
        {
            return "Tên sản phẩm không được vượt quá 220 ký tự.";
        }

        if (string.IsNullOrWhiteSpace(request.Slug))
        {
            return "Slug sản phẩm không được để trống.";
        }

        if (request.Slug.Trim().Length > 240)
        {
            return "Slug sản phẩm không được vượt quá 240 ký tự.";
        }

        if (string.IsNullOrWhiteSpace(request.Description))
        {
            return "Mô tả sản phẩm không được để trống.";
        }

        if (request.Description.Trim().Length > 4000)
        {
            return "Mô tả sản phẩm quá dài.";
        }

        if (request.BasePrice <= 0)
        {
            return "Giá gốc phải lớn hơn 0.";
        }

        if (request.SalePrice is not null && request.SalePrice <= 0)
        {
            return "Giá giảm phải lớn hơn 0.";
        }

        if (request.SalePrice is not null && request.SalePrice >= request.BasePrice)
        {
            return "Giá giảm phải nhỏ hơn giá gốc.";
        }

        return null;
    }

    private async Task<AdminProductDetailDto> BuildDetailAsync(long productId, CancellationToken cancellationToken)
    {
        var product = await _dbContext.Products.AsNoTracking().FirstAsync(item => item.Id == productId, cancellationToken);
        var category = await _dbContext.Categories.AsNoTracking()
            .Where(item => item.Id == product.CategoryId)
            .Select(item => new { item.Id, item.Name })
            .FirstAsync(cancellationToken);

        var totalStock = await _dbContext.ProductVariants
            .AsNoTracking()
            .Where(variant => variant.ProductId == product.Id && variant.IsActive)
            .SumAsync(variant => (int?)variant.StockQuantity, cancellationToken) ?? 0;

        var variantCount = await _dbContext.ProductVariants
            .AsNoTracking()
            .CountAsync(variant => variant.ProductId == product.Id, cancellationToken);

        var primaryImageUrl = await _dbContext.ProductImages
            .AsNoTracking()
            .Where(image => image.ProductId == product.Id)
            .OrderByDescending(image => image.IsPrimary)
            .ThenBy(image => image.SortOrder)
            .Select(image => image.ImageUrl)
            .FirstOrDefaultAsync(cancellationToken);

        return new AdminProductDetailDto(
            product.Id,
            product.Name,
            product.Slug,
            category.Id,
            category.Name,
            product.Description,
            product.BasePrice,
            product.SalePrice,
            product.IsActive,
            totalStock,
            variantCount,
            primaryImageUrl,
            product.CreatedAt,
            product.UpdatedAt);
    }
}

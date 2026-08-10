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
[Route("api/admin/inventory")]
public sealed class AdminInventoryController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminInventoryController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminInventoryItemDto>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null,
        [FromQuery] long? categoryId = null,
        [FromQuery] string? stockState = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 60);

        var query = _dbContext.ProductVariants.AsNoTracking()
            .Join(
                _dbContext.Products.AsNoTracking(),
                variant => variant.ProductId,
                product => product.Id,
                (variant, product) => new { variant, product })
            .Join(
                _dbContext.Categories.AsNoTracking(),
                row => row.product.CategoryId,
                category => category.Id,
                (row, category) => new { row.variant, row.product, category });

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var value = keyword.Trim();
            query = query.Where(row =>
                row.product.Name.Contains(value)
                || row.product.Slug.Contains(value)
                || row.variant.Sku.Contains(value)
                || (row.variant.Color != null && row.variant.Color.Contains(value))
                || (row.variant.Size != null && row.variant.Size.Contains(value)));
        }

        if (categoryId is not null)
        {
            query = query.Where(row => row.product.CategoryId == categoryId.Value);
        }

        if (isActive is not null)
        {
            query = query.Where(row => row.variant.IsActive == isActive.Value);
        }

        query = stockState?.Trim().ToLowerInvariant() switch
        {
            "in_stock" => query.Where(row => row.variant.StockQuantity > row.variant.LowStockThreshold),
            "low_stock" => query.Where(row => row.variant.StockQuantity > 0 && row.variant.StockQuantity <= row.variant.LowStockThreshold),
            "out_of_stock" => query.Where(row => row.variant.StockQuantity <= 0),
            _ => query
        };

        var ordered = query.OrderBy(row => row.product.Name).ThenBy(row => row.variant.Sku);
        var totalItems = await ordered.CountAsync(cancellationToken);
        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(row => new AdminInventoryItemDto(
                row.product.Id,
                row.variant.Id,
                row.product.Name,
                row.category.Name,
                row.variant.Sku,
                row.variant.Color,
                row.variant.Size,
                row.variant.Price,
                row.variant.StockQuantity,
                row.variant.LowStockThreshold,
                row.variant.IsActive,
                row.variant.StockQuantity <= 0
                    ? "Hết hàng"
                    : row.variant.StockQuantity <= row.variant.LowStockThreshold
                        ? "Sắp hết"
                        : "Còn hàng"))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<AdminInventoryItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpPatch("{variantId:long}")]
    public async Task<IActionResult> Update(
        long variantId,
        [FromBody] AdminInventoryUpdateRequest request,
        CancellationToken cancellationToken)
    {
        if (request.StockQuantity < 0)
        {
            return BadRequest(new { message = "Tồn kho không được nhỏ hơn 0." });
        }

        if (request.LowStockThreshold < 0)
        {
            return BadRequest(new { message = "Ngưỡng cảnh báo không được nhỏ hơn 0." });
        }

        var variant = await _dbContext.ProductVariants.FirstOrDefaultAsync(item => item.Id == variantId, cancellationToken);
        if (variant is null)
        {
            return NotFound();
        }

        var oldValues = new
        {
            variant.StockQuantity,
            variant.LowStockThreshold,
            variant.IsActive
        };

        variant.StockQuantity = request.StockQuantity;
        variant.LowStockThreshold = request.LowStockThreshold;
        variant.IsActive = request.IsActive;

        _dbContext.AuditLogs.Add(new AuditLog
        {
            Action = "InventoryUpdate",
            EntityType = nameof(ProductVariant),
            EntityId = variant.Id,
            OldValues = System.Text.Json.JsonSerializer.Serialize(oldValues),
            NewValues = System.Text.Json.JsonSerializer.Serialize(new
            {
                variant.StockQuantity,
                variant.LowStockThreshold,
                variant.IsActive,
                request.Reason
            }),
            CreatedAt = DateTimeOffset.UtcNow
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

}

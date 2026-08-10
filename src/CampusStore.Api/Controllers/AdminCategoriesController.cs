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
[Route("api/admin/categories")]
public sealed class AdminCategoriesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminCategoriesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminCategoryListItemDto>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 60);

        var query = _dbContext.Categories.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var value = keyword.Trim();
            query = query.Where(category =>
                category.Name.Contains(value)
                || category.Slug.Contains(value)
                || (category.Description != null && category.Description.Contains(value)));
        }

        if (isActive is not null)
        {
            query = query.Where(category => category.IsActive == isActive.Value);
        }

        var ordered = query.OrderBy(category => category.Name);
        var totalItems = await ordered.CountAsync(cancellationToken);
        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(category => new AdminCategoryListItemDto(
                category.Id,
                category.Name,
                category.Slug,
                category.Description,
                category.IsActive,
                category.ParentId,
                _dbContext.Products.Count(product => product.CategoryId == category.Id),
                category.CreatedAt,
                category.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<AdminCategoryListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<AdminCategoryListItemDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        return Ok(await BuildDtoAsync(category, cancellationToken));
    }

    [HttpPost]
    public async Task<ActionResult<AdminCategoryListItemDto>> Create(
        [FromBody] AdminCategoryUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var slug = request.Slug.Trim();
        if (await _dbContext.Categories.AsNoTracking().AnyAsync(item => item.Slug == slug, cancellationToken))
        {
            return Conflict(new { message = "Slug danh mục đã tồn tại." });
        }

        if (request.ParentId is not null && !await CategoryExistsAsync(request.ParentId.Value, cancellationToken))
        {
            return BadRequest(new { message = "Danh mục cha không hợp lệ." });
        }

        var category = new Category
        {
            Name = request.Name.Trim(),
            Slug = slug,
            Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim(),
            ParentId = request.ParentId,
            IsActive = request.IsActive,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Categories.Add(category);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetById), new { id = category.Id }, await BuildDtoAsync(category, cancellationToken));
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<AdminCategoryListItemDto>> Update(
        long id,
        [FromBody] AdminCategoryUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var category = await _dbContext.Categories.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        var slug = request.Slug.Trim();
        if (await _dbContext.Categories.AsNoTracking().AnyAsync(item => item.Id != id && item.Slug == slug, cancellationToken))
        {
            return Conflict(new { message = "Slug danh mục đã tồn tại." });
        }

        if (request.ParentId == id)
        {
            return BadRequest(new { message = "Danh mục không thể tự làm danh mục cha." });
        }

        if (request.ParentId is not null && !await CategoryExistsAsync(request.ParentId.Value, cancellationToken))
        {
            return BadRequest(new { message = "Danh mục cha không hợp lệ." });
        }

        category.Name = request.Name.Trim();
        category.Slug = slug;
        category.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        category.ParentId = request.ParentId;
        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(await BuildDtoAsync(category, cancellationToken));
    }

    [HttpPatch("{id:long}/active")]
    public async Task<IActionResult> SetActive(
        long id,
        [FromBody] AdminCategoryActiveRequest request,
        CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (category is null)
        {
            return NotFound();
        }

        category.IsActive = request.IsActive;
        category.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<bool> CategoryExistsAsync(long id, CancellationToken cancellationToken)
    {
        return await _dbContext.Categories.AsNoTracking().AnyAsync(item => item.Id == id, cancellationToken);
    }

    private async Task<AdminCategoryListItemDto> BuildDtoAsync(Category category, CancellationToken cancellationToken)
    {
        var productCount = await _dbContext.Products.AsNoTracking()
            .CountAsync(product => product.CategoryId == category.Id, cancellationToken);

        return new AdminCategoryListItemDto(
            category.Id,
            category.Name,
            category.Slug,
            category.Description,
            category.IsActive,
            category.ParentId,
            productCount,
            category.CreatedAt,
            category.UpdatedAt);
    }

    private static string? ValidateRequest(AdminCategoryUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Tên danh mục không được để trống.";
        }

        if (request.Name.Trim().Length > 160)
        {
            return "Tên danh mục không được vượt quá 160 ký tự.";
        }

        if (string.IsNullOrWhiteSpace(request.Slug))
        {
            return "Slug danh mục không được để trống.";
        }

        if (request.Slug.Trim().Length > 180)
        {
            return "Slug danh mục không được vượt quá 180 ký tự.";
        }

        if (request.Description is not null && request.Description.Trim().Length > 1000)
        {
            return "Mô tả danh mục quá dài.";
        }

        return null;
    }
}

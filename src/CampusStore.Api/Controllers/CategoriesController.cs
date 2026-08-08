using CampusStore.Application.Dtos;
using CampusStore.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Mvc;

namespace CampusStore.Api.Controllers;

[ApiController]
[Route("api/categories")]
public sealed class CategoriesController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CategoriesController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CategoryDto>>> Get(CancellationToken cancellationToken)
    {
        var categories = await _dbContext.Categories
            .AsNoTracking()
            .Where(category => category.IsActive)
            .OrderBy(category => category.Name)
            .Select(category => new CategoryDto(
                category.Id,
                category.Name,
                category.Slug,
                category.IsActive,
                category.ParentId))
            .ToListAsync(cancellationToken);

        return Ok(categories);
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<CategoryDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var category = await _dbContext.Categories
            .AsNoTracking()
            .Where(item => item.Id == id)
            .Select(item => new CategoryDto(item.Id, item.Name, item.Slug, item.IsActive, item.ParentId))
            .FirstOrDefaultAsync(cancellationToken);

        return category is null ? NotFound() : Ok(category);
    }
}

using CampusStore.Api;
using CampusStore.Application.Common;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Enums;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
[Route("api/admin/customers")]
public sealed class AdminCustomersController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminCustomersController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminCustomerListItemDto>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null,
        [FromQuery] UserStatus? status = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 60);

        var customerRoleId = await GetCustomerRoleIdAsync(cancellationToken);
        var query = _dbContext.Users.AsNoTracking()
            .Join(
                _dbContext.UserRoles.AsNoTracking(),
                user => user.Id,
                userRole => userRole.UserId,
                (user, userRole) => new { user, userRole })
            .Where(row => row.userRole.RoleId == customerRoleId)
            .Select(row => row.user);

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var value = keyword.Trim();
            query = query.Where(user =>
                user.FullName.Contains(value)
                || user.Email!.Contains(value)
                || (user.PhoneNumber != null && user.PhoneNumber.Contains(value)));
        }

        if (status is not null)
        {
            query = query.Where(user => user.Status == status.Value);
        }

        var ordered = query.OrderByDescending(user => user.CreatedAt);
        var totalItems = await ordered.CountAsync(cancellationToken);
        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(user => new AdminCustomerListItemDto(
                user.Id,
                user.FullName,
                user.Email ?? string.Empty,
                user.PhoneNumber,
                user.Status,
                _dbContext.Orders.Count(order => order.UserId == user.Id),
                _dbContext.Orders.Where(order => order.UserId == user.Id).Sum(order => (decimal?)order.TotalAmount) ?? 0,
                user.CreatedAt,
                user.UpdatedAt))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<AdminCustomerListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpPatch("{id:long}/status")]
    public async Task<IActionResult> UpdateStatus(
        long id,
        [FromBody] AdminUserStatusRequest request,
        CancellationToken cancellationToken)
    {
        var user = await _dbContext.Users.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (user is null)
        {
            return NotFound();
        }

        if (request.Status == UserStatus.Disabled || request.Status == UserStatus.Locked)
        {
            user.Status = request.Status;
        }
        else
        {
            user.Status = UserStatus.Active;
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private async Task<long> GetCustomerRoleIdAsync(CancellationToken cancellationToken)
    {
        return await _dbContext.Roles
            .AsNoTracking()
            .Where(role => role.Name == "Customer")
            .Select(role => role.Id)
            .FirstAsync(cancellationToken);
    }
}

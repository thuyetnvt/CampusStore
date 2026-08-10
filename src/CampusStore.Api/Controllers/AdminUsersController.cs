using CampusStore.Api;
using CampusStore.Application.Common;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Constants;
using CampusStore.Domain.Enums;
using CampusStore.Infrastructure.Identity;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.AdminOnly)]
[Route("api/admin/users")]
public sealed class AdminUsersController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly RoleManager<IdentityRole<long>> _roleManager;

    public AdminUsersController(
        AppDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        RoleManager<IdentityRole<long>> roleManager)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _roleManager = roleManager;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminUserListItemDto>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null,
        [FromQuery] UserStatus? status = null,
        [FromQuery] string? role = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 60);

        var query = _dbContext.Users.AsNoTracking();
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

        if (!string.IsNullOrWhiteSpace(role))
        {
            var normalized = role.Trim();
            var roleId = await _dbContext.Roles.AsNoTracking()
                .Where(item => item.Name == normalized)
                .Select(item => item.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (roleId > 0)
            {
                query = query.Where(user =>
                    _dbContext.UserRoles.Any(userRole => userRole.UserId == user.Id && userRole.RoleId == roleId));
            }
        }

        var ordered = query.OrderByDescending(user => user.CreatedAt);
        var totalItems = await ordered.CountAsync(cancellationToken);
        var users = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = new List<AdminUserListItemDto>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            items.Add(new AdminUserListItemDto(
                user.Id,
                user.FullName,
                user.Email ?? string.Empty,
                user.PhoneNumber,
                user.Status,
                roles.ToArray(),
                user.CreatedAt,
                user.UpdatedAt));
        }

        return Ok(new PagedResult<AdminUserListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaff([FromBody] AdminCreateStaffRequest request, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.FullName))
        {
            return BadRequest(new { message = "Tên không được để trống." });
        }

        if (string.IsNullOrWhiteSpace(request.Email))
        {
            return BadRequest(new { message = "Email không được để trống." });
        }

        if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
        {
            return BadRequest(new { message = "Mật khẩu phải có ít nhất 8 ký tự." });
        }

        if (await _userManager.FindByEmailAsync(request.Email) is not null)
        {
            return Conflict(new { message = "Email đã tồn tại." });
        }

        await EnsureRoleAsync(RoleNames.Staff);

        var user = new ApplicationUser
        {
            FullName = request.FullName.Trim(),
            Email = request.Email.Trim(),
            UserName = request.Email.Trim(),
            PhoneNumber = string.IsNullOrWhiteSpace(request.PhoneNumber) ? null : request.PhoneNumber.Trim(),
            Status = UserStatus.Active,
            EmailConfirmed = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new { message = "Tạo tài khoản thất bại.", errors = result.Errors.Select(item => item.Description) });
        }

        await _userManager.AddToRoleAsync(user, RoleNames.Staff);
        return CreatedAtAction(nameof(Get), new { }, new { user.Id });
    }

    [HttpPatch("{id:long}/status")]
    public async Task<IActionResult> UpdateStatus(long id, [FromBody] AdminUserStatusRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return NotFound();
        }

        user.Status = request.Status;
        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    [HttpPut("{id:long}/roles")]
    public async Task<IActionResult> UpdateRoles(long id, [FromBody] AdminUserRolesRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByIdAsync(id.ToString());
        if (user is null)
        {
            return NotFound();
        }

        var allowedRoles = new[] { RoleNames.Customer, RoleNames.Staff, RoleNames.Admin };
        var invalidRole = request.Roles.FirstOrDefault(role => !allowedRoles.Contains(role));
        if (invalidRole is not null)
        {
            return BadRequest(new { message = $"Vai trò không hợp lệ: {invalidRole}." });
        }

        foreach (var role in allowedRoles)
        {
            if (await _userManager.IsInRoleAsync(user, role) && !request.Roles.Contains(role))
            {
                await _userManager.RemoveFromRoleAsync(user, role);
            }
        }

        foreach (var role in request.Roles.Distinct())
        {
            if (!await _userManager.IsInRoleAsync(user, role))
            {
                await EnsureRoleAsync(role);
                await _userManager.AddToRoleAsync(user, role);
            }
        }

        user.UpdatedAt = DateTimeOffset.UtcNow;
        await _userManager.UpdateAsync(user);
        return NoContent();
    }

    private async Task EnsureRoleAsync(string roleName)
    {
        if (!await _roleManager.RoleExistsAsync(roleName))
        {
            await _roleManager.CreateAsync(new IdentityRole<long>(roleName));
        }
    }
}

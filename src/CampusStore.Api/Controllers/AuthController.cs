using CampusStore.Application.Dtos;
using CampusStore.Domain.Constants;
using CampusStore.Infrastructure.Identity;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace CampusStore.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly RoleManager<IdentityRole<long>> _roleManager;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        RoleManager<IdentityRole<long>> roleManager)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _roleManager = roleManager;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request, CancellationToken cancellationToken)
    {
        if (request.Password != request.ConfirmPassword)
        {
            return BadRequest(new { message = "Mật khẩu xác nhận không khớp." });
        }

        var existing = await _userManager.FindByEmailAsync(request.Email);
        if (existing is not null)
        {
            return Conflict(new { message = "Email đã tồn tại." });
        }

        var user = new ApplicationUser
        {
            UserName = request.Email,
            Email = request.Email,
            FullName = request.FullName,
            PhoneNumber = request.PhoneNumber,
            CreatedAt = DateTimeOffset.UtcNow
        };

        var result = await _userManager.CreateAsync(user, request.Password);
        if (!result.Succeeded)
        {
            return BadRequest(new
            {
                message = "Đăng ký thất bại.",
                errors = result.Errors.Select(error => error.Description)
            });
        }

        if (!await _roleManager.RoleExistsAsync(RoleNames.Customer))
        {
            await _roleManager.CreateAsync(new IdentityRole<long>(RoleNames.Customer));
        }

        await _userManager.AddToRoleAsync(user, RoleNames.Customer);

        return CreatedAtAction(nameof(Me), new { }, await ToAuthUserDto(user));
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request, CancellationToken cancellationToken)
    {
        var user = await _userManager.FindByEmailAsync(request.Email);
        if (user is null)
        {
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
        }

        var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);
        if (!result.Succeeded)
        {
            return Unauthorized(new { message = "Email hoặc mật khẩu không đúng." });
        }

        await _signInManager.SignInAsync(user, isPersistent: false);

        return Ok(await ToAuthUserDto(user));
    }

    [HttpPost("logout")]
    public async Task<IActionResult> Logout()
    {
        await _signInManager.SignOutAsync();
        return NoContent();
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user is null)
        {
            return Unauthorized();
        }

        return Ok(await ToAuthUserDto(user));
    }

    private async Task<AuthUserDto> ToAuthUserDto(ApplicationUser user)
    {
        var roles = await _userManager.GetRolesAsync(user);
        return new AuthUserDto(user.Id, user.FullName, user.Email ?? string.Empty, roles.ToArray());
    }
}

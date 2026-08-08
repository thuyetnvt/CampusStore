using System.Security.Claims;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Entities;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/cart")]
public sealed class CartController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CartController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<CartDto>> Get(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);

        return Ok(await BuildCartDtoAsync(cart.Id, cancellationToken));
    }

    [HttpPost("items")]
    public async Task<ActionResult<CartDto>> AddItem(
        [FromBody] AddCartItemRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Quantity <= 0)
        {
            return BadRequest(new { message = "So luong phai lon hon 0." });
        }

        var variant = await _dbContext.ProductVariants
            .FirstOrDefaultAsync(item => item.Id == request.ProductVariantId && item.IsActive, cancellationToken);

        if (variant is null)
        {
            return NotFound(new { message = "Bien the san pham khong ton tai." });
        }

        var userId = GetCurrentUserId();
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);
        var cartItem = await _dbContext.CartItems
            .FirstOrDefaultAsync(
                item => item.CartId == cart.Id && item.ProductVariantId == request.ProductVariantId,
                cancellationToken);

        var nextQuantity = request.Quantity + (cartItem?.Quantity ?? 0);
        if (!variant.HasEnoughStock(nextQuantity))
        {
            return BadRequest(new { message = "So luong vuot qua ton kho hien co." });
        }

        if (cartItem is null)
        {
            cartItem = new CartItem
            {
                CartId = cart.Id,
                ProductVariantId = request.ProductVariantId,
                Quantity = request.Quantity,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _dbContext.CartItems.Add(cartItem);
        }
        else
        {
            cartItem.Quantity = nextQuantity;
            cartItem.UpdatedAt = DateTimeOffset.UtcNow;
        }

        cart.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(await BuildCartDtoAsync(cart.Id, cancellationToken));
    }

    [HttpPut("items/{id:long}")]
    public async Task<ActionResult<CartDto>> UpdateItem(
        long id,
        [FromBody] UpdateCartItemRequest request,
        CancellationToken cancellationToken)
    {
        if (request.Quantity <= 0)
        {
            return BadRequest(new { message = "So luong phai lon hon 0." });
        }

        var userId = GetCurrentUserId();
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);
        var cartItem = await _dbContext.CartItems
            .FirstOrDefaultAsync(item => item.Id == id && item.CartId == cart.Id, cancellationToken);

        if (cartItem is null)
        {
        return NotFound(new { message = "Sản phẩm không có trong giỏ hàng." });
        }

        var variant = await _dbContext.ProductVariants
            .FirstAsync(item => item.Id == cartItem.ProductVariantId, cancellationToken);

        if (!variant.HasEnoughStock(request.Quantity))
        {
            return BadRequest(new { message = "So luong vuot qua ton kho hien co." });
        }

        cartItem.Quantity = request.Quantity;
        cartItem.UpdatedAt = DateTimeOffset.UtcNow;
        cart.UpdatedAt = DateTimeOffset.UtcNow;

        await _dbContext.SaveChangesAsync(cancellationToken);

        return Ok(await BuildCartDtoAsync(cart.Id, cancellationToken));
    }

    [HttpDelete("items/{id:long}")]
    public async Task<ActionResult<CartDto>> DeleteItem(long id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);
        var cartItem = await _dbContext.CartItems
            .FirstOrDefaultAsync(item => item.Id == id && item.CartId == cart.Id, cancellationToken);

        if (cartItem is not null)
        {
            _dbContext.CartItems.Remove(cartItem);
            cart.UpdatedAt = DateTimeOffset.UtcNow;
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        return Ok(await BuildCartDtoAsync(cart.Id, cancellationToken));
    }

    [HttpDelete]
    public async Task<IActionResult> Clear(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var cart = await GetOrCreateCartAsync(userId, cancellationToken);
        var items = await _dbContext.CartItems.Where(item => item.CartId == cart.Id).ToListAsync(cancellationToken);

        _dbContext.CartItems.RemoveRange(items);
        cart.UpdatedAt = DateTimeOffset.UtcNow;
        await _dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<Cart> GetOrCreateCartAsync(long userId, CancellationToken cancellationToken)
    {
        var cart = await _dbContext.Carts.FirstOrDefaultAsync(item => item.UserId == userId, cancellationToken);
        if (cart is not null)
        {
            return cart;
        }

        cart = new Cart
        {
            UserId = userId,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Carts.Add(cart);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return cart;
    }

    private async Task<CartDto> BuildCartDtoAsync(long cartId, CancellationToken cancellationToken)
    {
        var items = await _dbContext.CartItems
            .AsNoTracking()
            .Where(item => item.CartId == cartId)
            .Join(
                _dbContext.ProductVariants.AsNoTracking(),
                item => item.ProductVariantId,
                variant => variant.Id,
                (item, variant) => new { item, variant })
            .Join(
                _dbContext.Products.AsNoTracking(),
                row => row.variant.ProductId,
                product => product.Id,
                (row, product) => new { row.item, row.variant, product })
            .Select(row => new CartItemDto(
                row.item.Id,
                row.product.Id,
                row.variant.Id,
                row.product.Name,
                row.product.Slug,
                row.variant.Sku,
                row.variant.Color,
                row.variant.Size,
                row.variant.Price,
                row.item.Quantity,
                row.variant.StockQuantity,
                _dbContext.ProductImages
                    .Where(image => image.ProductId == row.product.Id)
                    .OrderByDescending(image => image.IsPrimary)
                    .ThenBy(image => image.SortOrder)
                    .Select(image => image.ImageUrl)
                    .FirstOrDefault(),
                row.variant.Price * row.item.Quantity))
            .ToListAsync(cancellationToken);

        return new CartDto(
            cartId,
            items,
            items.Sum(item => item.LineTotal),
            items.Sum(item => item.Quantity));
    }

    private long GetCurrentUserId()
    {
        var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(rawUserId, out var userId)
            ? userId
            : throw new InvalidOperationException("Current user id is invalid.");
    }
}

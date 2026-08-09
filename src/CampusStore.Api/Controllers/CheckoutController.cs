using System.Security.Claims;
using CampusStore.Api;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Entities;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.CustomerOnly)]
[Route("api/checkout")]
public sealed class CheckoutController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public CheckoutController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost("preview")]
    public async Task<ActionResult<CheckoutPreviewDto>> Preview(
        [FromBody] CheckoutPreviewRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var cart = await _dbContext.Carts.AsNoTracking().FirstOrDefaultAsync(item => item.UserId == userId, cancellationToken);
        if (cart is null)
        {
            return BadRequest(new { message = "Giỏ hàng đang trống." });
        }

        var items = await BuildCartItemsAsync(cart.Id, cancellationToken);
        if (items.Count == 0)
        {
            return BadRequest(new { message = "Giỏ hàng đang trống." });
        }

        var preview = await BuildPreviewAsync(items, request.CouponCode, cancellationToken);
        return Ok(preview);
    }

    internal async Task<List<CartItemDto>> BuildCartItemsAsync(long cartId, CancellationToken cancellationToken)
    {
        return await _dbContext.CartItems
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
    }

    internal async Task<CheckoutPreviewDto> BuildPreviewAsync(
        IReadOnlyList<CartItemDto> items,
        string? couponCode,
        CancellationToken cancellationToken)
    {
        var subtotal = items.Sum(item => item.LineTotal);
        var shippingFee = subtotal >= 250_000 ? 0 : 20_000;
        var discountAmount = 0m;
        string? couponMessage = null;
        string? normalizedCouponCode = null;

        if (!string.IsNullOrWhiteSpace(couponCode))
        {
            normalizedCouponCode = couponCode.Trim().ToUpperInvariant();
            var coupon = await _dbContext.Coupons
                .AsNoTracking()
                .FirstOrDefaultAsync(item => item.Code.ToUpper() == normalizedCouponCode, cancellationToken);

            if (coupon is null || !coupon.CanApply(subtotal, DateTimeOffset.UtcNow))
            {
                couponMessage = "Voucher khong hop le hoac khong du dieu kien.";
            }
            else
            {
                discountAmount = coupon.DiscountType switch
                {
                    Domain.Enums.DiscountType.Percentage => subtotal * coupon.DiscountValue / 100,
                    _ => coupon.DiscountValue
                };

                if (coupon.MaximumDiscountAmount is not null)
                {
                    discountAmount = Math.Min(discountAmount, coupon.MaximumDiscountAmount.Value);
                }

                discountAmount = Math.Min(discountAmount, subtotal);
                couponMessage = "Voucher hop le.";
            }
        }

        return new CheckoutPreviewDto(
            items,
            subtotal,
            discountAmount,
            shippingFee,
            subtotal - discountAmount + shippingFee,
            normalizedCouponCode,
            couponMessage);
    }

    private long GetCurrentUserId()
    {
        var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(rawUserId, out var userId)
            ? userId
            : throw new InvalidOperationException("Current user id is invalid.");
    }
}

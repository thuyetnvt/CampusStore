using System.Security.Claims;
using CampusStore.Application.Common;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Entities;
using CampusStore.Domain.Enums;
using CampusStore.Domain.Rules;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/orders")]
public sealed class OrdersController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public OrdersController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<OrderListItemDto>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 30);

        var orders = _dbContext.Orders
            .AsNoTracking()
            .Where(item => item.UserId == userId)
            .OrderByDescending(item => item.CreatedAt);

        var totalItems = await orders.CountAsync(cancellationToken);
        var items = await orders
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(order => new OrderListItemDto(
                order.Id,
                order.OrderCode,
                order.TotalAmount,
                order.OrderStatus,
                order.PaymentStatus,
                order.CreatedAt,
                _dbContext.OrderItems
                    .Where(item => item.OrderId == order.Id)
                    .Sum(item => (int?)item.Quantity) ?? 0))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<OrderListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpPost]
    public async Task<ActionResult<OrderCreatedDto>> Create(
        [FromBody] CreateOrderRequest request,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(request.ReceiverName)
            || string.IsNullOrWhiteSpace(request.ReceiverPhone)
            || string.IsNullOrWhiteSpace(request.ShippingAddress))
        {
            return BadRequest(new { message = "Thong tin nhan hang khong hop le." });
        }

        var userId = GetCurrentUserId();
        var cart = await _dbContext.Carts.FirstOrDefaultAsync(item => item.UserId == userId, cancellationToken);
        if (cart is null)
        {
            return BadRequest(new { message = "Giỏ hàng đang trống." });
        }

        var cartItems = await BuildCartItemsAsync(cart.Id, cancellationToken);
        if (cartItems.Count == 0)
        {
            return BadRequest(new { message = "Giỏ hàng đang trống." });
        }

        foreach (var item in cartItems)
        {
            if (item.Quantity <= 0 || item.Quantity > item.StockQuantity)
            {
                return BadRequest(new { message = $"Sản phẩm {item.ProductName} không đủ tồn kho." });
            }
        }

        var preview = await BuildPreviewAsync(cartItems, request.CouponCode, cancellationToken);
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync<ActionResult<OrderCreatedDto>>(async () =>
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);

            var order = new Order
            {
                OrderCode = $"CS{DateTimeOffset.UtcNow:yyyyMMddHHmmssfff}",
                UserId = userId,
                ReceiverName = request.ReceiverName.Trim(),
                ReceiverPhone = request.ReceiverPhone.Trim(),
                ShippingAddress = request.ShippingAddress.Trim(),
                Subtotal = preview.Subtotal,
                DiscountAmount = preview.DiscountAmount,
                ShippingFee = preview.ShippingFee,
                TotalAmount = preview.TotalAmount,
                PaymentMethod = request.PaymentMethod,
                PaymentStatus = request.PaymentMethod == PaymentMethod.Cod ? PaymentStatus.Unpaid : PaymentStatus.Pending,
                OrderStatus = OrderStatus.Pending,
                Note = request.Note,
                CreatedAt = DateTimeOffset.UtcNow
            };

            _dbContext.Orders.Add(order);
            await _dbContext.SaveChangesAsync(cancellationToken);

            foreach (var item in cartItems)
            {
                var variant = await _dbContext.ProductVariants.FirstAsync(
                    value => value.Id == item.ProductVariantId,
                    cancellationToken);

                if (variant.StockQuantity < item.Quantity)
                {
                return BadRequest(new { message = $"Sản phẩm {item.ProductName} không đủ tồn kho." });
                }

                variant.StockQuantity -= item.Quantity;

                _dbContext.OrderItems.Add(new OrderItem
                {
                    OrderId = order.Id,
                    ProductVariantId = variant.Id,
                    ProductName = item.ProductName,
                    Sku = item.Sku,
                    VariantDescription = string.Join(", ", new[] { item.Color, item.Size }.Where(value => !string.IsNullOrWhiteSpace(value))),
                    UnitPrice = item.UnitPrice,
                    Quantity = item.Quantity,
                    LineTotal = item.LineTotal
                });
            }

            _dbContext.Payments.Add(new Payment
            {
                OrderId = order.Id,
                Method = order.PaymentMethod,
                Amount = order.TotalAmount,
                Status = order.PaymentStatus,
                CreatedAt = DateTimeOffset.UtcNow
            });

            _dbContext.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = OrderStatus.Pending,
                NewStatus = OrderStatus.Pending,
                ChangedByUserId = userId,
                Note = "Đơn hàng được tạo.",
                CreatedAt = DateTimeOffset.UtcNow
            });

            var currentCartItems = await _dbContext.CartItems.Where(item => item.CartId == cart.Id).ToListAsync(cancellationToken);
            _dbContext.CartItems.RemoveRange(currentCartItems);

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return CreatedAtAction(nameof(GetById), new { id = order.Id }, new OrderCreatedDto(order.Id, order.OrderCode, order.TotalAmount));
        });
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<OrderDetailDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var order = await _dbContext.Orders
            .AsNoTracking()
            .FirstOrDefaultAsync(item => item.Id == id && item.UserId == userId, cancellationToken);

        if (order is null)
        {
            return NotFound();
        }

        return Ok(await BuildOrderDetailAsync(order, cancellationToken));
    }

    [HttpPost("{id:long}/cancel")]
    public async Task<IActionResult> Cancel(
        long id,
        [FromBody] CancelOrderRequest request,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync<IActionResult>(async () =>
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            var order = await _dbContext.Orders.FirstOrDefaultAsync(
                item => item.Id == id && item.UserId == userId,
                cancellationToken);

            if (order is null)
            {
                return NotFound();
            }

            if (!OrderStatusFlow.CanTransition(order.OrderStatus, OrderStatus.Cancelled))
            {
                return BadRequest(new { message = "Đơn hàng không thể hủy ở trạng thái hiện tại." });
            }

            var oldStatus = order.OrderStatus;
            var items = await _dbContext.OrderItems
                .Where(item => item.OrderId == order.Id && item.ProductVariantId != null)
                .ToListAsync(cancellationToken);

            foreach (var item in items)
            {
                var variant = await _dbContext.ProductVariants.FirstAsync(
                    value => value.Id == item.ProductVariantId!.Value,
                    cancellationToken);
                variant.StockQuantity += item.Quantity;
            }

            order.OrderStatus = OrderStatus.Cancelled;
            order.CancellationReason = string.IsNullOrWhiteSpace(request.Reason)
                ? "Khách hàng đã hủy đơn."
                : request.Reason.Trim();
            order.UpdatedAt = DateTimeOffset.UtcNow;

            _dbContext.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = oldStatus,
                NewStatus = OrderStatus.Cancelled,
                ChangedByUserId = userId,
                Note = order.CancellationReason,
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return NoContent();
        });
    }

    private long GetCurrentUserId()
    {
        var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(rawUserId, out var userId)
            ? userId
            : throw new InvalidOperationException("Current user id is invalid.");
    }

    private async Task<List<CartItemDto>> BuildCartItemsAsync(long cartId, CancellationToken cancellationToken)
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

    private async Task<CheckoutPreviewDto> BuildPreviewAsync(
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

    private async Task<OrderDetailDto> BuildOrderDetailAsync(Order order, CancellationToken cancellationToken)
    {
        var items = await _dbContext.OrderItems
            .AsNoTracking()
            .Where(item => item.OrderId == order.Id)
            .GroupJoin(
                _dbContext.ProductVariants.AsNoTracking(),
                item => item.ProductVariantId,
                variant => variant.Id,
                (item, variants) => new { item, variant = variants.FirstOrDefault() })
            .Select(row => new OrderItemDto(
                row.item.Id,
                row.item.ProductVariantId,
                row.variant == null ? null : row.variant.ProductId,
                row.item.ProductName,
                row.item.Sku,
                row.item.VariantDescription,
                row.item.UnitPrice,
                row.item.Quantity,
                row.item.LineTotal,
                row.variant == null
                    ? null
                    : _dbContext.ProductImages
                        .Where(image => image.ProductId == row.variant.ProductId)
                        .OrderByDescending(image => image.IsPrimary)
                        .ThenBy(image => image.SortOrder)
                        .Select(image => image.ImageUrl)
                        .FirstOrDefault(),
                _dbContext.Reviews.Any(review => review.OrderItemId == row.item.Id)))
            .ToListAsync(cancellationToken);

        var histories = await _dbContext.OrderStatusHistories
            .AsNoTracking()
            .Where(item => item.OrderId == order.Id)
            .OrderBy(item => item.CreatedAt)
            .Select(item => new OrderStatusHistoryDto(item.OldStatus, item.NewStatus, item.Note, item.CreatedAt))
            .ToListAsync(cancellationToken);

        return new OrderDetailDto(
            order.Id,
            order.OrderCode,
            order.ReceiverName,
            order.ReceiverPhone,
            order.ShippingAddress,
            order.Subtotal,
            order.DiscountAmount,
            order.ShippingFee,
            order.TotalAmount,
            order.PaymentMethod,
            order.PaymentStatus,
            order.OrderStatus,
            order.Note,
            order.CancellationReason,
            order.CreatedAt,
            items,
            histories);
    }
}

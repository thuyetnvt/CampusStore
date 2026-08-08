using System.Security.Claims;
using CampusStore.Application.Common;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Constants;
using CampusStore.Domain.Entities;
using CampusStore.Domain.Enums;
using CampusStore.Domain.Rules;
using CampusStore.Infrastructure.Identity;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{RoleNames.Staff},{RoleNames.Admin}")]
[Route("api/admin/orders")]
public sealed class AdminOrdersController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminOrdersController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminOrderListItemDto>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] OrderStatus? status = null,
        [FromQuery] string? keyword = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 60);

        var orders = _dbContext.Orders.AsNoTracking();
        if (status is not null)
        {
            orders = orders.Where(order => order.OrderStatus == status.Value);
        }

        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var value = keyword.Trim();
            orders = orders.Where(order =>
                order.OrderCode.Contains(value)
                || order.ReceiverName.Contains(value)
                || order.ReceiverPhone.Contains(value));
        }

        var query = orders
            .Join(
                _dbContext.Users.AsNoTracking(),
                order => order.UserId,
                user => user.Id,
                (order, user) => new { order, user })
            .OrderByDescending(row => row.order.CreatedAt);

        var totalItems = await query.CountAsync(cancellationToken);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(row => new AdminOrderListItemDto(
                row.order.Id,
                row.order.OrderCode,
                row.order.UserId,
                row.user.FullName,
                row.user.Email ?? string.Empty,
                row.order.TotalAmount,
                row.order.OrderStatus,
                row.order.PaymentStatus,
                row.order.CreatedAt,
                _dbContext.OrderItems
                    .Where(item => item.OrderId == row.order.Id)
                    .Sum(item => (int?)item.Quantity) ?? 0))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<AdminOrderListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<AdminOrderDetailDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var order = await _dbContext.Orders.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (order is null)
        {
            return NotFound();
        }

        var user = await _dbContext.Users.AsNoTracking().FirstAsync(item => item.Id == order.UserId, cancellationToken);
        return Ok(await BuildOrderDetailAsync(order, user, cancellationToken));
    }

    [HttpPut("{id:long}/status")]
    public async Task<IActionResult> UpdateStatus(
        long id,
        [FromBody] UpdateOrderStatusRequest request,
        CancellationToken cancellationToken)
    {
        var changedByUserId = GetCurrentUserId();
        var strategy = _dbContext.Database.CreateExecutionStrategy();

        return await strategy.ExecuteAsync<IActionResult>(async () =>
        {
            await using var transaction = await _dbContext.Database.BeginTransactionAsync(cancellationToken);
            var order = await _dbContext.Orders.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
            if (order is null)
            {
                return NotFound();
            }

            if (!OrderStatusFlow.CanTransition(order.OrderStatus, request.Status))
            {
                return BadRequest(new { message = "Chuyển trạng thái đơn hàng không hợp lệ." });
            }

            var oldStatus = order.OrderStatus;
            if (request.Status == OrderStatus.Cancelled)
            {
                await RestoreStockAsync(order.Id, cancellationToken);
                order.CancellationReason = string.IsNullOrWhiteSpace(request.Note)
                    ? "Nhân viên đã hủy đơn."
                    : request.Note.Trim();
            }

            order.OrderStatus = request.Status;
            order.UpdatedAt = DateTimeOffset.UtcNow;

            if (request.Status == OrderStatus.Completed)
            {
                order.PaymentStatus = PaymentStatus.Paid;
                var payment = await _dbContext.Payments.FirstOrDefaultAsync(item => item.OrderId == order.Id, cancellationToken);
                if (payment is not null)
                {
                    payment.Status = PaymentStatus.Paid;
                    payment.PaidAt = DateTimeOffset.UtcNow;
                }
            }

            _dbContext.OrderStatusHistories.Add(new OrderStatusHistory
            {
                OrderId = order.Id,
                OldStatus = oldStatus,
                NewStatus = request.Status,
                ChangedByUserId = changedByUserId,
                Note = request.Note,
                CreatedAt = DateTimeOffset.UtcNow
            });

            await _dbContext.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            return NoContent();
        });
    }

    private async Task RestoreStockAsync(long orderId, CancellationToken cancellationToken)
    {
        var items = await _dbContext.OrderItems
            .Where(item => item.OrderId == orderId && item.ProductVariantId != null)
            .ToListAsync(cancellationToken);

        foreach (var item in items)
        {
            var variant = await _dbContext.ProductVariants.FirstAsync(
                value => value.Id == item.ProductVariantId!.Value,
                cancellationToken);
            variant.StockQuantity += item.Quantity;
        }
    }

    private async Task<AdminOrderDetailDto> BuildOrderDetailAsync(
        Order order,
        ApplicationUser user,
        CancellationToken cancellationToken)
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

        return new AdminOrderDetailDto(
            order.Id,
            order.OrderCode,
            order.UserId,
            user.FullName,
            user.Email ?? string.Empty,
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

    private long GetCurrentUserId()
    {
        var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(rawUserId, out var userId)
            ? userId
            : throw new InvalidOperationException("Current user id is invalid.");
    }
}

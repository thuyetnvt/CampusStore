using CampusStore.Application.Dtos;
using CampusStore.Domain.Constants;
using CampusStore.Domain.Enums;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Roles = $"{RoleNames.Staff},{RoleNames.Admin}")]
[Route("api/admin/dashboard")]
public sealed class AdminDashboardController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminDashboardController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<AdminDashboardDto>> Get(CancellationToken cancellationToken)
    {
        var completedOrders = _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.OrderStatus == OrderStatus.Completed);

        var completedRevenue = await completedOrders.SumAsync(order => (decimal?)order.TotalAmount, cancellationToken) ?? 0;
        var totalOrders = await _dbContext.Orders.AsNoTracking().CountAsync(cancellationToken);
        var pendingOrders = await _dbContext.Orders.AsNoTracking().CountAsync(
            order => order.OrderStatus == OrderStatus.Pending,
            cancellationToken);
        var completedOrderCount = await completedOrders.CountAsync(cancellationToken);
        var cancelledOrders = await _dbContext.Orders.AsNoTracking().CountAsync(
            order => order.OrderStatus == OrderStatus.Cancelled,
            cancellationToken);
        var totalProducts = await _dbContext.Products.AsNoTracking().CountAsync(product => product.IsActive, cancellationToken);
        var lowStockVariants = await _dbContext.ProductVariants.AsNoTracking().CountAsync(
            variant => variant.IsActive && variant.StockQuantity <= variant.LowStockThreshold,
            cancellationToken);
        var totalCustomers = await _dbContext.Users.AsNoTracking().CountAsync(cancellationToken);

        var ordersByStatus = (await _dbContext.Orders
                .AsNoTracking()
                .GroupBy(order => order.OrderStatus)
                .Select(group => new OrderStatusCountDto(group.Key, group.Count()))
                .ToListAsync(cancellationToken))
            .OrderBy(item => item.Status)
            .ToList();

        var topProductRows = await _dbContext.OrderItems
            .AsNoTracking()
            .Join(
                completedOrders,
                item => item.OrderId,
                order => order.Id,
                (item, order) => item)
            .Where(item => item.ProductVariantId != null)
            .Join(
                _dbContext.ProductVariants.AsNoTracking(),
                item => item.ProductVariantId!.Value,
                variant => variant.Id,
                (item, variant) => new
                {
                    variant.ProductId,
                    item.ProductName,
                    item.Quantity,
                    item.LineTotal
                })
            .ToListAsync(cancellationToken);

        var topProducts = topProductRows
            .GroupBy(row => new { row.ProductId, row.ProductName })
            .Select(group => new TopProductDto(
                group.Key.ProductId,
                group.Key.ProductName,
                group.Sum(row => row.Quantity),
                group.Sum(row => row.LineTotal)))
            .OrderByDescending(item => item.QuantitySold)
            .ThenByDescending(item => item.Revenue)
            .Take(5)
            .ToList();

        var lowStockRows = await _dbContext.ProductVariants
            .AsNoTracking()
            .Where(variant => variant.IsActive && variant.StockQuantity <= variant.LowStockThreshold)
            .Join(
                _dbContext.Products.AsNoTracking(),
                variant => variant.ProductId,
                product => product.Id,
                (variant, product) => new LowStockVariantDto(
                    product.Id,
                    variant.Id,
                    product.Name,
                    variant.Sku,
                    variant.StockQuantity,
                    variant.LowStockThreshold))
            .ToListAsync(cancellationToken);

        var lowStockItems = lowStockRows
            .OrderBy(item => item.StockQuantity)
            .ThenBy(item => item.ProductName)
            .Take(8)
            .ToList();

        var recentOrders = await _dbContext.Orders
            .AsNoTracking()
            .Join(
                _dbContext.Users.AsNoTracking(),
                order => order.UserId,
                user => user.Id,
                (order, user) => new { order, user })
            .OrderByDescending(row => row.order.CreatedAt)
            .Take(8)
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

        return Ok(new AdminDashboardDto(
            completedRevenue,
            totalOrders,
            pendingOrders,
            completedOrderCount,
            cancelledOrders,
            totalProducts,
            lowStockVariants,
            totalCustomers,
            ordersByStatus,
            topProducts,
            lowStockItems,
            recentOrders));
    }
}

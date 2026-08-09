using CampusStore.Api;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Enums;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
[Route("api/admin/dashboard")]
public sealed class AdminDashboardController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminDashboardController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<AdminDashboardDto>> Get(
        [FromQuery] string? range = null,
        CancellationToken cancellationToken = default)
    {
        var trendRange = NormalizeTrendRange(range);
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
                .Select(order => order.OrderStatus)
                .ToListAsync(cancellationToken))
            .Select(NormalizeStatus)
            .GroupBy(status => status)
            .Select(group => new OrderStatusCountDto(group.Key, group.Count()))
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

        var trendPoints = await BuildTrendPointsAsync(trendRange, cancellationToken);

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
            recentOrders,
            trendPoints,
            trendRange));
    }

    private async Task<IReadOnlyList<AdminDashboardTrendPointDto>> BuildTrendPointsAsync(
        string range,
        CancellationToken cancellationToken)
    {
        var buckets = BuildBuckets(range);
        var start = buckets.First().Start;
        var end = buckets.Last().End;

        var orders = await _dbContext.Orders
            .AsNoTracking()
            .Where(order => order.CreatedAt >= start && order.CreatedAt < end)
            .Select(order => new
            {
                order.CreatedAt,
                order.TotalAmount,
                order.OrderStatus
            })
            .ToListAsync(cancellationToken);

        var revenueByBucket = orders
            .Where(order => order.OrderStatus == OrderStatus.Completed)
            .GroupBy(order => GetBucketStart(order.CreatedAt, range))
            .ToDictionary(group => group.Key, group => group.Sum(order => order.TotalAmount));

        var ordersByBucket = orders
            .GroupBy(order => GetBucketStart(order.CreatedAt, range))
            .ToDictionary(group => group.Key, group => group.Count());

        return buckets
            .Select(bucket => new AdminDashboardTrendPointDto(
                bucket.Label,
                revenueByBucket.GetValueOrDefault(bucket.Start, 0),
                ordersByBucket.GetValueOrDefault(bucket.Start, 0)))
            .ToList();
    }

    private static string NormalizeTrendRange(string? range)
    {
        return range?.Trim().ToLowerInvariant() switch
        {
            "day" => "day",
            "week" => "week",
            "month" => "month",
            _ => "day"
        };
    }

    private static OrderStatus NormalizeStatus(OrderStatus status)
    {
        return status == (OrderStatus)3 ? OrderStatus.Shipping : status;
    }

    private static IReadOnlyList<TrendBucket> BuildBuckets(string range)
    {
        var today = DateTimeOffset.UtcNow.Date;
        return range switch
        {
            "week" => BuildWeekBuckets(today),
            "month" => BuildMonthBuckets(today),
            _ => BuildDayBuckets(today)
        };
    }

    private static IReadOnlyList<TrendBucket> BuildDayBuckets(DateTime today)
    {
        var start = new DateTimeOffset(today.AddDays(-13), TimeSpan.Zero);
        return Enumerable.Range(0, 14)
            .Select(index =>
            {
                var bucketStart = start.AddDays(index);
                return new TrendBucket(
                    bucketStart,
                    bucketStart.AddDays(1),
                    bucketStart.ToString("dd/MM"));
            })
            .ToList();
    }

    private static IReadOnlyList<TrendBucket> BuildWeekBuckets(DateTime today)
    {
        var startOfThisWeek = today.AddDays(-GetMondayOffset(today.DayOfWeek));
        var start = new DateTimeOffset(startOfThisWeek.AddDays(-77), TimeSpan.Zero);
        return Enumerable.Range(0, 12)
            .Select(index =>
            {
                var bucketStart = start.AddDays(index * 7);
                return new TrendBucket(
                    bucketStart,
                    bucketStart.AddDays(7),
                    $"Tuần {bucketStart:dd/MM}");
            })
            .ToList();
    }

    private static IReadOnlyList<TrendBucket> BuildMonthBuckets(DateTime today)
    {
        var startOfThisMonth = new DateTime(today.Year, today.Month, 1);
        var start = new DateTimeOffset(startOfThisMonth.AddMonths(-11), TimeSpan.Zero);
        return Enumerable.Range(0, 12)
            .Select(index =>
            {
                var bucketStart = start.AddMonths(index);
                return new TrendBucket(
                    bucketStart,
                    bucketStart.AddMonths(1),
                    bucketStart.ToString("MM/yyyy"));
            })
            .ToList();
    }

    private static DateTimeOffset GetBucketStart(DateTimeOffset value, string range)
    {
        var date = value.UtcDateTime.Date;
        return range switch
        {
            "week" => new DateTimeOffset(date.AddDays(-GetMondayOffset(date.DayOfWeek)), TimeSpan.Zero),
            "month" => new DateTimeOffset(new DateTime(date.Year, date.Month, 1), TimeSpan.Zero),
            _ => new DateTimeOffset(date, TimeSpan.Zero)
        };
    }

    private static int GetMondayOffset(DayOfWeek dayOfWeek)
    {
        return ((int)dayOfWeek + 6) % 7;
    }

    private sealed record TrendBucket(DateTimeOffset Start, DateTimeOffset End, string Label);
}

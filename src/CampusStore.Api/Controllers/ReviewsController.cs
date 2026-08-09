using System.Security.Claims;
using CampusStore.Api;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Entities;
using CampusStore.Domain.Enums;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.CustomerOnly)]
[Route("api/reviews")]
public sealed class ReviewsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public ReviewsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateReviewRequest request, CancellationToken cancellationToken)
    {
        if (request.Rating is < 1 or > 5)
        {
            return BadRequest(new { message = "Danh gia phai tu 1 den 5 sao." });
        }

        var userId = GetCurrentUserId();
        var orderItem = await _dbContext.OrderItems
            .AsNoTracking()
            .Where(item => item.Id == request.OrderItemId)
            .Join(
                _dbContext.Orders.AsNoTracking().Where(order => order.UserId == userId),
                item => item.OrderId,
                order => order.Id,
                (item, order) => new { item, order })
            .FirstOrDefaultAsync(cancellationToken);

        if (orderItem is null)
        {
            return NotFound();
        }

        if (orderItem.order.OrderStatus != OrderStatus.Completed)
        {
            return BadRequest(new { message = "Chi co the danh gia san pham trong don da hoan tat." });
        }

        if (await _dbContext.Reviews.AnyAsync(review => review.OrderItemId == request.OrderItemId, cancellationToken))
        {
            return Conflict(new { message = "Sản phẩm trong đơn này đã được đánh giá." });
        }

        if (orderItem.item.ProductVariantId is null)
        {
            return BadRequest(new { message = "Không tìm thấy phiên bản sản phẩm để đánh giá." });
        }

        var productId = await _dbContext.ProductVariants
            .AsNoTracking()
            .Where(variant => variant.Id == orderItem.item.ProductVariantId.Value)
            .Select(variant => (long?)variant.ProductId)
            .FirstOrDefaultAsync(cancellationToken);

        if (productId is null)
        {
            return BadRequest(new { message = "Không tìm thấy sản phẩm để đánh giá." });
        }

        var review = new Review
        {
            UserId = userId,
            OrderItemId = request.OrderItemId,
            ProductId = productId.Value,
            Rating = request.Rating,
            Comment = string.IsNullOrWhiteSpace(request.Comment) ? null : request.Comment.Trim(),
            IsVisible = true,
            CreatedAt = DateTimeOffset.UtcNow
        };

        _dbContext.Reviews.Add(review);
        await _dbContext.SaveChangesAsync(cancellationToken);

        return Created($"/api/products/{productId}", new { review.Id });
    }

    private long GetCurrentUserId()
    {
        var rawUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return long.TryParse(rawUserId, out var userId)
            ? userId
            : throw new InvalidOperationException("Current user id is invalid.");
    }
}

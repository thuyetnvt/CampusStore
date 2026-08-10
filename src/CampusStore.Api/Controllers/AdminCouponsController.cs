using CampusStore.Api;
using CampusStore.Application.Common;
using CampusStore.Application.Dtos;
using CampusStore.Domain.Entities;
using CampusStore.Domain.Enums;
using CampusStore.Infrastructure.Persistence;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CampusStore.Api.Controllers;

[ApiController]
[Authorize(Policy = AuthPolicies.StaffOrAdmin)]
[Route("api/admin/coupons")]
public sealed class AdminCouponsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public AdminCouponsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<AdminCouponListItemDto>>> Get(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        [FromQuery] string? keyword = null,
        [FromQuery] bool? isActive = null,
        CancellationToken cancellationToken = default)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 60);

        var query = _dbContext.Coupons.AsNoTracking();
        if (!string.IsNullOrWhiteSpace(keyword))
        {
            var value = keyword.Trim().ToUpperInvariant();
            query = query.Where(coupon => coupon.Code.ToUpper().Contains(value));
        }

        if (isActive is not null)
        {
            query = query.Where(coupon => coupon.IsActive == isActive.Value);
        }

        var now = DateTimeOffset.UtcNow;
        var ordered = query.OrderByDescending(coupon => coupon.StartAt).ThenBy(coupon => coupon.Code);
        var totalItems = await ordered.CountAsync(cancellationToken);
        var items = await ordered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(coupon => new AdminCouponListItemDto(
                coupon.Id,
                coupon.Code,
                coupon.DiscountType,
                coupon.DiscountValue,
                coupon.MinimumOrderAmount,
                coupon.MaximumDiscountAmount,
                coupon.StartAt,
                coupon.EndAt,
                coupon.UsageLimit,
                coupon.UsedCount,
                coupon.IsActive,
                !coupon.IsActive
                    ? "Đang tắt"
                    : now < coupon.StartAt
                        ? "Chưa bắt đầu"
                        : now > coupon.EndAt
                            ? "Hết hạn"
                            : coupon.UsedCount >= coupon.UsageLimit
                                ? "Hết lượt"
                                : "Đang chạy"))
            .ToListAsync(cancellationToken);

        return Ok(new PagedResult<AdminCouponListItemDto>
        {
            Items = items,
            Page = page,
            PageSize = pageSize,
            TotalItems = totalItems,
            TotalPages = (int)Math.Ceiling(totalItems / (double)pageSize)
        });
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<AdminCouponListItemDto>> GetById(long id, CancellationToken cancellationToken)
    {
        var coupon = await _dbContext.Coupons.AsNoTracking().FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (coupon is null)
        {
            return NotFound();
        }

        return Ok(ToDto(coupon, DateTimeOffset.UtcNow));
    }

    [HttpPost]
    public async Task<ActionResult<AdminCouponListItemDto>> Create(
        [FromBody] AdminCouponUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var code = request.Code.Trim().ToUpperInvariant();
        if (await _dbContext.Coupons.AsNoTracking().AnyAsync(item => item.Code.ToUpper() == code, cancellationToken))
        {
            return Conflict(new { message = "Mã voucher đã tồn tại." });
        }

        var coupon = new Coupon
        {
            Code = code,
            DiscountType = request.DiscountType,
            DiscountValue = request.DiscountValue,
            MinimumOrderAmount = request.MinimumOrderAmount,
            MaximumDiscountAmount = request.MaximumDiscountAmount,
            StartAt = request.StartAt,
            EndAt = request.EndAt,
            UsageLimit = request.UsageLimit,
            UsedCount = 0,
            IsActive = request.IsActive
        };

        _dbContext.Coupons.Add(coupon);
        await _dbContext.SaveChangesAsync(cancellationToken);
        return CreatedAtAction(nameof(GetById), new { id = coupon.Id }, ToDto(coupon, DateTimeOffset.UtcNow));
    }

    [HttpPut("{id:long}")]
    public async Task<ActionResult<AdminCouponListItemDto>> Update(
        long id,
        [FromBody] AdminCouponUpsertRequest request,
        CancellationToken cancellationToken)
    {
        var validationError = ValidateRequest(request);
        if (validationError is not null)
        {
            return BadRequest(new { message = validationError });
        }

        var coupon = await _dbContext.Coupons.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (coupon is null)
        {
            return NotFound();
        }

        var code = request.Code.Trim().ToUpperInvariant();
        if (await _dbContext.Coupons.AsNoTracking().AnyAsync(item => item.Id != id && item.Code.ToUpper() == code, cancellationToken))
        {
            return Conflict(new { message = "Mã voucher đã tồn tại." });
        }

        coupon.Code = code;
        coupon.DiscountType = request.DiscountType;
        coupon.DiscountValue = request.DiscountValue;
        coupon.MinimumOrderAmount = request.MinimumOrderAmount;
        coupon.MaximumDiscountAmount = request.MaximumDiscountAmount;
        coupon.StartAt = request.StartAt;
        coupon.EndAt = request.EndAt;
        coupon.UsageLimit = request.UsageLimit;
        coupon.IsActive = request.IsActive;

        await _dbContext.SaveChangesAsync(cancellationToken);
        return Ok(ToDto(coupon, DateTimeOffset.UtcNow));
    }

    [HttpPatch("{id:long}/active")]
    public async Task<IActionResult> SetActive(
        long id,
        [FromBody] AdminCouponActiveRequest request,
        CancellationToken cancellationToken)
    {
        var coupon = await _dbContext.Coupons.FirstOrDefaultAsync(item => item.Id == id, cancellationToken);
        if (coupon is null)
        {
            return NotFound();
        }

        coupon.IsActive = request.IsActive;
        await _dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static AdminCouponListItemDto ToDto(Coupon coupon, DateTimeOffset now)
    {
        return new AdminCouponListItemDto(
            coupon.Id,
            coupon.Code,
            coupon.DiscountType,
            coupon.DiscountValue,
            coupon.MinimumOrderAmount,
            coupon.MaximumDiscountAmount,
            coupon.StartAt,
            coupon.EndAt,
            coupon.UsageLimit,
            coupon.UsedCount,
            coupon.IsActive,
            GetStatus(coupon, now));
    }

    private static string GetStatus(Coupon coupon, DateTimeOffset now)
    {
        if (!coupon.IsActive)
        {
            return "Đang tắt";
        }

        if (now < coupon.StartAt)
        {
            return "Chưa bắt đầu";
        }

        if (now > coupon.EndAt)
        {
            return "Hết hạn";
        }

        return coupon.UsedCount >= coupon.UsageLimit ? "Hết lượt" : "Đang chạy";
    }

    private static string? ValidateRequest(AdminCouponUpsertRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Code))
        {
            return "Mã voucher không được để trống.";
        }

        if (request.Code.Trim().Length > 80)
        {
            return "Mã voucher không được vượt quá 80 ký tự.";
        }

        if (!Enum.IsDefined(typeof(DiscountType), request.DiscountType))
        {
            return "Loại voucher không hợp lệ.";
        }

        if (request.DiscountValue <= 0)
        {
            return "Giá trị giảm phải lớn hơn 0.";
        }

        if (request.DiscountType == DiscountType.Percentage && request.DiscountValue > 100)
        {
            return "Phần trăm giảm không được vượt quá 100%.";
        }

        if (request.MinimumOrderAmount < 0)
        {
            return "Đơn tối thiểu không được nhỏ hơn 0.";
        }

        if (request.MaximumDiscountAmount is not null && request.MaximumDiscountAmount <= 0)
        {
            return "Mức giảm tối đa phải lớn hơn 0.";
        }

        if (request.UsageLimit <= 0)
        {
            return "Số lượt sử dụng phải lớn hơn 0.";
        }

        if (request.StartAt >= request.EndAt)
        {
            return "Thời gian kết thúc phải sau thời gian bắt đầu.";
        }

        return null;
    }
}

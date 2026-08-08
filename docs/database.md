# CampusStore Database Design

## Database Rules

- MySQL 8+.
- InnoDB storage engine.
- `utf8mb4` charset.
- Unicode-compatible collation.
- Monetary values use `decimal(18,2)`.
- Time values are stored in UTC.
- Use migrations to create schema.

## Main Tables

- `ApplicationUser`
- `Address`
- `Category`
- `Product`
- `ProductVariant`
- `ProductImage`
- `Cart`
- `CartItem`
- `Coupon`
- `Order`
- `OrderItem`
- `Payment`
- `Review`
- `OrderStatusHistory`
- `AuditLog`

## Implementation Status

- Domain entities and enums have been created in `src/CampusStore.Domain`.
- `ApplicationUser` has been created in Infrastructure with ASP.NET Core Identity's `IdentityUser<long>`.
- EF Core `AppDbContext`, entity configurations, and `InitialCreate` migration are implemented.
- Local database update succeeded with the MySQL user `campusstore`.

## Important Indexes

- Unique email through Identity.
- Unique SKU.
- Unique order code.
- Unique coupon code, checked case-insensitively.
- Unique cart item pair: `CartId`, `ProductVariantId`.
- Unique review per `OrderItem`.

## Order Status Flow

```text
Pending -> Confirmed
Pending -> Cancelled
Confirmed -> Preparing
Confirmed -> Cancelled
Preparing -> Shipping
Preparing -> Cancelled
Shipping -> Completed
```

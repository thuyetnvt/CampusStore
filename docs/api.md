# CampusStore API

All endpoints use the `/api` prefix.

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
```

## Categories

```text
GET    /api/categories
GET    /api/categories/{id}
```

## Products

```text
GET    /api/products
GET    /api/products/{idOrSlug}
GET    /api/products/{id}/related
```

`GET /api/products` supports query filters from `ProductQuery` plus `saleOnly=true`.

## Cart and Checkout

```text
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/{id}
DELETE /api/cart/items/{id}
DELETE /api/cart
POST   /api/checkout/preview
```

## Orders

```text
GET    /api/orders
POST   /api/orders
GET    /api/orders/{id}
POST   /api/orders/{id}/cancel
```

## Reviews

```text
POST   /api/reviews
```

## Admin

```text
GET    /api/admin/dashboard
GET    /api/admin/dashboard?range=day|week|month
GET    /api/admin/orders
GET    /api/admin/orders/{id}
PUT    /api/admin/orders/{id}/status
GET    /api/admin/products
GET    /api/admin/products/{id}
POST   /api/admin/products
PUT    /api/admin/products/{id}
PATCH  /api/admin/products/{id}/active
```

## Error Responses

Error payloads are controller-specific in the current codebase.
Most endpoints return a JSON object with a `message` field for business-rule failures.
ASP.NET Core model validation may still return the framework's default 400 response shape.


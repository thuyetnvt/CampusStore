# CampusStore API

All endpoints use the `/api` prefix.

## Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
```

## Categories

```text
GET    /api/categories
GET    /api/categories/{id}
POST   /api/admin/categories
PUT    /api/admin/categories/{id}
PATCH  /api/admin/categories/{id}/status
```

## Products

```text
GET    /api/products
GET    /api/products/{idOrSlug}
GET    /api/products/{id}/related
POST   /api/admin/products
PUT    /api/admin/products/{id}
PATCH  /api/admin/products/{id}/status
POST   /api/admin/products/{id}/images
DELETE /api/admin/products/{id}/images/{imageId}
```

## Cart and Checkout

```text
GET    /api/cart
POST   /api/cart/items
PUT    /api/cart/items/{id}
DELETE /api/cart/items/{id}
DELETE /api/cart
POST   /api/checkout/preview
POST   /api/orders
```

## Orders

```text
GET    /api/orders
GET    /api/orders/{id}
POST   /api/orders/{id}/cancel
GET    /api/admin/orders
GET    /api/admin/orders/{id}
PATCH  /api/admin/orders/{id}/status
```

## Dashboard

```text
GET    /api/admin/dashboard/summary
GET    /api/admin/dashboard/revenue
GET    /api/admin/dashboard/best-sellers
GET    /api/admin/dashboard/low-stock
```

## Error Shape

```json
{
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Du lieu khong hop le.",
  "errors": {
    "fieldName": ["Noi dung loi"]
  }
}
```

# CampusStore Requirements

## Context

The assignment requires surveying Lazada.vn, evaluating its e-commerce workflows, and building a different simple e-commerce website. CampusStore uses a B2C single-seller model for student supplies.

## Users

- Guest: browse home, categories, products, details, reviews, register, login.
- Customer: manage profile, addresses, cart, checkout, orders, cancellation, reviews.
- Staff: manage stock, process orders, update order status, view basic dashboard.
- Admin: manage categories, products, variants, images, stock, vouchers, orders, users, revenue reports, and audit logs.

## MVP Priority

1. Authentication and roles.
2. Categories and products.
3. Search, filter, sort, and paging.
4. Cart and checkout.
5. Order creation with stock transaction.
6. Customer order history and cancellation.
7. Admin product and order management.
8. Dashboard summary.

## Important Business Rules

- Backend recalculates all prices and totals.
- Quantity must be greater than zero.
- Customers cannot buy beyond available stock.
- Order creation and stock deduction happen in one transaction.
- Cancelled orders restore stock exactly once.
- Customers can only view their own orders.
- Only completed orders count as revenue.
- Only completed purchased items can be reviewed.
- Each order item can be reviewed once.

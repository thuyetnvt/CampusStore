# CampusStore Testing

## Required Backend Tests

- Duplicate email registration is rejected.
- Wrong login is rejected.
- Admin endpoints reject Customer users.
- Customers cannot view other customers' orders.
- Product search supports paging.
- Cart rejects negative quantity.
- Cart rejects quantity beyond stock.
- Checkout recalculates prices.
- Fake frontend totals do not affect backend totals.
- Expired coupons are rejected.
- Order creation deducts stock.
- Failed order creation rolls back.
- Cancellation restores stock exactly once.
- Invalid order status transitions are rejected.
- Only completed orders count as revenue.
- Reviews require completed purchased items.
- One order item can be reviewed once.
- Invalid upload file types are rejected.

## Required Frontend Checks

- TypeScript build succeeds.
- ESLint succeeds.
- Production build succeeds.
- Login form validation works.
- Product card renders correctly.
- Cart quantity update handles loading/error states.
- Admin route blocks unauthorized users.
- Checkout does not submit totals as trusted data.

## Phase 1 Result

- Backend scaffold created.
- Frontend scaffold created.
- NuGet restore succeeded with `--ignore-failed-sources`.
- Backend build succeeded.
- npm install could not complete in the sandbox because registry access is blocked.

## Phase 2 Partial Result

- Domain entities created for catalog, cart, coupon, orders, payments, reviews, status history, addresses, and audit logs.
- Enums created for user status, discount type, order status, payment method, and payment status.
- Order status transition rule implemented.
- `ApplicationUser` created with `IdentityUser<long>`.
- EF Core 10, ASP.NET Core Identity EF Core 10, and `MySql.EntityFrameworkCore` 10.x installed.
- `AppDbContext` created with Identity tables, MySQL charset/collation, decimal money columns, indexes, and relationships.
- `InitialCreate` migration generated.
- Auth endpoints added for register, login, logout, and `/me`.
- Unit and integration test projects created.
- `dotnet build CampusStore.sln` succeeded with 0 errors.
- `dotnet test CampusStore.sln` passed: 24 tests total.
- `npm run lint` succeeded.
- `npm run build` succeeded.
- `dotnet ef database update` succeeded on local MySQL.
- Build currently reports `NU1903` for transitive `Microsoft.OpenApi 2.0.0` from `Microsoft.AspNetCore.OpenApi`; a direct `Microsoft.OpenApi 2.3.0` upgrade was tested but still reports the same advisory.

## Phase 2 Seed Result

- `Categories`: 8
- `Products`: 51
- `ProductVariants`: 64
- `ProductImages`: 51
- `Coupons`: 5
- `Orders`: 20
- `OrderItems`: 40
- `Payments`: 20
- `Reviews`: 3

## Phase 3 Catalog Result

- `GET /api/categories` implemented.
- `GET /api/categories/{id}` implemented.
- `GET /api/products` implemented with paging, keyword, category, price, stock, rating, and sort filters.
- `GET /api/products/{idOrSlug}` implemented.
- `GET /api/products/{id}/related` implemented.
- React home page now loads categories and product sections from API.
- React product list page now syncs search/category/sort/page with URL query parameters.
- React product detail page now renders variants, stock, reviews, and related products.
- HTTP check passed for `GET /api/products?page=1&pageSize=3`: returned 3 items from 51 total products.

## Phase 4 Cart And Checkout Result

- `GET /api/cart` implemented.
- `POST /api/cart/items` implemented.
- `PUT /api/cart/items/{id}` implemented.
- `DELETE /api/cart/items/{id}` implemented.
- `DELETE /api/cart` implemented.
- `POST /api/checkout/preview` implemented.
- `POST /api/orders` implemented with transactional stock deduction, payment record, status history, and cart clearing.
- React cart page now loads cart data from API and supports quantity updates, item removal, and cart clearing.
- React checkout page now previews backend-calculated totals and creates orders.
- React product detail page can add the selected in-stock variant to the cart.
- `dotnet build CampusStore.sln` succeeded with 0 errors.
- `dotnet test CampusStore.sln --no-build` passed: 24 tests total.
- `npm run lint` succeeded.
- `npm run build` succeeded.

## Safe Archive Preparation

- Development connection strings in `appsettings.json`, `appsettings.Development.json`, and the design-time DbContext factory were changed to use `YOUR_PASSWORD` placeholders.
- Secret scan found no real connection passwords, API keys, client secrets, or access tokens in source files outside ignored build dependency folders.
- `dotnet build CampusStore.sln` succeeded with 0 errors; existing `NU1903` warning for transitive `Microsoft.OpenApi 2.0.0` remains.
- `npm run build` was re-run successfully after changing the cart checkout button to Vietnamese text.
- Runtime smoke check passed: login, clear cart, add product, preview checkout, create order, stock decreased from 21 to 20, and cart became empty.

## Phase 5 Order History And Reviews Result

- `GET /api/orders` implemented with customer-scoped paging.
- `GET /api/orders/{id}` now returns customer-scoped detail DTO with items, totals, receiver info, and status history.
- `POST /api/orders/{id}/cancel` implemented with transaction, valid status transition check, status history, and stock restore.
- `POST /api/reviews` implemented; reviews require a completed order item owned by the current customer and can be created only once per order item.
- React order history page added at `/orders`.
- React order detail page added at `/orders/:id` with cancel action and review form for completed order items.
- Checkout success now links to the created order detail page.
- Header navigation now includes order history.
- `dotnet build CampusStore.sln` succeeded with 0 errors; existing `NU1903` warning for transitive `Microsoft.OpenApi 2.0.0` remains.
- `dotnet test CampusStore.sln --no-build` passed: 24 tests total.
- `npm run lint` succeeded.
- `npm run build` succeeded.
- Runtime smoke check passed for order list/detail, create-and-cancel order, stock restore from 20 back to 20, and review creation for `customer5@campusstore.local` on a completed seed order.

## Phase 6 Admin Order Management Result

- `GET /api/admin/orders` implemented for `Staff` and `Admin` roles with paging, keyword search, and status filter.
- `GET /api/admin/orders/{id}` implemented for `Staff` and `Admin` roles with customer info and full order detail.
- `PUT /api/admin/orders/{id}/status` implemented with valid transition checks and transactional updates.
- Admin cancelling an order restores stock.
- Admin completing an order marks payment as paid.
- React admin order management page added at `/admin/orders`.
- Header now includes quick entry to admin orders.
- `dotnet build CampusStore.sln` succeeded with 0 errors; existing `NU1903` warning for transitive `Microsoft.OpenApi 2.0.0` remains.
- `dotnet test CampusStore.sln --no-build` passed: 24 tests total.
- `npm run lint` succeeded.
- `npm run build` succeeded.
- Runtime smoke check passed: customer created a new order, staff listed pending admin orders, loaded admin order detail, and moved the order from `Pending` to `Confirmed`.

## Vietnamese UI Text Fix

- Main frontend UI text in `web/src` was updated from ASCII/no-accent Vietnamese to proper UTF-8 Vietnamese.
- Mojibake strings such as broken Vietnamese aria labels were removed from `web/src`.
- `npm run lint` succeeded.
- `npm run build` succeeded.

## Phase 7 Frontend Authentication Result

- React auth API client added for `/api/auth/login`, `/api/auth/register`, `/api/auth/logout`, and `/api/auth/me`.
- Login page added at `/login`.
- Register page added at `/register`.
- Account page added at `/account` with user info, roles, quick links, and logout.
- Store header now detects the current user from `/api/auth/me`.
- Store header shows login state, user name, and only shows admin order management entry for `Staff`/`Admin`.
- Auth controller response messages were cleaned up to proper UTF-8 Vietnamese.
- `dotnet build CampusStore.sln` succeeded with 0 errors after stopping a running `CampusStore.Api` process that was locking build outputs; existing `NU1903` warning for transitive `Microsoft.OpenApi 2.0.0` remains.
- `dotnet test CampusStore.sln --no-build` passed: 24 tests total.
- `npm run lint` succeeded.
- `npm run build` succeeded.
- Runtime smoke check passed: login, `/me`, and logout invalidating the session.

## Phase 8 Admin Dashboard Result

- `GET /api/admin/dashboard` implemented for `Staff` and `Admin` roles.
- Dashboard revenue uses only `Completed` orders.
- Dashboard includes total orders, pending orders, completed orders, cancelled orders, active products, low-stock variants, users, order status counts, top products, low-stock items, and recent orders.
- React admin dashboard page added at `/admin`.
- Header admin entry now opens `/admin`.
- Account page now links Staff/Admin users to the dashboard.
- Backend API messages for cart, checkout, orders, admin orders, and reviews were updated to proper UTF-8 Vietnamese.
- `dotnet build CampusStore.sln` succeeded with 0 errors; existing `NU1903` warning for transitive `Microsoft.OpenApi 2.0.0` remains.
- `dotnet test CampusStore.sln --no-build` passed: 24 tests total.
- `npm run lint` succeeded.
- `npm run build` succeeded.
- Runtime smoke check passed for `staff@campusstore.local`: dashboard returned completed revenue, order counts, top products, low-stock items, and recent orders.

## Auth Host And Product Images Fix

- Frontend API base URL now follows the browser hostname, so opening `localhost:5173` calls `localhost:5155` and opening `127.0.0.1:5173` calls `127.0.0.1:5155`.
- This fixes the account page showing a cached user in the header while `/auth/me` fails because the cookie was issued for a different host.
- Product cards, cart items, customer order detail, and admin order detail now render product images when `primaryImageUrl` is available.
- `web/public/images/products` was created and populated with local image files matching the seeded product image URLs.
- 51 product image files were created for the 51 seeded products.
- `npm run lint` succeeded.
- `npm run build` succeeded and copied product images into `web/dist/images/products`.
- `dotnet build CampusStore.sln` succeeded with 0 errors; existing `NU1903` warning for transitive `Microsoft.OpenApi 2.0.0` remains.
- `dotnet test CampusStore.sln --no-build` passed: 24 tests total.
- Runtime smoke check passed for `localhost:5155`: login then `/auth/me` returned the current customer.

## Vietnamese Text Normalization Follow-up

- Checkout page text was changed to proper Vietnamese with accents, including title, empty/error guidance, default shipping address, and payment summary labels.
- Customer order cancellation note now sends a Vietnamese message with accents.
- Account/admin dashboard labels were changed from English-mixed text to Vietnamese.
- Admin order detail now uses `Phí vận chuyển` instead of `Phí ship`.
- Development order seed data now creates accented shipping addresses and order notes.
- Existing development orders are normalized on backend startup for old no-accent shipping addresses and notes.
- `dotnet build CampusStore.sln` succeeded with 0 errors; existing `NU1903` warning for transitive `Microsoft.OpenApi 2.0.0` remains.
- `dotnet test CampusStore.sln --no-build` passed: 24 tests total.
- `npm run lint` succeeded.
- `npm run build` succeeded.

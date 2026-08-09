# CampusStore

CampusStore is a student-focused e-commerce website for stationery, notebooks, writing tools, study materials, bags, desk lamps, and study-related computer accessories.

The group studies Lazada.vn for common e-commerce workflows, then builds a new B2C single-seller website. CampusStore does not copy Lazada's UI, branding, data, layout, or marketplace model.

## Architecture

- `src/CampusStore.Domain`: core entities, enums, and business rules.
- `src/CampusStore.Application`: DTOs, interfaces, use cases, validation, paging models.
- `src/CampusStore.Infrastructure`: EF Core, MySQL, Identity, seed data, file/email services.
- `src/CampusStore.Api`: controllers, authentication, authorization, CORS, middleware.
- `web`: React application.
- `docs`: requirements, architecture, database, API, testing, and report notes.

## Requirements

- .NET SDK 10
- Node.js 24+
- npm 11+
- MySQL 8+

## Backend Commands

```bash
dotnet restore
dotnet build
dotnet test
dotnet ef database update
dotnet run --project src/CampusStore.Api
```

## Frontend Commands

```bash
cd web
npm install
npm run dev
npm run lint
npm run build
```

## Environment

Create `web/.env` from `web/.env.example`:

```text
VITE_API_BASE_URL=http://127.0.0.1:5155/api
```

Backend connection strings and seed passwords must be stored with User Secrets in development or environment variables in production.

Example development secret:

```bash
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=localhost;Port=3306;Database=campusstore_dev;User=campusstore;Password=YOUR_PASSWORD;CharSet=utf8mb4;" --project src/CampusStore.Api
dotnet user-secrets set "Seed:DemoPassword" "YOUR_DEMO_PASSWORD" --project src/CampusStore.Api
```

## Demo Accounts

Development seed data will provide these accounts when `Seed:DemoPassword` is configured:

```text
Admin: admin@campusstore.local
Staff: staff@campusstore.local
Customer: customer@campusstore.local
```

Passwords are not stored in the repository. Configure them through User Secrets or environment variables.

## Current Status

- Scaffold, database, Identity, seed data, catalog, cart, checkout, orders, reviews, admin order management, admin products, and frontend authentication are implemented.
- Admin dashboard data API exists, but the frontend dashboard page is currently missing in the working tree, so the frontend build is not green until that file is restored.
- EF Core MySQL `AppDbContext` and `InitialCreate` migration are created and applied locally.
- Backend build and tests pass.
- Frontend lint passes; production build currently fails because `web/src/pages/AdminDashboardPage.tsx` is missing while `web/src/routes/router.tsx` still imports it.
- See `docs/testing.md` for the latest verification snapshot and known limitations.

## Known Setup Note

NuGet and npm package restore require network access. If restore is blocked by the sandbox, run the restore/install commands in a network-enabled terminal.

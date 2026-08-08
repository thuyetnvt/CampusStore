# CampusStore Repository Rules

## Project Goal

CampusStore is a B2C e-commerce website for study supplies. The project studies Lazada.vn for business ideas, but it must not copy Lazada's UI, logo, colors, data, page layout, or marketplace model.

## Required Stack

- Backend: C#, .NET 10 LTS, ASP.NET Core Web API with controllers.
- Frontend: React 19, TypeScript, Vite, Tailwind CSS.
- Database: MySQL 8+, InnoDB, utf8mb4.
- Authentication: ASP.NET Core Identity with HttpOnly cookie authentication.

## Working Rules

- Keep the architecture split into Domain, Application, Infrastructure, Api, and web.
- Do not switch database provider or backend framework without documenting the reason.
- Do not trust prices, totals, or stock values sent by the frontend.
- Use decimal types for money.
- Use database transactions for order creation and stock deduction.
- Do not commit secrets, connection strings, or local `.env` files.
- Update `docs/testing.md` after every build or test run.

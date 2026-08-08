# CampusStore Architecture

## Backend

CampusStore uses a layered ASP.NET Core architecture:

- Domain contains framework-independent business objects.
- Application contains use cases, DTOs, validation, and service contracts.
- Infrastructure implements persistence, Identity, seed data, file storage, and email.
- Api exposes controller-based HTTP endpoints under `/api`.

Dependency direction:

```text
Api -> Application
Api -> Infrastructure
Infrastructure -> Application
Infrastructure -> Domain
Application -> Domain
```

## Frontend

The React app uses feature folders and shared infrastructure:

```text
web/src/api
web/src/assets
web/src/components
web/src/features
web/src/hooks
web/src/layouts
web/src/pages
web/src/routes
web/src/schemas
web/src/types
web/src/utils
```

API calls use Axios with `withCredentials` for cookie authentication. Server state will use TanStack Query.

## Security Baseline

- ASP.NET Core Identity hashes passwords.
- Browser auth uses HttpOnly cookies.
- Production cookies must use `Secure`.
- CORS must allow only configured frontend origins when credentials are enabled.
- Mutating requests require CSRF protection.
- Uploads must validate size, extension, and MIME type.
- Admin actions must write audit logs.

# 📂 Recommended Backend Project Structure

This guide explains the architectural layout and **"what goes where"** when developing the backend server.

---

## 🌳 Directory Tree

```
backend/
├── .env.example              # Environment variables template (PORT, DATABASE_URL, JWT_SECRET)
├── package.json              # Node.js dependencies & run scripts
├── tsconfig.json             # TypeScript configuration
├── prisma/
│   ├── schema.prisma         # Database models & Prisma config
│   └── seed.ts               # Database seed script for demo data
└── src/
    ├── server.ts             # Server entry point (starts HTTP listener)
    ├── app.ts                # Express app initialization, global middlewares
    │
    ├── config/               # Configuration & Environment loaders
    │   ├── env.ts            # Validated environment variables (Zod/dotenv)
    │   └── database.ts       # Prisma Client / Database connection instance
    │
    ├── middlewares/          # Express request interceptors
    │   ├── auth.middleware.ts    # JWT token extraction & verification
    │   ├── rbac.middleware.ts    # Role-based permission guard (e.g. checkRole(['Super Admin', 'Admin']))
    │   ├── tenant.middleware.ts  # Extracts 'X-Company-Id' and attaches req.companyId
    │   ├── error.middleware.ts   # Global error handling & formatting
    │   └── validate.middleware.ts# Request payload validation (Zod/Joi)
    │
    ├── modules/ (or routes/ + controllers/)
    │   ├── auth/
    │   │   ├── auth.routes.ts      # /api/v1/auth endpoints
    │   │   ├── auth.controller.ts  # Handles HTTP req/res
    │   │   ├── auth.service.ts     # Business logic (password hash, JWT sign)
    │   │   └── auth.schema.ts      # Zod validation schema for login/register
    │   │
    │   ├── dashboard/
    │   │   ├── dashboard.routes.ts
    │   │   ├── dashboard.controller.ts
    │   │   └── dashboard.service.ts # Aggregates KPI statistics per company
    │   │
    │   ├── clients/
    │   │   ├── clients.routes.ts
    │   │   ├── clients.controller.ts
    │   │   └── clients.service.ts
    │   │
    │   ├── leads/
    │   │   ├── leads.routes.ts
    │   │   ├── leads.controller.ts
    │   │   └── leads.service.ts
    │   │
    │   ├── projects/
    │   │   ├── projects.routes.ts
    │   │   ├── projects.controller.ts
    │   │   └── projects.service.ts
    │   │
    │   ├── tasks/
    │   │   ├── tasks.routes.ts
    │   │   ├── tasks.controller.ts
    │   │   └── tasks.service.ts
    │   │
    │   └── attendance/
    │       ├── attendance.routes.ts
    │       ├── attendance.controller.ts
    │       └── attendance.service.ts
    │
    └── utils/                # Helper utilities
        ├── logger.ts         # Winston / Pino logger
        ├── apiResponse.ts    # Standard JSON response formatter
        └── jwt.ts            # Token generator & verifier
```

---

## 🎯 What Goes Where? (Rule of Thumb)

### 1. `routes/*.ts`
- **Only** defines the HTTP path and attaches the middlewares and controller method.
- **Example**:
  ```ts
  router.post("/clients", requireAuth, requireTenant, validate(createClientSchema), clientsController.create);
  ```

### 2. `controllers/*.ts`
- Extracts data from `req.body`, `req.params`, `req.query`, and `req.companyId`.
- Calls the corresponding service method.
- Sends the HTTP response (`res.status(200).json(...)`).
- **Never** write SQL queries or complex business logic directly in the controller!

### 3. `services/*.ts`
- Contains all pure business logic, calculations, database queries (Prisma/TypeORM).
- Enforces multi-tenancy: always pass `companyId` into queries.

### 4. `middlewares/*.ts`
- **`tenant.middleware.ts`**:
  ```ts
  export const tenantMiddleware = (req, res, next) => {
    const companyId = req.headers['x-company-id'] || req.user?.companyId;
    if (!companyId && req.user?.role !== 'SUPER_ADMIN') {
      return res.status(400).json({ error: "Missing X-Company-Id header" });
    }
    req.companyId = companyId;
    next();
  };
  ```

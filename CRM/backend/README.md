# 🚀 SAAMPARK CRM — Backend Developer Master Guide

Welcome to the backend architecture for **SAAMPARK CRM**. This directory contains all the blueprints, schemas, endpoint contracts, and guidelines needed to build the server-side API.

---

## 📚 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Quick Reference Guides](#-quick-reference-guides)
3. [Multi-Company Multi-Tenancy Design](#-multi-company-multi-tenancy-design)
4. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
5. [Recommended Tech Stack](#-recommended-tech-stack)
6. [Core Workflow & Data Flow](#-core-workflow--data-flow)

---

## 🏗 Architecture Overview

SAAMPARK CRM is an enterprise-grade ERP/CRM system designed to manage multiple businesses under one umbrella (e.g. **SAAMPARK Technology** and **SAAMPARK Digital Marketing & Research**).

```
                      ┌────────────────────────────────────────┐
                      │    Next.js 14 Frontend (Port 3000)     │
                      └──────────────────┬─────────────────────┘
                                         │  HTTP / Bearer Token + X-Company-Id Header
                                         ▼
                      ┌────────────────────────────────────────┐
                      │     REST API Server (Port 5000)        │
                      ├────────────────────────────────────────┤
                      │  • Auth Middleware (JWT + RBAC)        │
                      │  • Tenant Middleware (Company Context) │
                      │  • Rate Limiting & Validation          │
                      └──────────────────┬─────────────────────┘
                                         │
                                         ▼
                      ┌────────────────────────────────────────┐
                      │       Database (PostgreSQL / MySQL)    │
                      └────────────────────────────────────────┘
```

---

## 📑 Quick Reference Guides in this Folder

| File | Purpose |
|---|---|
| [**DATABASE_SCHEMA.md**](./DATABASE_SCHEMA.md) | Full ERD, Table definitions, foreign keys, and Prisma/SQL schema. |
| [**API_ENDPOINTS.md**](./API_ENDPOINTS.md) | Complete list of all REST API endpoints, request/response bodies, query parameters, and RBAC permissions. |
| [**PROJECT_STRUCTURE.md**](./PROJECT_STRUCTURE.md) | Recommended backend directory structure explaining **"what goes where"**. |
| [**FRONTEND_INTEGRATION.md**](./FRONTEND_INTEGRATION.md) | How the frontend sends headers, manages session state, and handles API requests. |

---

## 🏢 Multi-Company Multi-Tenancy Design

Every business entity in the system belongs to a **Company**. When querying or writing data:

1. **Header**: The frontend sends the currently active company ID in every request:
   ```http
   X-Company-Id: comp_tech_01
   Authorization: Bearer <JWT_TOKEN>
   ```
2. **Data Isolation**: All queries must filter by `companyId`:
   ```sql
   SELECT * FROM clients WHERE company_id = 'comp_tech_01';
   ```
3. **Super Admin Exemption**: A `Super Admin` can access and switch between all companies. Other roles (Admin, Employee, Client) are restricted to their assigned company.

---

## 🛡 Role-Based Access Control (RBAC)

| Role | Access Scope | Permissions |
|---|---|---|
| **Super Admin** | System-wide (All Companies) | Full access to all data, settings, company switching, billing, logs. |
| **Admin** | Single Company | Full access within their company (manage clients, leads, team, finance). |
| **Manager** | Single Company | Manage assigned projects, tasks, leads, approve timesheets, view team stats. |
| **Employee** | Single Company | View assigned tasks, log time/attendance (Clock In/Out), view projects. |
| **Client** | Single Company | Restricted portal: view own projects, tasks, invoices, submit tickets. |

---

## 🛠 Recommended Tech Stack

You can build this backend using any of the following stacks:

- **Node.js**: Express / NestJS + TypeScript + Prisma ORM + PostgreSQL
- **Python**: FastAPI / Django REST Framework + PostgreSQL
- **Go**: Gin / Fiber + GORM + PostgreSQL
- **PHP**: Laravel + MySQL / PostgreSQL

---

## 💡 Quick Tips for Backend Devs
1. **Always read [API_ENDPOINTS.md](./API_ENDPOINTS.md)** before designing your route handlers.
2. **Follow [DATABASE_SCHEMA.md](./DATABASE_SCHEMA.md)** to ensure foreign key names and data types match frontend models.
3. Start with the **Auth & Tenant Middleware** first; everything else relies on having `req.user` and `req.companyId`.

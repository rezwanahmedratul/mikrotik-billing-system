# MikroTik ISP Billing & Management Platform — Architecture

## 1. System Overview

The MikroTik ISP Billing & Management Platform is an enterprise-grade, multi-tenant web application designed for independent Internet Service Providers (ISPs) to manage subscribers, network devices (MikroTik routers), PPPoE credentials, bandwidth packages, invoicing, automated billing cycles, manual and online payments, and SMS notifications.

### High-Level Topology

```
                  ┌──────────────────────────────────────────────┐
                  │                 Web Browser                  │
                  │   (Next.js App Router, Tailwind, Lucide)     │
                  └──────────────────────┬───────────────────────┘
                                         │ HTTPS / REST JSON
                                         ▼
                  ┌──────────────────────────────────────────────┐
                  │               NestJS REST API                │
                  │   (Multi-tenant auth, RBAC, Domain Services) │
                  └──────────────┬───────────────┬───────────────┘
                                 │               │
                     Prisma / SQL│               │ BullMQ / Redis
                                 ▼               ▼
        ┌────────────────────────────┐       ┌────────────────────────────┐
        │    PostgreSQL Database     │       │     Redis / BullMQ         │
        │ (Business Source of Truth) │       │ (Jobs, Queues & Caching)   │
        └────────────────────────────┘       └─────────────┬──────────────┘
                                                           │
                                                           ▼
                                             ┌────────────────────────────┐
                                             │     Background Worker      │
                                             │  (Billing, SMS, Routers)   │
                                             └─────────────┬──────────────┘
                                                           │
                                            ┌──────────────┴──────────────┐
                                            ▼                             ▼
                              ┌───────────────────────────┐ ┌───────────────────────────┐
                              │     MikroTik Routers      │ │   Payment & SMS Gateways  │
                              │ (Mock / RouterOS API/REST)│ │ (Sandbox / Live Gateways) │
                              └───────────────────────────┘ └───────────────────────────┘
```

---

## 2. Core Architectural Principles

### 2.1 Multi-Tenant Isolation

- Every ISP organization operates as an isolated `Tenant`.
- Every tenant-owned resource (`Router`, `Package`, `Subscriber`, `Subscription`, `Invoice`, `Payment`, `AuditLog`, etc.) holds an indexed `tenantId` foreign key.
- The NestJS API extracts the authenticated tenant context from the verified session or JWT token.
- API endpoints strictly reject or filter operations across tenant boundaries. Tenant ID is never blindly trusted from client input.
- Database queries consistently scope queries to `tenantId`.

### 2.2 Business Data vs. Operational State

- **PostgreSQL** is the authoritative source of truth for all business records: subscribers, financial balances, active packages, subscriptions, invoices, and audit logs.
- **MikroTik Router State** is ephemeral operational state.
- Router changes are never assumed to succeed synchronously. All network mutations (PPPoE secret creation, profile assignment, suspension, reactivation) are tracked via `RouterJob` records with explicit statuses:
  - `PENDING`
  - `PROCESSING`
  - `SUCCEEDED`
  - `FAILED`
- System maintains desired state vs. confirmed router state, with automated periodic reconciliation.

### 2.3 Double-Entry Financial Ledger

- Monetary amounts are represented strictly in integer minor units (e.g. cents/poisha) to prevent floating-point inaccuracy.
- Invoices transition through validated state machines: `DRAFT` -> `ISSUED` -> `PARTIALLY_PAID` -> `PAID` / `VOID` / `OVERDUE`.
- Payments are transactionally allocated to invoices.
- Invoicing runs are strictly idempotent: unique constraints on `[subscriptionId, billingPeriodStart]` prevent duplicate billing cycles.

### 2.4 Extensible Adapter Pattern for External Systems

- **Router Adapter (`RouterAdapter`)**: Decouples business logic from MikroTik connection protocols. Includes a `MockRouterAdapter` for zero-dependency unit and integration tests, and a `RouterOsRestAdapter` / `RouterOsApiAdapter` for real RouterOS devices.
- **Payment Gateway Adapter (`PaymentGatewayAdapter`)**: Decouples payment processing from external providers (e.g., bKash, Nagad, SSLCommerz, Stripe). Webhooks are verified with HMAC signatures and processed idempotently.
- **SMS Gateway Adapter (`SmsGatewayAdapter`)**: Decouples notification dispatch from specific SMS providers, supporting template rendering, variable interpolation, and delivery tracking.

---

## 3. Monorepo Organization

- **`packages/shared`**: Common TypeScript interfaces, DTOs, Zod validation schemas, error types, and system constants shared across backend and frontend.
- **`packages/database`**: Prisma schema, PostgreSQL migrations, database client singleton, mock fixtures, and seed data.
- **`apps/api`**: NestJS HTTP REST API providing Swagger/OpenAPI documentation, authentication guards, role-based access control, tenant isolation, and REST endpoints.
- **`apps/worker`**: BullMQ worker service consuming background queues for router synchronization, recurring billing generation, suspension lifecycle, and SMS notifications.
- **`apps/web`**: Next.js App Router application implementing a responsive monochrome dashboard, data tables, dialogs, forms, and charts across desktop and mobile viewports.
- **`infrastructure`**: Docker Compose configurations for PostgreSQL, Redis, and local development services.

# Implementation Status and Verification Log

## Project: MikroTik ISP Billing & Management Platform

---

### Implementation Progress Summary

| Section        | Description                                 | Status      | Verification Summary                                           |
| -------------- | ------------------------------------------- | ----------- | -------------------------------------------------------------- |
| **Section 1**  | Repository Inspection and Project Setup     | Completed   | pnpm workspace, strict TS, build, lint, format & tests passing |
| **Section 2**  | Local Infrastructure & Developer Experience | Completed   | Docker Compose, Postgres, Redis, Health Checks & Persistence   |
| **Section 3**  | Database Foundation & Migrations            | Completed   | Prisma schema, multi-tenant models, migrations, tests passed   |
| **Section 4**  | Authentication, Tenant Isolation & RBAC     | Completed   | Argon2id, JWT guards, RBAC, tenant boundary tests passed       |
| **Section 5**  | UI Foundation & Monochrome Design System    | Completed   | Monochrome design system, AppShell, components & tests passed  |
| **Section 6**  | Router Inventory & Secure Connections       | Completed   | AES-256-GCM, RouterAdapter, inventory API, worker poller, UI   |
| **Section 7**  | PPPoE Setup & Router Configuration          | Completed   | Guided workflow, pre-flight checks, dry-run, post-verification |
| **Section 8**  | Internet Packages                           | In Progress | Bandwidth limits, pricing, lifecycle, validation               |
| **Section 9**  | Subscriber & Subscription Management        | Pending     | Subscriber CRUD, PPPoE secret generation, state history        |
| **Section 10** | Active PPPoE Sessions & Usage Monitoring    | Pending     | Session inspection, normalization, fresh indicators            |
| **Section 11** | Invoices & Billing Ledger                   | Pending     | Idempotent billing runs, integer cents, invoice lifecycle      |
| **Section 12** | Manual Payments & Reconciliation            | Pending     | Allocation, idempotency, receipts, reversals                   |
| **Section 13** | Payment Gateway Integration                 | Pending     | Provider adapters, HMAC webhook verification, sandbox          |
| **Section 14** | SMS & Notification System                   | Pending     | Template engine, background queue, retry policy                |
| **Section 15** | Automated Billing & Service Lifecycle       | Pending     | Grace periods, automated suspension/restoration                |
| **Section 16** | Dashboard, Reports & Audit Trail            | Pending     | Metrics, caching, tenant-scoped reports, audit logs            |
| **Section 17** | Performance & Scale                         | Pending     | Query indexing, pagination, load testing                       |
| **Section 18** | Security Review & Hardening                 | Pending     | Security audit, secret scan, vulnerability scan                |
| **Section 19** | End-to-End Testing & Release Readiness      | Pending     | Playwright tests, backup/restore, release checklists           |

---

### Milestone Log: Section 1 — Repository Inspection & Project Setup

- **Completed Work:**
  - Inspected runtime environment: Node.js v24.22.0, pnpm v12.14.0, Docker v29.9.1, clean git repo.
  - Authored `docs/architecture.md` outlining multi-tenant isolation, operational router state, financial ledger, and adapter patterns.
  - Authored `docs/architecture-decisions.md` documenting ADR-001 through ADR-006.
  - Initialized monorepo with `pnpm-workspace.yaml`, root `package.json`, `tsconfig.base.json`, `tsconfig.json`, `.prettierrc`, `.prettierignore`, `.gitignore`, and `.env.example`.
  - Scaffolding packages: `@mikrotik-billing/shared`, `@mikrotik-billing/database`, `@mikrotik-billing/api`, `@mikrotik-billing/worker`, `@mikrotik-billing/web`.
  - Implemented initial domain enums, types, currency utilities, NestJS API health controller, worker service, Next.js monochrome landing page.
- **Files Changed:**
  - `docs/architecture.md`
  - `docs/architecture-decisions.md`
  - `docs/implementation-status.md`
  - `package.json`, `pnpm-workspace.yaml`, `tsconfig.base.json`, `tsconfig.json`
  - `.gitignore`, `.prettierrc`, `.prettierignore`, `.env.example`, `README.md`
  - `packages/shared/*`, `packages/database/*`, `apps/api/*`, `apps/worker/*`, `apps/web/*`
- **Commands Executed:**
  - `pnpm install` (Exited 0)
  - `pnpm run format:check` (Exited 0, Prettier verified)
  - `pnpm run lint` (Exited 0, all workspaces passed)
  - `pnpm run typecheck` (Exited 0, strict TypeScript compiler verified)
  - `pnpm run test` (Exited 0, all vitest test suites passed: 7/7 tests passed)
  - `pnpm run build` (Exited 0, Next.js and TypeScript builds succeeded)
- **Tests & Verification:**
  - Zero TypeScript errors across all 5 workspace projects.
  - All unit test suites passed.
  - Next.js production build compiled with zero errors.
  - Secrets and build artifacts safely excluded in `.gitignore`.
- **Next Step:**
  - Section 2: Local Infrastructure and Developer Experience (Docker Compose for Postgres & Redis, health checks, persistence, database reset/seed scripts).

---

### Milestone Log: Section 2 — Local Infrastructure & Developer Experience

- **Completed Work:**
  - Configured `infrastructure/docker-compose.yml` with PostgreSQL 16 Alpine and Redis 7 Alpine with persistent named volumes and healthchecks.
  - Configured `infrastructure/docker-compose.test.yml` for isolated test services.
  - Added development helper scripts to root `package.json`: `docker:up`, `docker:down`, `docker:logs`, `db:reset`.
  - Implemented safe database reset script `scripts/reset-dev-db.ts` guarded against production execution.
  - Implemented live connectivity probes in API `HealthController` for PostgreSQL and Redis, returning 200 OK when healthy and 503 Service Unavailable on dependency failure.
- **Files Changed:**
  - `infrastructure/docker-compose.yml`
  - `infrastructure/docker-compose.test.yml`
  - `scripts/reset-dev-db.ts`
  - `apps/api/src/health.controller.ts`
  - `apps/api/src/health.controller.test.ts`
  - `package.json`
  - `README.md`
  - `.env`
- **Commands Executed:**
  - `docker compose -f infrastructure/docker-compose.yml up -d` (Exited 0)
  - `docker compose -f infrastructure/docker-compose.yml ps` (Both containers healthy)
  - Persistence test: wrote test records, restarted containers, verified data persisted across container restart (Exited 0)
  - `pnpm run db:reset` (Exited 0, dropped and recreated clean public schema)
  - `pnpm run test` (All 8 tests passed, including health probe live check and failure check)
- **Tests & Verification:**
  - Health checks verified passing for PostgreSQL and Redis.
  - Persistence verified after container restart.
  - Dependency failure verified (503 response and error details when database is down).
- **Next Step:**
  - Section 3: Database Foundation and Migrations (Prisma ERD, Prisma schema for all domain models, tenant-scoped uniqueness constraints, migrations, factories, seed data).

---

### Milestone Log: Section 3 — Database Foundation & Migrations

- **Completed Work:**
  - Designed ERD in `docs/database.md` with full entity relationships and field definitions.
  - Authored complete Prisma schema in `packages/database/prisma/schema.prisma` covering:
    - Tenancy: `Tenant`, `User`, `TenantMembership`, `Session`
    - Network: `Router`, `RouterJob`, `RouterJobAttempt`, `RouterEvent`, `ActiveSessionSnapshot`
    - Service: `Subscriber`, `Package`, `Subscription`, `PppoeAccount`, `ServiceEvent`
    - Billing: `Invoice`, `InvoiceLine`, `Payment`, `PaymentAllocation`, `PaymentProviderEvent`, `BillingRun`
    - Notifications & Auditing: `NotificationTemplate`, `NotificationJob`, `AuditLog`, `SystemSetting`
  - Created and applied PostgreSQL migration `20261018154359_init`.
  - Implemented test factories and fixtures in `packages/database/src/fixtures.ts`.
  - Created idempotent seed script `packages/database/src/seed.ts` with multi-tenant sample data (Platform Admin, FastNet ISP, SkyLink Broadband, Routers, Packages, Subscribers, PPPoE accounts, and Invoices).
  - Documented migration, backup, and restore procedures in `docs/operations.md`.
- **Files Changed:**
  - `docs/database.md`
  - `docs/operations.md`
  - `packages/database/prisma/schema.prisma`
  - `packages/database/prisma/migrations/20261018154359_init/migration.sql`
  - `packages/database/src/client.ts`
  - `packages/database/src/index.ts`
  - `packages/database/src/fixtures.ts`
  - `packages/database/src/seed.ts`
  - `packages/database/src/database.test.ts`
  - `packages/database/src/client.test.ts`
  - `packages/shared/src/index.ts`
- **Commands Executed:**
  - `prisma generate` (Generated Prisma Client v6.19.3)
  - `prisma migrate dev --name init` (Applied migration 20261018154359_init)
  - `pnpm --filter @mikrotik-billing/database run db:seed` (Executed twice to verify 100% idempotency)
  - `pnpm --filter @mikrotik-billing/database test` (8/8 tests passed)
- **Tests & Verification:**
  - Enforced unique tenant code test passed.
  - Enforced unique user email test passed.
  - Enforced tenant-scoped router name uniqueness (`[tenantId, name]`) test passed.
  - Enforced tenant-scoped subscriber account number uniqueness (`[tenantId, accountNumber]`) test passed.
  - Enforced tenant-scoped PPPoE username uniqueness (`[tenantId, username]`) test passed.
  - Prevented duplicate period invoice generation constraint (`[subscriptionId, billingPeriodStart]`) test passed.
  - Restrict deletion on packages in use test passed.
  - All 14 tests across the entire monorepo passed.
- **Next Step:**
  - Section 4: Authentication, Tenant Isolation, Roles, and Permissions.

---

### Milestone Log: Section 4 — Authentication, Tenant Isolation, Roles, and Permissions

- **Completed Work:**
  - Implemented `AuthService` and `AuthController` with:
    - Argon2id password verification and hashing
    - JWT signing with 7-day expiration
    - Brute-force throttling on login attempts (blocks after 5 consecutive failures)
    - Safe error messages that avoid leaking user account existence
    - Self-service ISP organization registration (`/auth/register-tenant`)
    - Session retrieval (`/auth/me`) and logout audit logging (`/auth/logout`)
  - Implemented `JwtAuthGuard`, `RolesGuard`, `@Roles(...)`, `@CurrentUser()`, `@CurrentTenant()`, and `@Public()`.
  - Implemented `TenantsService` and `TenantsController` with:
    - Tenant profile retrieval and settings update (`/tenants/current`)
    - Role-based staff management (`/tenants/staff`) with role hierarchy checks
    - Strict protection preventing demotion or removal of the last remaining admin
    - Full tenant scoping preventing cross-tenant reads or updates
  - Implemented `AuditService` logging user logins, logouts, staff provisioning, and configuration changes.
  - Implemented frontend pages in `apps/web`:
    - `/login`: Minimal monochrome sign-in page with quick demo account presets and error handling
    - `/onboarding`: Self-service organization onboarding form with field validation
    - `/access-denied`: 403 Access Denied explanation and navigation
    - `/dashboard/staff`: Staff table, role badges, and Add Staff Member modal
- **Files Changed:**
  - `apps/api/src/common/auth-user.interface.ts`
  - `apps/api/src/common/decorators.ts`
  - `apps/api/src/common/jwt-auth.guard.ts`
  - `apps/api/src/common/roles.guard.ts`
  - `apps/api/src/common/audit.service.ts`
  - `apps/api/src/auth/auth.dto.ts`
  - `apps/api/src/auth/auth.service.ts`
  - `apps/api/src/auth/auth.controller.ts`
  - `apps/api/src/auth/auth.test.ts`
  - `apps/api/src/tenants/tenants.dto.ts`
  - `apps/api/src/tenants/tenants.service.ts`
  - `apps/api/src/tenants/tenants.controller.ts`
  - `apps/api/src/app.module.ts`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/app/login/page.tsx`
  - `apps/web/src/app/onboarding/page.tsx`
  - `apps/web/src/app/access-denied/page.tsx`
  - `apps/web/src/app/dashboard/staff/page.tsx`
  - `apps/web/src/app/auth.pages.test.ts`
  - `apps/web/vitest.config.ts`
- **Commands Executed:**
  - `pnpm --filter @mikrotik-billing/api test` (10/10 tests passed)
  - `pnpm --filter @mikrotik-billing/web test` (2/2 test suites passed)
  - `pnpm run test` (All 15 tests passed across monorepo)
  - `pnpm -r run typecheck` (0 errors across all 5 workspace projects)
  - `pnpm run build` (All 8 web routes and backend packages built successfully)
- **Tests & Verification:**
  - Valid credentials authentication passed.
  - Invalid password rejected with generic error.
  - Nonexistent user rejected without user enumeration.
  - Brute force login throttle verified after 5 failures.
  - Password hashes verified not exposed in API responses.
  - Cross-tenant access blocked (Tenant B cannot read/modify Tenant A staff).
  - Last administrator removal protection verified.
- **Next Step:**
  - Section 5: UI Foundation and Monochrome Design System.

---

### Milestone Log: Section 5 — UI Foundation & Monochrome Design System

- **Completed Work:**
  - Built a comprehensive monochrome design system in `apps/web` with custom neutral tokens, high-contrast borders, and accessibility focus rings.
  - Implemented core reusable UI components:
    - `StatusBadge`: Semantic status indicators with custom variant mapping for network and billing states.
    - `Skeleton` and `TableSkeletonRows`: Smooth loading placeholders for cards, text, and tables.
    - `Modal`: Accessible dialog with focus trap, backdrop blur, ESC key dismiss, and ARIA attributes.
    - `ConfirmDialog`: Specialized confirmation modal with destructive warning styling and confirmation triggers.
    - `Toast` & `ToastProvider`: Dynamic notification provider and `useToast()` hook with auto-dismissal.
    - `DataTable`: Generalized data table supporting generic types, search filtering, client-side pagination, loading skeletons, and empty states.
  - Implemented responsive `AppShell` with desktop sidebar, mobile drawer, tenant branding, live system status, and organized 12-route navigation.
  - Implemented comprehensive `DashboardOverviewPage` (`/dashboard`) with KPI cards (Subscribers, PPPoE Sessions, Gateways, Revenue), gateway status table, quick operations, and live activity audit trail.
  - Wrapped `StaffManagementPage` (`/dashboard/staff`) in `AppShell` with modal integration and role management.
- **Files Changed:**
  - `apps/web/tailwind.config.js`
  - `apps/web/src/components/ui/StatusBadge.tsx`
  - `apps/web/src/components/ui/Skeleton.tsx`
  - `apps/web/src/components/ui/Modal.tsx`
  - `apps/web/src/components/ui/ConfirmDialog.tsx`
  - `apps/web/src/components/ui/Toast.tsx`
  - `apps/web/src/components/ui/DataTable.tsx`
  - `apps/web/src/components/layout/AppShell.tsx`
  - `apps/web/src/app/dashboard/page.tsx`
  - `apps/web/src/app/dashboard/staff/page.tsx`
  - `apps/web/src/lib/api.ts`
  - `apps/web/src/components/ui/components.test.tsx`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm -r run typecheck` (Exited 0, strict TypeScript compiler verified)
  - `pnpm --filter @mikrotik-billing/web test` (13/13 tests passed)
  - `pnpm run test` (All 25 tests passed across monorepo)
  - `pnpm run build` (All 5 workspace packages and Next.js static pages built successfully)
  - Next.js web application started and verified running on port 3000 (HTTP 200 for `/dashboard` and `/dashboard/staff`)
- **Tests & Verification:**
  - Component test suite verified `StatusBadge`, `Skeleton`, `Modal`, `ConfirmDialog`, and `DataTable`.
  - Next.js production build succeeded with static page generation for all routes.
  - Layout responsive behavior verified with Tailwind breakpoint classes (`lg:block`, `lg:hidden`, `sm:flex`, `overflow-x-auto`).
- **Next Step:**
  - Section 6: Router Inventory & Secure Connections.

---

### Milestone Log: Section 6 — Router Inventory & Secure Connections

- **Completed Work:**
  - Designed and implemented AES-256-GCM authenticated credential encryption and decryption at rest with key validation and tampering detection in `@mikrotik-billing/shared/encryption.ts`.
  - Defined standard `RouterAdapter` contract and domain models covering connection testing, health snapshots, interface inspection, PPP profiles, PPP secrets, and active session termination.
  - Implemented `MockRouterAdapter` in `@mikrotik-billing/shared/mock-router-adapter.ts` supporting realistic RouterOS v7 telemetry and configurable failure triggers (auth failure, timeouts, unreachable hosts).
  - Implemented `RouterOsAdapter` in `apps/api/src/routers/routeros-adapter.ts` communicating with RouterOS v7 REST endpoints with AbortSignal timeout and error classification.
  - Created `RouterAdapterFactory` dynamically selecting between mock and real hardware adapters based on environment and host configurations.
  - Implemented `RoutersService` and `RoutersController` with full tenant isolation:
    - Router registration with credential encryption and credential redaction (`hasPassword: true`)
    - On-demand connection testing (`POST /routers/:id/test`)
    - Real-time telemetry synchronization (`POST /routers/:id/sync`) saving to `ActiveSessionSnapshot`
    - Safe deletion protection preventing deletion when active subscribers or PPPoE accounts are assigned
    - Audit logging for `ROUTER_CREATED`, `ROUTER_UPDATED`, and `ROUTER_DELETED`
  - Implemented background `RouterHealthPoller` in `apps/worker/src/router-poller.ts` with configurable concurrency limits and per-router failure isolation ensuring offline routers do not block online routers.
  - Implemented frontend `RoutersPage` in `apps/web/src/app/dashboard/routers/page.tsx` with hardware telemetry meters, inline credential testing modal, live status probes, and stale-data indicators.
- **Files Changed:**
  - `packages/shared/src/encryption.ts`
  - `packages/shared/src/router-adapter.ts`
  - `packages/shared/src/mock-router-adapter.ts`
  - `packages/shared/src/encryption.test.ts`
  - `packages/shared/src/mock-router-adapter.test.ts`
  - `packages/shared/src/index.ts`
  - `apps/api/src/routers/routeros-adapter.ts`
  - `apps/api/src/routers/router-adapter.factory.ts`
  - `apps/api/src/routers/routers.dto.ts`
  - `apps/api/src/routers/routers.service.ts`
  - `apps/api/src/routers/routers.controller.ts`
  - `apps/api/src/routers/routers.module.ts`
  - `apps/api/src/routers/routers.test.ts`
  - `apps/api/src/app.module.ts`
  - `apps/worker/src/router-poller.ts`
  - `apps/worker/src/router-poller.test.ts`
  - `apps/web/src/app/dashboard/routers/page.tsx`
  - `apps/web/src/app/auth.pages.test.ts`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm -r run typecheck` (Exited 0, strict TypeScript compiler verified)
  - `pnpm -r run test` (All 56 tests passed across the entire monorepo)
  - `pnpm run build` (All 5 workspace packages and Next.js static pages built successfully)
  - Verified `http://localhost:3000/dashboard/routers` returning HTTP 200 OK.
- **Tests & Verification:**
  - Credential encryption/decryption, tampered payload rejection, and credential redaction unit tests passed (7/7 tests).
  - Mock router adapter connection, failure triggers, and secret manipulation tests passed (7/7 tests).
  - Router API integration tests passed (6/6 tests) verifying encrypted storage, credential redaction, tenant isolation, and status updates.
  - Router background poller test passed proving bounded concurrency and offline router failure isolation.
- **Next Step:**
  - Section 7: PPPoE Setup and Router Configuration.

---

### Milestone Log: Section 7 — PPPoE Setup and Router Configuration

- **Completed Work:**
  - Authored comprehensive RouterOS operations and safety specifications in `docs/router-operations.md`.
  - Extended `RouterAdapter`, `MockRouterAdapter`, and `RouterOsAdapter` with IP Pool (`/ip/pool`) and PPPoE Server (`/interface/pppoe-server/server`) manipulation methods.
  - Implemented `PppoeSetupService`:
    - Read-only inspection step checking available LAN interfaces, existing pools, and readiness warnings (`POST /routers/:id/pppoe/inspect`).
    - Dry-run configuration planning generating step-by-step diffs and safety validation seals (`POST /routers/:id/pppoe/plan`).
    - Explicit confirmation requirement blocking unconfirmed changes.
    - Transactional execution creating a tracked `RouterJob` (`APPLY_PPP_PROFILE`) in PostgreSQL.
    - Post-change hardware verification immediately querying the router to verify that the IP pool, PPP profile, and PPPoE server now exist and match desired parameters.
    - Attempt logging in `RouterJobAttempt` with execution status, timestamps, and error recovery details.
    - Guaranteed idempotent reapplication allowing repeat runs without side effects.
  - Added PPPoE setup endpoints to `RoutersController` (`/pppoe/inspect`, `/pppoe/plan`, `/pppoe/apply`, and `/jobs`).
  - Implemented frontend 4-step guided setup wizard in `apps/web/src/app/dashboard/routers/[id]/pppoe-setup/page.tsx` with safety bounds verification, interactive parameter forms, dry-run diff review, and post-verification receipt.
  - Added "Setup PPPoE" direct action button on the Router Gateways inventory table.
- **Files Changed:**
  - `docs/router-operations.md`
  - `packages/shared/src/router-adapter.ts`
  - `packages/shared/src/mock-router-adapter.ts`
  - `apps/api/src/routers/routeros-adapter.ts`
  - `apps/api/src/routers/pppoe-setup.dto.ts`
  - `apps/api/src/routers/pppoe-setup.service.ts`
  - `apps/api/src/routers/routers.controller.ts`
  - `apps/api/src/routers/routers.module.ts`
  - `apps/api/src/routers/pppoe-setup.test.ts`
  - `apps/web/src/app/dashboard/routers/[id]/pppoe-setup/page.tsx`
  - `apps/web/src/app/dashboard/routers/page.tsx`
  - `apps/web/src/app/auth.pages.test.ts`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm -r run typecheck` (Exited 0, strict TypeScript compiler verified)
  - `pnpm -r run test` (All 61 tests passed across the entire monorepo)
  - `pnpm run build` (All 5 workspace packages and Next.js static pages built successfully)
  - Verified `http://localhost:3000/dashboard/routers/rtr-1/pppoe-setup` returning HTTP 200 OK.
- **Tests & Verification:**
  - Inspection and prerequisite evaluation unit test passed.
  - Dry-run plan generation and automated safety check test passed.
  - Explicit confirmation requirement test passed.
  - Full execution, post-change hardware verification, and `RouterJob` logging test passed.
  - Idempotent reapplication test passed.
- **Next Step:**
  - Section 8: Internet Packages (COMPLETED).

---

### Milestone Log: Section 8 — Internet Packages

- **Completed Work:**
  - Added bandwidth speed limit parsing and formatting to `@mikrotik-billing/shared`: `SpeedLimitSchema`, `parseSpeedStringToKbps`, and `formatSpeedKbps` supporting both `k/M/G` notation (e.g. `10M/10M`, `5120k/10240k`).
  - Created `apps/api/src/packages/packages.dto.ts` with minor unit pricing validation, speed format validation, and billing cycle options.
  - Implemented `PackagesService` and `PackagesController`:
    - Tenant-scoped CRUD with strict isolation.
    - Code auto-generation and per-tenant code uniqueness enforcement.
    - RouterOS PPPoE profile mapping (`pppProfileName`).
    - Prevention of deleting packages with active subscriptions (returning clear 400 Bad Request instructing the user to archive instead).
    - Package archiving/restoration allowing sunset of old plans without breaking historical billing.
    - Granular audit logging on creation, updates, and archival.
    - Propagation policy configuration (`propagateToActiveSubscriptions`).
  - Implemented modular frontend architecture for Packages:
    - `apps/web/src/components/packages/packages.types.ts`: Domain models, form contracts, and filter types.
    - `apps/web/src/components/packages/PackageStatsCards.tsx`: 4 KPI summary cards (Total Packages, Active Plans, Archived Plans, Subscribed Users).
    - `apps/web/src/components/packages/PackageFiltersBar.tsx`: Real-time search, archive status toggle, and refresh trigger.
    - `apps/web/src/components/packages/PackageFormModal.tsx`: Create / edit modal with real-time bandwidth preview, minor unit pricing, billing cycle, validity, and renewal propagation note.
    - `apps/web/src/app/dashboard/packages/page.tsx`: Clean orchestrator coordinating data fetching, modal states, archive toggling, and delete confirmations.
  - Integration testing:
    - Co-located integration test suite `apps/api/src/packages/packages.test.ts` covering CRUD, tenant isolation, invalid speed rejection, code uniqueness, archive filtering, and in-use deletion protection.
- **Files Changed:**
  - `packages/shared/src/index.ts`
  - `apps/api/src/packages/packages.dto.ts`
  - `apps/api/src/packages/packages.service.ts`
  - `apps/api/src/packages/packages.controller.ts`
  - `apps/api/src/packages/packages.module.ts`
  - `apps/api/src/packages/packages.test.ts`
  - `apps/api/src/app.module.ts`
  - `apps/web/src/components/packages/packages.types.ts`
  - `apps/web/src/components/packages/PackageStatsCards.tsx`
  - `apps/web/src/components/packages/PackageFiltersBar.tsx`
  - `apps/web/src/components/packages/PackageFormModal.tsx`
  - `apps/web/src/app/dashboard/packages/page.tsx`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm --filter @mikrotik-billing/api test src/packages/packages.test.ts` (6/6 tests passed)
  - `pnpm test` (All 67 tests passed across all packages)
  - `pnpm --filter @mikrotik-billing/web run build` (Static export and typecheck passed with exit code 0)
  - `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/dashboard/packages` (HTTP 200 OK)
- **Tests & Verification:**
  - Creation with valid speed parsing test passed.
  - Invalid speed format rejection test passed.
  - Tenant-scoped code uniqueness test passed.
  - Strict tenant isolation on list, get, update, and delete passed.
  - Archiving and archive filtering test passed.
  - In-use package delete prevention test passed.
- **Next Step:**
  - Section 9: Subscriber and Subscription Management (COMPLETED).

---

### Milestone Log: Section 9 — Subscriber and Subscription Management

- **Completed Work:**
  - Implemented modular backend architecture for subscribers and subscriptions:
    - `apps/api/src/subscribers/subscribers.dto.ts`: Comprehensive DTOs for client registration, contact editing, service status transitions, package changes, renewals, and paginated queries.
    - `apps/api/src/subscribers/pppoe-provisioning.service.ts`: Hardware sync service coordinating with `RouterAdapterFactory` and `RouterAdapter` to provision secrets, suspend accounts (disabling secret & kicking active sessions immediately), restore accounts, and clean up secrets.
    - `apps/api/src/subscribers/subscriptions.service.ts`: Subscription lifecycle service handling package assignments, validity calculation, manual renewals with day extensions, and status transitions.
    - `apps/api/src/subscribers/subscribers.service.ts`: Full subscriber CRUD, account number generation (`SUB-xxxx`), tenant-scoped PPPoE username uniqueness enforcement, AES-256-GCM password encryption, password redaction (`hasPassword: true`, never exposing raw passwords), service event timeline tracking (`ServiceEvent`), and audit logging.
    - `apps/api/src/subscribers/subscribers.controller.ts`: Role-guarded endpoints (`/subscribers`, `/subscribers/:id`, `/subscribers/:id/service-status`, `/subscribers/:id/change-package`, `/subscribers/:id/renew`, `/subscribers/:id/reprovision`, `/subscribers/:id/archive`).
    - `apps/api/src/subscribers/subscribers.module.ts`: Modular NestJS provider bundling.
  - Implemented modular frontend architecture for Subscribers:
    - `apps/web/src/components/subscribers/subscribers.types.ts`: Subscriber, Subscription, and PPPoE credential domain types.
    - `apps/web/src/components/subscribers/SubscriberStatsCards.tsx`: Modern, minimal, monochrome summary cards with rounded corners (Total Accounts, Active Service, Suspended, Expiring/Expired).
    - `apps/web/src/components/subscribers/SubscriberFiltersBar.tsx`: Real-time search, status filter pills, router gateway selector, and refresh.
    - `apps/web/src/components/subscribers/SubscriberFormModal.tsx`: Complete registration modal with contact info, package assignment, gateway selection, and secure random credential generation.
    - `apps/web/src/components/subscribers/ServiceStatusDialog.tsx`: Safe confirmation dialog for service suspension and restoration with audit reason.
    - `apps/web/src/app/dashboard/subscribers/page.tsx`: Clean orchestrator table page with rounded corners and monochrome theme.
    - `apps/web/src/app/dashboard/subscribers/[id]/page.tsx`: In-depth subscriber detail view with tariff subscription card, router gateway card with live reprovision trigger, billing balance summary, and full service event history timeline.
  - Integration testing:
    - Co-located integration test suite `apps/api/src/subscribers/subscribers.test.ts` (5/5 tests passed).
- **Files Changed:**
  - `apps/api/src/subscribers/subscribers.dto.ts`
  - `apps/api/src/subscribers/pppoe-provisioning.service.ts`
  - `apps/api/src/subscribers/subscriptions.service.ts`
  - `apps/api/src/subscribers/subscribers.service.ts`
  - `apps/api/src/subscribers/subscribers.controller.ts`
  - `apps/api/src/subscribers/subscribers.module.ts`
  - `apps/api/src/subscribers/subscribers.test.ts`
  - `apps/api/src/app.module.ts`
  - `apps/web/src/components/subscribers/subscribers.types.ts`
  - `apps/web/src/components/subscribers/SubscriberStatsCards.tsx`
  - `apps/web/src/components/subscribers/SubscriberFiltersBar.tsx`
  - `apps/web/src/components/subscribers/SubscriberFormModal.tsx`
  - `apps/web/src/components/subscribers/ServiceStatusDialog.tsx`
  - `apps/web/src/app/dashboard/subscribers/page.tsx`
  - `apps/web/src/app/dashboard/subscribers/[id]/page.tsx`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm --filter @mikrotik-billing/api test src/subscribers/subscribers.test.ts` (5/5 tests passed)
  - `pnpm test` (All 72 tests passed across the monorepo)
  - `pnpm --filter @mikrotik-billing/web run build` (Static export and typecheck passed with exit code 0)
  - `curl http://localhost:3000/dashboard/subscribers` (HTTP 200 OK)
  - `curl http://localhost:3000/dashboard/subscribers/sub-1` (HTTP 200 OK)
- **Tests & Verification:**
  - Registration, subscription creation, and router PPPoE secret provisioning test passed.
  - Password redaction test passed (verified raw password never returned).
  - Tenant-scoped PPPoE username uniqueness test passed.
  - Cross-tenant access isolation test passed.
  - Suspension & restoration lifecycle test passed (secret disabled/enabled, active session disconnect trigger, service event recorded).
  - Manual subscription renewal test passed.
- **Next Step:**
  - Section 10: PPPoE Live Sessions, Disconnect, and Traffic Monitoring (COMPLETED).

---

### Milestone Log: Section 10 — PPPoE Active Sessions and Usage Monitoring

- **Completed Work:**
  - Added `formatBytes` utility to `@mikrotik-billing/shared` handling bytes, KB, MB, GB, TB formatting for network telemetry.
  - Implemented modular backend architecture for PPPoE active sessions:
    - `apps/api/src/sessions/sessions.dto.ts`: DTOs for session queries, session telemetry items, router health status, and session disconnect payloads.
    - `apps/api/src/sessions/sessions.service.ts`:
      - Concurrent polling across all tenant routers via `RouterAdapterFactory`.
      - Correlates live sessions with subscriber records and internet packages (`subscriberName`, `accountNumber`, `packageName`, `speedLimitRaw`).
      - Normalizes traffic counters (Rx Upload, Tx Download) and formatted uptime.
      - Resilient offline router isolation: if any gateway times out or fails authentication, it falls back to the database snapshot (`ActiveSessionSnapshot`) and flags the router as `DEGRADED` without crashing the global sessions page.
      - Disconnect action terminating active client sessions on the router with audit logging (`DISCONNECT_PPPOE_SESSION`).
      - Automatic background persistence to `ActiveSessionSnapshot`.
    - `apps/api/src/sessions/sessions.controller.ts`: Role-guarded endpoints (`/sessions`, `/sessions/disconnect`).
    - `apps/api/src/sessions/sessions.module.ts`: Modular NestJS provider bundling.
  - Implemented modular frontend architecture for Sessions:
    - `apps/web/src/components/sessions/sessions.types.ts`: Domain models, freshness indicators, and router health contracts.
    - `apps/web/src/components/sessions/SessionStatsCards.tsx`: Modern, minimal, monochrome summary cards with rounded-2xl corners (Active PPPoE Sessions, Total Download Tx, Total Upload Rx, Gateways in Sync).
    - `apps/web/src/components/sessions/SessionFiltersBar.tsx`: Search bar, router selector, auto-refresh interval toggle (Off, 15s, 30s, 60s), and manual poll trigger.
    - `apps/web/src/components/sessions/DisconnectDialog.tsx`: Safe confirmation modal with rounded corners, session metrics summary, and audit note input.
    - `apps/web/src/app/dashboard/sessions/page.tsx`: Clean orchestrator table page with live freshness badge, real-time traffic statistics, and session disconnect controls.
  - Integration testing:
    - Co-located integration test suite `apps/api/src/sessions/sessions.test.ts` (4/4 tests passed).
- **Files Changed:**
  - `packages/shared/src/index.ts`
  - `apps/api/src/sessions/sessions.dto.ts`
  - `apps/api/src/sessions/sessions.service.ts`
  - `apps/api/src/sessions/sessions.controller.ts`
  - `apps/api/src/sessions/sessions.module.ts`
  - `apps/api/src/sessions/sessions.test.ts`
  - `apps/api/src/app.module.ts`
  - `apps/web/src/components/sessions/sessions.types.ts`
  - `apps/web/src/components/sessions/SessionStatsCards.tsx`
  - `apps/web/src/components/sessions/SessionFiltersBar.tsx`
  - `apps/web/src/components/sessions/DisconnectDialog.tsx`
  - `apps/web/src/app/dashboard/sessions/page.tsx`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm --filter @mikrotik-billing/api test src/sessions/sessions.test.ts` (4/4 tests passed)
  - `pnpm test` (All 76 tests passed across the monorepo)
  - `pnpm --filter @mikrotik-billing/web run build` (Static export and typecheck passed with exit code 0)
  - `curl http://localhost:3000/dashboard/sessions` (HTTP 200 OK)
- **Tests & Verification:**
  - Session retrieval and subscriber correlation test passed.
  - Resilient degradation during router failure test passed (offline router caught gracefully, snapshot fallback used).
  - Session termination & audit log test passed.
  - Cross-tenant session access isolation test passed.
- **Next Step:**
  - Section 11: Invoice and Billing Ledger (COMPLETED).

---

### Milestone Log: Section 11 — Invoice and Billing Ledger

- **Completed Work:**
  - Implemented modular backend architecture for invoicing, payment ledger, and billing runs:
    - `apps/api/src/billing/billing.dto.ts`: DTOs for invoice creation, line items, payment recording, reversals, and billing run forecasts.
    - `apps/api/src/billing/invoices.service.ts`:
      - Sequential invoice numbering (`INV-xxxxx`).
      - Line items calculation with subtotal, tax, discounts, and minor unit amounts in BDT.
      - Unique constraint enforcement preventing duplicate billing for the same subscription period (`[subscriptionId, billingPeriodStart]`).
      - Voiding mechanism blocking void of invoices with already-allocated payments.
    - `apps/api/src/billing/payments.service.ts`:
      - Sequential payment numbering (`PAY-xxxxx`).
      - Automatic FIFO allocation to oldest unpaid client invoices.
      - Partial and full payment tracking, updating invoice balances, setting `paidAt`, and transitioning status (`ISSUED` -> `PARTIALLY_PAID` -> `PAID`).
      - Reversal transaction mechanism: reverts allocations, restores invoice balances and statuses, marks payment `REVERSED`, and records audit logs.
    - `apps/api/src/billing/billing-runs.service.ts`:
      - Automated/manual batch billing run execution.
      - Safe dry-run simulation calculating eligible subscriptions and projected revenue without committing changes.
      - Idempotent live execution automatically skipping subscriptions with existing period invoices.
    - `apps/api/src/billing/billing.controller.ts`: Role-guarded endpoints (`/invoices`, `/invoices/:id`, `/invoices/:id/void`, `/payments`, `/payments/:id/reverse`, `/billing-runs`).
    - `apps/api/src/billing/billing.module.ts`: Modular NestJS provider bundling.
  - Implemented modular frontend architecture for Invoices, Payments, and Billing Runs:
    - `apps/web/src/components/billing/billing.types.ts`: Domain models for invoices, invoice lines, payments, allocations, and billing runs.
    - `apps/web/src/components/billing/InvoiceStatsCards.tsx`: Modern, minimal, monochrome summary cards with rounded-2xl corners (Total Invoiced, Total Collected, Outstanding Due, Overdue Invoices).
    - `apps/web/src/components/billing/InvoiceFiltersBar.tsx`: Real-time search, status filter pills (`ALL`, `ISSUED`, `PARTIALLY_PAID`, `PAID`, `OVERDUE`, `VOID`), and refresh.
    - `apps/web/src/components/billing/RecordPaymentModal.tsx`: Cashier modal with rounded-2xl styling for recording payments across cash, bKash, Nagad, and bank channels with balance checks.
    - `apps/web/src/components/billing/InvoiceReceiptModal.tsx`: Official printable invoice/receipt statement layout with line items table, BDT totals, and status stamps.
    - `apps/web/src/app/dashboard/invoices/page.tsx`: Clean orchestrator table page with rounded corners and monochrome design.
    - `apps/web/src/app/dashboard/payments/page.tsx`: Payments ledger page with reverse payment action and allocation traces.
    - `apps/web/src/app/dashboard/billing-runs/page.tsx`: Recurring billing run automation page with dry-run forecasting and execution history.
  - Integration testing:
    - Co-located integration test suite `apps/api/src/billing/billing.test.ts` (5/5 tests passed).
- **Files Changed:**
  - `apps/api/src/billing/billing.dto.ts`
  - `apps/api/src/billing/invoices.service.ts`
  - `apps/api/src/billing/payments.service.ts`
  - `apps/api/src/billing/billing-runs.service.ts`
  - `apps/api/src/billing/billing.controller.ts`
  - `apps/api/src/billing/billing.module.ts`
  - `apps/api/src/billing/billing.test.ts`
  - `apps/api/src/app.module.ts`
  - `apps/web/src/components/billing/billing.types.ts`
  - `apps/web/src/components/billing/InvoiceStatsCards.tsx`
  - `apps/web/src/components/billing/InvoiceFiltersBar.tsx`
  - `apps/web/src/components/billing/RecordPaymentModal.tsx`
  - `apps/web/src/components/billing/InvoiceReceiptModal.tsx`
  - `apps/web/src/app/dashboard/invoices/page.tsx`
  - `apps/web/src/app/dashboard/payments/page.tsx`
  - `apps/web/src/app/dashboard/billing-runs/page.tsx`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm --filter @mikrotik-billing/api test src/billing/billing.test.ts` (5/5 tests passed)
  - `pnpm test` (All 81 tests passed across the monorepo)
  - `pnpm --filter @mikrotik-billing/web run build` (Static export and typecheck passed with exit code 0)
  - `curl http://localhost:3000/dashboard/invoices` (HTTP 200 OK)
  - `curl http://localhost:3000/dashboard/payments` (HTTP 200 OK)
  - `curl http://localhost:3000/dashboard/billing-runs` (HTTP 200 OK)
- **Tests & Verification:**
  - Creation of invoices with line items, tax, discount, and balance in minor units passed.
  - Duplicate invoice prevention for same subscription period passed.
  - Payment recording, FIFO allocation, and status transitions passed.
  - Payment reversal restoring invoice balances passed.
  - Idempotent batch billing run with dry-run support passed.
- **Next Step:**
  - Section 12: Manual Payments and Reconciliation (COMPLETED).

---

### Milestone Log: Section 12 — Manual Payments and Reconciliation

- **Completed Work:**
  - Hardened payment idempotency & duplicate reference protection:
    - Added verification in `apps/api/src/billing/payments.service.ts` checking `externalReference` uniqueness per tenant.
    - Rejects duplicate transaction reference submissions with `409 ConflictException`.
  - Implemented financial reconciliation reporting engine:
    - Added `ReconciliationReportResponse`, `MethodBreakdown`, and `CollectorBreakdown` DTOs.
    - Implemented `getReconciliationReport` in `PaymentsService` calculating confirmed totals, reversals, net collections, and breakdown by payment channel (CASH, BKASH, NAGAD, etc.) and cashier/collector.
    - Exposed `@Get('payments/reconciliation')` in `BillingController` guarded by `PLATFORM_ADMIN`, `ISP_ADMIN`, `ISP_OPERATOR`, `CASHIER`, and `AUDITOR` roles.
  - Enforced permission separation:
    - Payment recording authorized for Cashiers and Operators.
    - Payment reversals strictly restricted to Administrators (`PLATFORM_ADMIN`, `ISP_ADMIN`).
  - Implemented modular frontend components with monochrome rounded-2xl design:
    - `apps/web/src/components/billing/PaymentStatsCards.tsx`: Sleek monochrome KPI cards displaying Gross Collections, Net Cash Flow, Reversals, and Average Collection.
    - `apps/web/src/components/billing/PaymentFiltersBar.tsx`: Real-time search, payment method dropdown, payment status dropdown, refresh action, and Daily Reconciliation trigger.
    - `apps/web/src/components/billing/ReconciliationReportModal.tsx`: Comprehensive modal for viewing audited balances, period range, method breakdown, collector breakdown, and printable export.
    - `apps/web/src/app/dashboard/payments/page.tsx`: Modular payments ledger with reverse confirmation dialog and allocations drill-down.
  - Verification & testing:
    - Added tests in `apps/api/src/billing/billing.test.ts` for duplicate external reference rejection and reconciliation reporting (7/7 billing tests passed).
- **Files Changed:**
  - `apps/api/src/billing/billing.dto.ts`
  - `apps/api/src/billing/payments.service.ts`
  - `apps/api/src/billing/billing.controller.ts`
  - `apps/api/src/billing/billing.test.ts`
  - `apps/web/src/components/billing/billing.types.ts`
  - `apps/web/src/components/billing/PaymentStatsCards.tsx`
  - `apps/web/src/components/billing/PaymentFiltersBar.tsx`
  - `apps/web/src/components/billing/ReconciliationReportModal.tsx`
  - `apps/web/src/components/ui/Modal.tsx`
  - `apps/web/src/app/dashboard/payments/page.tsx`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm --filter @mikrotik-billing/api test -- apps/api/src/billing/billing.test.ts` (7/7 tests passed)
  - `pnpm test` (All 83 tests passed across all 5 workspace projects)
  - `pnpm --filter @mikrotik-billing/web build` (All 16 static routes built successfully with 0 errors)
  - `curl -I http://localhost:3000/dashboard/payments` (HTTP 200 OK)
- **Tests & Verification:**
  - Duplicate payment submission rejected with `ConflictException`.
  - Audited reconciliation breakdown by method and collector verified.
  - Cashier vs Admin role enforcement verified.
  - Reversal transaction restoring invoice balances and audit trails verified.
- **Next Step:**
  - Section 13: Payment Gateway Integration & Webhooks (COMPLETED).

---

### Milestone Log: Section 13 — Payment Gateway Integration & Webhooks

- **Completed Work:**
  - Defined provider-neutral payment interface:
    - `packages/shared/src/payment-gateway.interface.ts`: `PaymentGatewayAdapter`, `PaymentInitiationRequest`, `PaymentInitiationResult`, `WebhookVerificationRequest`, `WebhookVerificationResult`, and supported providers (`BKASH`, `NAGAD`, `STRIPE`, `SSLCOMMERZ`, `SANDBOX_MOCK`).
    - `packages/shared/src/mock-payment-gateway-adapter.ts`: Cryptographic HMAC-SHA256 signature generator & validator with sandbox checkout URL synthesis.
  - Implemented backend payment gateway & webhook processing engine:
    - `apps/api/src/payment-gateways/payment-gateways.dto.ts`: DTOs for checkout initiation, webhook responses, and event logging.
    - `apps/api/src/payment-gateways/payment-gateways.service.ts`:
      - Initiates gateway checkout sessions before client redirect.
      - Authoritative server-to-server webhook verification enforcing secret keys and HMAC signatures.
      - Strict idempotency protection via `PaymentProviderEvent` table ensuring replayed callbacks return `already_processed` without double-crediting invoices.
      - Amount and currency validation preventing fraud and currency mismatch.
      - Automatic settlement transaction allocating received funds to unpaid invoices and transitioning invoice state to `PAID`.
    - `apps/api/src/payment-gateways/payment-gateways.controller.ts`:
      - `POST /payment-gateways/initiate`: Authenticated endpoint for initiating payment sessions.
      - `POST /webhooks/payments/:provider`: Public server-to-server webhook callback receiver.
      - `GET /payment-gateways/events`: Role-guarded endpoint for viewing incoming webhook logs and audit trail.
    - `apps/api/src/payment-gateways/payment-gateways.module.ts`: Modular NestJS provider module registered in `AppModule`.
  - Implemented modular frontend components with monochrome rounded-2xl design:
    - `apps/web/src/components/billing/OnlinePaymentModal.tsx`: Gateway selector (bKash, Nagad, Stripe, Sandbox Simulator), session initiation link, and instant sandbox settlement simulator.
    - `apps/web/src/components/billing/WebhookAuditModal.tsx`: Audited server-to-server callbacks modal displaying verified signatures, event IDs, status badges, and receipt timestamps.
    - Updated `apps/web/src/app/dashboard/invoices/page.tsx`: Added "Online" payment gateway launch button and modal integration.
    - Updated `apps/web/src/app/dashboard/payments/page.tsx`: Added "Gateway Webhooks" audit trigger button and modal integration.
  - Integration testing:
    - `packages/shared/src/payment-gateway.test.ts` (5/5 tests passed).
    - `apps/api/src/payment-gateways/payment-gateways.test.ts` (6/6 tests passed).
- **Files Changed:**
  - `packages/shared/src/payment-gateway.interface.ts`
  - `packages/shared/src/mock-payment-gateway-adapter.ts`
  - `packages/shared/src/payment-gateway.test.ts`
  - `packages/shared/src/index.ts`
  - `apps/api/src/payment-gateways/payment-gateways.dto.ts`
  - `apps/api/src/payment-gateways/payment-gateways.service.ts`
  - `apps/api/src/payment-gateways/payment-gateways.controller.ts`
  - `apps/api/src/payment-gateways/payment-gateways.module.ts`
  - `apps/api/src/payment-gateways/payment-gateways.test.ts`
  - `apps/api/src/app.module.ts`
  - `apps/web/src/components/billing/OnlinePaymentModal.tsx`
  - `apps/web/src/components/billing/WebhookAuditModal.tsx`
  - `apps/web/src/components/billing/PaymentFiltersBar.tsx`
  - `apps/web/src/app/dashboard/invoices/page.tsx`
  - `apps/web/src/app/dashboard/payments/page.tsx`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm --filter @mikrotik-billing/shared test` (22/22 tests passed)
  - `pnpm --filter @mikrotik-billing/api test -- apps/api/src/payment-gateways/payment-gateways.test.ts` (6/6 tests passed)
  - `pnpm test` (All 89 tests passed across the monorepo)
  - `pnpm --filter @mikrotik-billing/web build` (All 16 static routes compiled with code 0)
  - `curl -I http://localhost:3000/dashboard/invoices` (HTTP 200 OK)
- **Tests & Verification:**
  - Gateway checkout session generation before redirect verified.
  - Authoritative HMAC-SHA256 signature verification verified.
  - Duplicate/replayed webhook idempotency verified (zero duplicate financial mutations).
  - Currency mismatch and non-positive amount rejection verified.
  - Automatic invoice settlement and `PaymentProviderEvent` persistence verified.
- **Next Step:**
  - Section 14: SMS and Notification System (COMPLETED).

---

### Milestone Log: Section 14 — SMS and Notification System

- **Completed Work:**
  - Provider-neutral SMS foundation in shared package:
    - `packages/shared/src/sms.interface.ts`: `SmsAdapter`, `SmsSendRequest`, `SmsSendResult`, standard Bangladeshi mobile normalization and validation (`normalizePhoneNumber`, `isValidBdPhoneNumber`), and safe variable template rendering (`renderNotificationTemplate`).
    - `packages/shared/src/mock-sms-adapter.ts`: In-memory test and local development adapter with configurable failure simulation.
    - `packages/shared/src/sms.test.ts`: Unit tests verifying BD phone normalization, template variable substitution, and mock provider dispatch (4/4 tests passed).
  - Implemented backend notification service & management API:
    - `apps/api/src/notifications/notifications.dto.ts`: DTOs for direct SMS dispatch, template SMS dispatch, and template configuration.
    - `apps/api/src/notifications/notifications.service.ts`:
      - Automated seeding of default templates (`INVOICE_ISSUED`, `PAYMENT_RECEIVED`, `DUE_REMINDER`, `SUSPENSION_WARNING`, `SERVICE_SUSPENDED`, `SERVICE_RESTORED`).
      - Safe variable rendering with alias support (`name` <-> `subscriberName`, `paymentNumber` <-> `transactionReference`).
      - Graceful handling of disabled templates without blocking billing or payment operations.
      - Asynchronous message job queuing in `NotificationJob` table with status tracking (`QUEUED`, `DELIVERED`, `FAILED`).
      - Provider error handling, attempt counter, and manual retry mechanism (`retryJob`).
    - `apps/api/src/notifications/notifications.controller.ts`: Role-guarded endpoints (`/notifications/templates`, `/notifications/templates/:type`, `/notifications/logs`, `/notifications/send`, `/notifications/logs/:id/retry`).
    - `apps/api/src/notifications/notifications.module.ts`: Modular NestJS provider module registered in `AppModule`.
    - Integration tests in `apps/api/src/notifications/notifications.test.ts` (5/5 tests passed).
  - Implemented modular frontend components with monochrome rounded-2xl design:
    - `apps/web/src/components/notifications/notifications.types.ts`: Notification logs and template item models.
    - `apps/web/src/components/notifications/NotificationStatsCards.tsx`: Sleek monochrome KPI cards displaying Total Messages, Delivery Rate, Delivery Failures, and Active Templates.
    - `apps/web/src/components/notifications/NotificationLogsTable.tsx`: DataTable rendering recipient, message snippet, status badges, attempt counts, and manual Retry action.
    - `apps/web/src/components/notifications/NotificationTemplatesList.tsx`: Grid of template cards with status indicators, template snippets, and configure triggers.
    - `apps/web/src/components/notifications/TemplateEditorModal.tsx`: Modal for editing template body with click-to-insert dynamic variables tags, sample client SMS preview, and enable/disable toggle.
    - `apps/web/src/components/notifications/SendSmsModal.tsx`: Direct manual SMS composer with phone number validation and live character/segment counter.
    - `apps/web/src/app/dashboard/notifications/page.tsx`: Full tabbed dashboard page integrating logs and templates with search filtering.
  - Verification & testing:
    - `pnpm test` passed across all packages (103/103 tests passed across monorepo).
    - `pnpm --filter @mikrotik-billing/web build` passed with exit code 0 (17/17 static pages generated).
    - Verified HTTP 200 on `/dashboard/notifications`.
- **Files Changed:**
  - `packages/shared/src/sms.interface.ts`
  - `packages/shared/src/mock-sms-adapter.ts`
  - `packages/shared/src/sms.test.ts`
  - `packages/shared/src/index.ts`
  - `apps/api/src/notifications/notifications.dto.ts`
  - `apps/api/src/notifications/notifications.service.ts`
  - `apps/api/src/notifications/notifications.controller.ts`
  - `apps/api/src/notifications/notifications.module.ts`
  - `apps/api/src/notifications/notifications.test.ts`
  - `apps/api/src/app.module.ts`
  - `apps/web/src/components/notifications/notifications.types.ts`
  - `apps/web/src/components/notifications/NotificationStatsCards.tsx`
  - `apps/web/src/components/notifications/NotificationLogsTable.tsx`
  - `apps/web/src/components/notifications/NotificationTemplatesList.tsx`
  - `apps/web/src/components/notifications/TemplateEditorModal.tsx`
  - `apps/web/src/components/notifications/SendSmsModal.tsx`
  - `apps/web/src/app/dashboard/notifications/page.tsx`
  - `docs/implementation-status.md`
- **Commands Executed:**
  - `pnpm --filter @mikrotik-billing/shared test` (26/26 tests passed)
  - `pnpm --filter @mikrotik-billing/api test -- apps/api/src/notifications/notifications.test.ts` (5/5 tests passed)
  - `pnpm test` (All 103 tests passed across the monorepo)
  - `pnpm --filter @mikrotik-billing/web build` (All 17 static routes compiled with code 0)
  - `curl -I http://localhost:3000/dashboard/notifications` (HTTP 200 OK)
- **Tests & Verification:**
  - BD phone normalization and validation verified.
  - Safe variable rendering with alias support verified.
  - Skipping disabled templates safely verified.
  - Provider failure isolation and manual retry verified.
  - Automated tests guarantee zero real SMS network requests.
- **Next Step:**
  - Section 15: Automated Billing and Service Lifecycle (Suspensions & Restorations).







# MikroTik ISP Billing & Management Platform

## AI Agent Implementation Plan and Build Instructions

**Document type:** Product specification + implementation runbook\
**Goal:** Build a secure, fast, responsive, multi-tenant ISP billing and
MikroTik management web application.\
**Primary instruction to the AI coding agent:** Build the actual working
application, not just a plan, mockup, scaffold, or collection of
placeholder screens. Work section by section in the order below. After
every meaningful implementation step, run the relevant checks and tests,
fix failures, and only then continue.

------------------------------------------------------------------------

# 0. Mandatory Instructions for the AI Coding Agent

You are the lead engineer responsible for implementing this product end
to end.

## 0.1 Work in small, verified steps

1.  Inspect the repository and environment before changing anything.
2.  If an existing project is present, understand its structure and
    preserve useful work. Do not blindly replace files.
3.  Write a short implementation checklist based on this document.
4.  Implement only one section or small milestone at a time.
5.  After every step:
    -   Run formatting and lint checks.
    -   Run type checking.
    -   Run relevant unit and integration tests.
    -   Run database migrations or schema validation when applicable.
    -   Start the affected service and verify it actually works.
    -   For UI changes, run the app and verify the page at desktop and
        mobile viewport sizes. Use browser automation or screenshots if
        available.
    -   Fix every failure caused by your changes before moving forward.
6.  Do not mark a test as passed unless it was actually executed and
    passed. If a required tool is unavailable, explicitly state that and
    use the strongest alternative available.
7.  Do not leave core features as TODOs, fake buttons, hard-coded
    success messages, nonfunctional forms, or mock data presented as
    live data.
8.  Do not silently skip failing tests. Diagnose, fix, and rerun them.
9.  Keep `docs/implementation-status.md` updated after each milestone
    with:
    -   Completed work
    -   Files and modules changed
    -   Commands executed
    -   Tests and their actual results
    -   Known issues and next step
10. Keep the application runnable throughout development. Prefer small,
    reversible changes over large rewrites.

## 0.2 Required development loop

For every milestone, follow this loop:

1.  **Understand:** inspect the relevant code and requirements.
2.  **Plan:** list the exact files and behaviors to implement.
3.  **Implement:** make the smallest coherent change.
4.  **Verify:** run checks and tests.
5.  **Exercise:** test the feature through its real interface/API, not
    just through isolated functions.
6.  **Fix:** resolve regressions and repeat the checks.
7.  **Document:** record results and update this plan's status.
8.  **Proceed:** move to the next milestone only when acceptance
    criteria pass.

If a decision is not specified, choose a sensible, secure default,
document the decision in `docs/architecture-decisions.md`, and continue.
Ask the project owner only when a missing decision blocks safe progress
or could cause an irreversible business/security consequence.

## 0.3 Safety rules

-   Never test destructive router commands against a production router.
-   Use a dedicated lab MikroTik router or a mocked RouterOS API during
    development.
-   Never commit credentials, API tokens, private keys, customer data,
    or `.env` files.
-   Never expose router credentials or secrets to the browser.
-   Never claim a payment succeeded based only on a client-side
    redirect.
-   Never automatically suspend a real subscriber until policy, payment
    reconciliation, retry behavior, and manual recovery have been
    tested.
-   Do not run migrations that destroy user data without explicit
    approval and a backup.
-   Use fake fixtures for automated tests. Do not send real SMS messages
    or real payment requests during tests.
-   Treat router configuration as a privileged operation. Require
    authorization, validation, audit logging, and safe failure handling.

## 0.4 Definition of done

A milestone is done only when: - Its acceptance criteria are met. -
Relevant tests pass. - No new lint or type errors remain. - Error and
loading states are implemented where relevant. - The feature is
accessible and usable on desktop and mobile. - Security and tenant
isolation have been considered. - Documentation is updated. - No
important path is merely a placeholder.

------------------------------------------------------------------------

# 1. Product Vision and Scope

Build a web-based platform through which multiple independent ISP
companies can manage subscribers, MikroTik routers, PPPoE service,
packages, billing, payments, notifications, and network health.

The product should have: - A minimal, modern monochrome design. - Fast
initial loads and responsive interactions. - Desktop-first operational
tools that still work well on mobile. - A secure multi-tenant
architecture. - Clear separation between business records and router
operational state. - Reliable background processing for billing, SMS,
and router actions. - Auditability for important actions. - Recovery
paths when a router, SMS provider, payment provider, or worker is
unavailable.

## 1.1 Main user roles

Implement at least these roles:

-   **Platform administrator:** manages platform-level settings and ISP
    tenant accounts. Must not automatically have unrestricted access to
    customer secrets.
-   **ISP owner/admin:** manages their ISP, staff, routers, packages,
    subscribers, billing, and integrations.
-   **ISP operator/support:** can view subscribers and network status
    and perform only explicitly permitted actions.
-   **Cashier/billing staff:** can view invoices and record authorized
    payments, but cannot change router security settings.
-   **Read-only auditor:** can inspect allowed records and audit logs
    without making changes.

Use permission-based authorization, not just frontend route hiding.
Backend authorization is mandatory.

## 1.2 Main product modules

1.  Authentication and tenant management
2.  Staff, roles, and permissions
3.  Dashboard
4.  Router inventory and connection management
5.  MikroTik RouterOS integration
6.  PPPoE setup and subscriber provisioning
7.  Subscriber and subscription management
8.  Internet packages
9.  Invoices and payment ledger
10. Payment provider integration
11. SMS and notification templates
12. Scheduled billing and service lifecycle automation
13. Monitoring, reports, and audit logs
14. System settings, backups, health checks, and operations

## 1.3 Explicitly out of scope for the first MVP

Do not implement these before the core MVP is reliable: - Native
Android/iOS apps - Complex multi-country tax rules - AI-based network
optimization - Full network configuration management for every RouterOS
feature - Arbitrary shell/terminal execution on routers - Unreviewed
automatic changes to firewall, routing, or WAN configuration -
Microservices for every module

Keep the design extensible, but do not overengineer the initial release.

------------------------------------------------------------------------

# 2. Recommended Technology Stack

Use the following stack unless the existing repository has a strong,
documented reason to differ.

## 2.1 Monorepo

-   pnpm workspaces
-   TypeScript with strict mode
-   Shared linting, formatting, and type-checking configuration

Suggested layout:

``` text
isp-platform/
├── apps/
│   ├── web/                  # Next.js frontend
│   ├── api/                  # NestJS REST API
│   └── worker/               # Background job worker
├── packages/
│   ├── database/             # Prisma schema, migrations, seed
│   ├── shared/               # Shared types, validation schemas, constants
│   └── ui/                   # Shared UI components, if useful
├── infrastructure/
│   ├── docker-compose.yml
│   ├── docker-compose.test.yml
│   └── proxy/                 # Reverse-proxy configuration if required
├── docs/
│   ├── architecture.md
│   ├── architecture-decisions.md
│   ├── database.md
│   ├── api.md
│   ├── security.md
│   ├── operations.md
│   └── implementation-status.md
├── .env.example
├── package.json
├── pnpm-workspace.yaml
└── README.md
```

Adjust this layout if an existing repository already uses a coherent
structure. Avoid creating packages that add no value.

## 2.2 Frontend

-   Next.js App Router
-   React
-   TypeScript
-   Tailwind CSS
-   shadcn/ui components
-   Lucide icons
-   React Hook Form
-   Zod validation
-   TanStack Query for client-side server state where useful
-   Playwright for browser-based end-to-end tests

Use React Server Components for suitable read-only page composition. Use
client components only where interactivity requires them. Do not fetch
the same data independently in multiple layers without a reason.

## 2.3 Backend

-   NestJS
-   REST API with a versioned prefix such as `/api/v1`
-   OpenAPI/Swagger documentation
-   Prisma ORM
-   PostgreSQL
-   Redis and BullMQ for durable background jobs
-   Structured logging
-   Request IDs and consistent error responses

Use modules that reflect business domains, not one giant service or
controller.

## 2.4 Router integration

-   RouterOS REST API over HTTPS where supported, or native RouterOS
    API/API-SSL as appropriate.
-   Create an internal `RouterAdapter` interface so the rest of the
    application does not depend directly on one transport.
-   Begin with a lab router and mocked integration tests.
-   Prefer private connectivity or VPN. Do not expose router management
    ports publicly by default.
-   Do not store plaintext router credentials.
-   Use least-privilege RouterOS accounts where feasible.

## 2.5 Payments and SMS

-   Provider-neutral interfaces.
-   Implement local development/test adapters first.
-   Add a real payment provider only after the ledger and reconciliation
    workflow are tested.
-   Add a real Bangladesh-compatible SMS gateway behind a provider
    interface.
-   Tests must not send real money requests or real SMS messages.

## 2.6 Deployment

-   Docker Compose for local development and an initial single-host
    deployment.
-   PostgreSQL and Redis must use persistent volumes in deployment.
-   Use a reverse proxy with TLS in production.
-   Provide health checks, startup dependencies, restart policies,
    backups, and documented recovery.
-   Never expose PostgreSQL, Redis, or router management ports to the
    public internet.

------------------------------------------------------------------------

# 3. Architecture Principles

## 3.1 Business data versus operational state

PostgreSQL is the source of truth for business records: tenants,
subscribers, subscriptions, packages, invoices, payments, and audit
history.

Router state is operational state. A requested action is not successful
merely because it was queued or sent. Record: - Desired state - Job
status - Attempt count - Last error - Last attempt time - Confirmed
result - Last successful reconciliation time

The UI must distinguish `pending`, `in progress`, `succeeded`, `failed`,
`unknown`, and `needs attention` when relevant.

## 3.2 Router operations are asynchronous

Do not make the user wait for long router operations inside ordinary web
requests. Validate and persist the requested action, enqueue a job, and
report its status. Use a bounded timeout, retry policy, and
reconciliation process.

Do not blindly retry a non-idempotent action. Design router operations
to be idempotent where possible.

## 3.3 Multi-tenant isolation

Every ISP-owned record must be scoped to a tenant. The backend must
derive or validate the tenant from the authenticated session and
authorization context. Never trust a client-supplied `tenantId` as proof
of access.

Apply tenant filtering in every query and mutation. Add automated tests
proving that one ISP cannot read, update, delete, or infer another ISP's
records. Consider PostgreSQL Row-Level Security as additional
defense-in-depth, not as a substitute for correct application
authorization.

## 3.4 Reliability

-   Use transactions for financial changes.
-   Use idempotency keys for payment and retryable API operations where
    appropriate.
-   Use an outbox or equivalent reliable pattern when a committed
    database change must enqueue a job.
-   Use exponential backoff with jitter and a retry limit.
-   Dead-letter or flag jobs that exhaust retries.
-   Provide safe manual retry and recovery actions.
-   Reconcile business state against provider/router state periodically.

## 3.5 Security

-   Passwords: use a modern password hashing algorithm such as Argon2id
    or a well-maintained equivalent.
-   Sessions: use secure, HTTP-only, appropriately configured SameSite
    cookies or another documented secure session strategy.
-   CSRF: protect cookie-authenticated state-changing requests.
-   Secrets: encrypt router/provider credentials at rest using an
    application encryption key stored outside the database. Support key
    rotation planning.
-   Logs: redact passwords, tokens, authorization headers, payment
    secrets, and personal data not required for troubleshooting.
-   API: validate inputs, enforce authorization, rate-limit sensitive
    endpoints, and use consistent error handling.
-   Audit: record privileged changes and financial adjustments.
-   Production: disable debug endpoints and development credentials.

------------------------------------------------------------------------

# 4. UI and Design System Requirements

## 4.1 Visual direction

Create a polished, minimal monochrome operations dashboard.

Palette: - Main text: near-black - Secondary text: neutral gray - Main
background: white or near-white - Secondary surfaces: very light gray -
Borders: subtle gray - Critical status colors only for meaningful alerts
(for example, failure or warning)

Avoid: - Excessive gradients - Heavy shadows - Too many cards -
Oversized decorative charts - Unnecessary animations - A different style
on every page

Typography: Geist or Inter. Use a consistent spacing scale, restrained
radii, accessible contrast, clear hierarchy, and consistent icon sizing.

## 4.2 Navigation

Suggested sidebar: - Overview - Network - Routers - Active Sessions -
Network Events - Subscribers - Internet Packages - Billing - Invoices -
Payments - Outstanding Balances - Notifications - SMS Logs - Templates -
Reports - Staff & Roles - Settings

Only show navigation items the current role can access, but always
enforce permissions in the API.

## 4.3 Required shared UI components

Implement reusable components as needed: - Application shell and
responsive sidebar - Page title/header and breadcrumbs - Data table with
loading, empty, error, sort, filter, and pagination states - Search
input with debouncing where appropriate - Form fields with validation
and accessible error messages - Confirmation dialog for
destructive/privileged actions - Toast/notification system - Status
badge - Skeleton loaders - Error boundary and retry action - Date range
and amount formatting utilities - Pagination controls - Accessible
dropdown and modal - Unsaved changes warning for long forms

Do not make controls decorative. Every visible button or link must work
or be clearly disabled with a reason.

## 4.4 Responsive behavior

Verify at minimum: - Mobile: 360px and 390px wide - Tablet: 768px wide -
Desktop: 1280px and 1440px wide

On mobile: - Sidebar becomes a drawer or suitable compact navigation. -
Tables have deliberate responsive behavior: selected columns, horizontal
scroll, or a compact list view. - Important actions remain accessible. -
Forms fit the viewport and have usable touch targets. - No horizontal
page overflow. - Modals and dropdowns stay within the viewport.

## 4.5 Accessibility

-   Semantic HTML and proper labels
-   Keyboard navigation
-   Visible focus states
-   Dialog focus management
-   Sufficient contrast
-   Screen-reader labels for icon-only controls
-   Do not rely on color alone to convey status

------------------------------------------------------------------------

# 5. Data Model and Database Requirements

Create a documented ER diagram or equivalent relationship description
before implementing the complete schema. Use migrations, not ad hoc
production schema changes.

Expected core models (names may be adjusted consistently):

## 5.1 Identity and tenancy

-   `Tenant`
-   `User`
-   `TenantMembership`
-   `Role` or role/permission mappings
-   `Session` or refresh-token/session records, depending on auth
    strategy
-   `Invitation` if staff invitations are implemented

A user may belong to more than one tenant only if the product's identity
model deliberately supports it. Membership and role must be
tenant-specific.

## 5.2 Network

-   `Router`
-   `RouterCredential` or encrypted credential fields
-   `RouterStatusSnapshot`
-   `RouterJob`
-   `RouterJobAttempt`
-   `RouterEvent`
-   `RouterProfileMapping` or package-to-router-profile mapping
-   `ActiveSessionSnapshot` if storing session observations

Never store router passwords in logs or return them from normal API
responses.

## 5.3 Subscribers and service

-   `Subscriber`
-   `SubscriberContact` if multiple contacts are required
-   `Package`
-   `Subscription`
-   `PppoeAccount`
-   `ServiceEvent`
-   `ServiceSuspension` or a clear audited service-state history

Separate the subscriber/person record from a subscription/service
instance. A subscriber may change packages or have a historical
subscription.

PPPoE passwords are sensitive. If a router requires the original
password for provisioning, use an explicitly designed encrypted secret
store or a carefully documented alternative. Do not pretend a one-way
password hash can be retrieved for router provisioning.

## 5.4 Billing

-   `Invoice`
-   `InvoiceLine`
-   `Payment`
-   `PaymentAllocation`
-   `PaymentProviderEvent` or webhook receipt
-   `CreditAdjustment` or `LedgerEntry` if needed for a reliable audit
    trail
-   `BillingRun` or billing-cycle execution record

Use integer minor currency units or a well-defined decimal strategy.
Never use binary floating-point for money.

A payment may settle more than one invoice, and an invoice may receive
multiple payments if partial payments are supported. Model this
explicitly.

## 5.5 Notifications and audit

-   `NotificationTemplate`
-   `NotificationJob`
-   `SmsDeliveryAttempt`
-   `AuditLog`
-   `OutboxEvent` if using the transactional outbox pattern
-   `SystemSetting` only for non-secret tenant/platform configuration

## 5.6 Required data rules

-   Tenant-owned entities have a tenant association and appropriate
    indexes.
-   Add unique constraints for tenant-scoped values such as subscriber
    numbers or PPPoE usernames where business rules require uniqueness.
-   Store timestamps in UTC; display in the tenant's configured
    timezone.
-   Use explicit enums or validated state transitions for lifecycle
    states.
-   Soft-delete only where there is a real retention/business
    requirement. Financial history should not disappear through casual
    deletion.
-   Use database transactions and constraints to prevent duplicate
    invoice/payment effects.
-   Document retention and privacy considerations.

------------------------------------------------------------------------

# 6. API Design Requirements

Use a versioned API, consistent DTOs, validation, authorization guards,
pagination, and a consistent error envelope.

Suggested endpoint families:

``` text
/api/v1/auth/*
/api/v1/tenants/*
/api/v1/members/*
/api/v1/routers/*
/api/v1/router-jobs/*
/api/v1/packages/*
/api/v1/subscribers/*
/api/v1/subscriptions/*
/api/v1/pppoe-accounts/*
/api/v1/invoices/*
/api/v1/payments/*
/api/v1/payment-webhooks/*
/api/v1/notifications/*
/api/v1/reports/*
/api/v1/audit-logs/*
/api/v1/health/*
```

Requirements: - Document endpoints with OpenAPI. - Validate query
parameters and request bodies. - Use cursor or page-based pagination
consistently. - Do not return secrets in list/detail responses. - Use
suitable status codes. - Apply rate limits to login, password reset, and
sensitive actions. - Include request IDs in errors/logs. - Never leak
stack traces or internal credentials in production responses. - Do not
expose arbitrary RouterOS commands through a general-purpose endpoint.

------------------------------------------------------------------------

# 7. Section-by-Section Implementation Plan

Do not skip sections. Complete the acceptance criteria and verification
for each section before proceeding.

## Section 1 --- Repository Inspection and Project Setup

### Tasks

1.  Inspect the repository, available runtime versions, package
    managers, existing services, and current tests.
2.  Identify whether this is a new project or an existing codebase.
3.  Write `docs/architecture.md` and `docs/architecture-decisions.md`.
4.  Set up the monorepo and strict TypeScript configuration.
5.  Add formatting, linting, type checking, and test scripts.
6.  Add `.env.example` with placeholder values only.
7.  Add `.gitignore` and ensure secrets/build artifacts are excluded.
8.  Add a basic README with local setup commands.

### Tests

-   Install dependencies from a clean state.
-   Run formatting check, lint, typecheck, and test scripts.
-   Verify no real credentials are present in tracked files.
-   Verify each app/package can be discovered and built.

### Acceptance criteria

-   The project can be installed reproducibly.
-   All baseline checks pass.
-   Architecture and decisions are documented.

------------------------------------------------------------------------

## Section 2 --- Local Infrastructure and Developer Experience

### Tasks

1.  Create Docker Compose services for PostgreSQL and Redis.
2.  Add health checks and persistent development volumes.
3.  Configure the API, web app, and worker to use environment variables.
4.  Add startup scripts and clear service logs.
5.  Provide a safe database reset/seed workflow for local development.
6.  Add a basic `/health/live` and `/health/ready` strategy where
    appropriate.

### Tests

-   Start and stop services from documented commands.
-   Verify PostgreSQL and Redis health checks.
-   Verify persistence after container restart.
-   Verify the app reports dependency failure clearly when a service is
    unavailable.
-   Verify a clean setup works without undocumented manual steps.

### Acceptance criteria

-   A new developer can start the development environment using the
    README.
-   Services do not rely on data stored only inside disposable
    containers.

------------------------------------------------------------------------

## Section 3 --- Database Foundation and Migrations

### Tasks

1.  Design the ERD and document entity relationships.
2.  Implement initial Prisma models for tenancy, users, routers,
    subscribers, packages, subscriptions, invoices, payments, jobs, and
    audit logs.
3.  Add indexes and tenant-scoped uniqueness constraints.
4.  Add migrations and a development-only seed script with fake data.
5.  Add factories/fixtures for automated tests.
6.  Document migration and backup practices.

### Tests

-   Apply migrations to an empty database.
-   Verify schema generation and Prisma client generation.
-   Run migrations against a temporary test database.
-   Test key unique constraints and foreign-key constraints.
-   Verify seed data is clearly fake and idempotent.
-   Verify reset instructions cannot accidentally target production.

### Acceptance criteria

-   Database creation is reproducible.
-   Core relationships and constraints are documented and tested.
-   No production data is required for development.

------------------------------------------------------------------------

## Section 4 --- Authentication, Tenant Isolation, Roles, and Permissions

### Tasks

1.  Implement secure login/logout and session management.
2.  Implement password hashing and safe password handling.
3.  Implement tenant creation/onboarding.
4.  Implement tenant membership and role/permission checks.
5.  Protect every tenant-owned API route.
6.  Add authorization checks to sensitive operations.
7.  Add login throttling and security-aware error responses.
8.  Implement audit events for authentication and privileged actions
    where appropriate.
9.  Build sign-in, onboarding, staff, and access-denied screens.

### Tests

-   Login success and failure cases.
-   Expired/invalid session behavior.
-   Unauthorized and forbidden API calls.
-   Cross-tenant read, update, delete, and enumeration attempts.
-   Role matrix tests for all privileged operations.
-   CSRF/session security tests appropriate to the chosen strategy.
-   Verify secrets never appear in API responses or logs.

### Acceptance criteria

-   A tenant cannot access another tenant's data.
-   Frontend hiding is not the only authorization mechanism.
-   Sensitive operations are denied by default.

------------------------------------------------------------------------

## Section 5 --- UI Foundation and Design System

### Tasks

1.  Build the app shell and responsive navigation.
2.  Define monochrome design tokens, typography, spacing, radii,
    borders, and focus states.
3.  Implement shared forms, tables, status badges, dialogs, toast
    messages, skeletons, and error states.
4.  Create reusable loading, empty, and error page patterns.
5.  Add route-level permission-aware navigation.
6.  Implement responsive behavior and keyboard accessibility.
7.  Establish visual regression or screenshot testing if available.

### Tests

-   Run lint/typecheck and component tests.
-   Run browser tests at 360px, 390px, 768px, 1280px, and 1440px widths.
-   Verify no horizontal overflow.
-   Verify keyboard focus and form labels.
-   Verify loading, empty, failure, and success states.
-   Verify every visible control has a meaningful behavior.

### Acceptance criteria

-   The UI is visually consistent and responsive.
-   Common components are reused rather than reimplemented differently
    on each page.
-   No dead buttons or placeholder navigation remain in completed
    screens.

------------------------------------------------------------------------

## Section 6 --- Router Inventory and Secure Connection Management

### Tasks

1.  Define a `RouterAdapter` interface.
2.  Implement a mock adapter for development and tests.
3.  Implement the RouterOS API adapter for supported operations.
4.  Add router registration, connection testing, edit, disable, and safe
    removal/archive flows.
5.  Encrypt credentials at rest and redact them from responses/logs.
6.  Add connection timeout and error mapping.
7.  Collect basic identity and health information: RouterOS version,
    uptime, CPU, memory, interface status where supported.
8.  Store status snapshots with timestamps.
9.  Add background health polling with per-router concurrency limits.
10. Show last-seen time, status, and clear stale-data indicators in the
    UI.

### Tests

-   Mock successful and failed connections.
-   Test timeout, authentication failure, unreachable router, and
    malformed response.
-   Test credential encryption/decryption behavior and key
    misconfiguration.
-   Verify secrets are not returned by APIs or included in logs.
-   Verify one offline router does not block other routers.
-   Verify status timestamps and stale indicators.
-   Test on a dedicated lab router before enabling real integration.

### Acceptance criteria

-   An authorized ISP user can register a router and see connection
    status.
-   Router failures are visible and do not crash the platform.
-   Router credentials are protected.

------------------------------------------------------------------------

## Section 7 --- PPPoE Setup and Router Configuration

### Tasks

1.  Document the supported RouterOS versions and exact operations.
2.  Implement a read-only inspection step before configuration.
3.  Add a guided setup workflow that checks prerequisites and displays
    the planned changes.
4.  Support only explicitly scoped, documented PPPoE setup operations in
    the MVP.
5.  Support safe PPP profile creation/update for supported settings.
6.  Add an explicit confirmation before applying privileged
    configuration changes.
7.  Track each change as a `RouterJob` with status, attempts, result,
    and error details.
8.  Add post-change verification by reading the resulting router
    configuration.
9.  Add safe retry and reconciliation behavior.
10. Do not reset, reconfigure WAN access, alter firewall policy, or
    overwrite unrelated configuration automatically.

### Tests

-   Test prerequisite checks with mock router responses.
-   Test dry-run/plan output.
-   Test confirmation requirement.
-   Test API errors and partial failures.
-   Test idempotent reapplication of the same desired configuration.
-   Test post-change verification.
-   Test against a lab router and document any version-specific
    limitations.

### Acceptance criteria

-   The application can guide and verify a supported PPPoE
    configuration.
-   Unrelated router configuration is not modified.
-   Failed operations remain visible and recoverable.

------------------------------------------------------------------------

## Section 8 --- Internet Packages

### Tasks

1.  Implement package create, read, update, archive, and
    list/search/filter.
2.  Store speed limits, price, billing interval, service rules, and
    optional description.
3.  Define how each package maps to a RouterOS profile or RADIUS policy.
4.  Validate values and disallow ambiguous or unsupported speed formats.
5.  Prevent deleting a package that has active subscriptions; offer
    archive/deactivation instead.
6.  Build the package list and create/edit form.
7.  Add audit events for changes that affect active subscribers.
8.  Define whether package changes apply immediately or at the next
    renewal. Make the policy explicit.

### Tests

-   CRUD and validation tests.
-   Tenant-isolation tests.
-   Package-in-use archive/delete tests.
-   Price and billing-interval tests.
-   Router profile mapping tests.
-   Verify UI validation and server validation agree.

### Acceptance criteria

-   Packages are tenant-scoped, validated, and assignable to
    subscribers.
-   Package lifecycle behavior is explicit and audited.

------------------------------------------------------------------------

## Section 9 --- Subscriber and Subscription Management

### Tasks

1.  Implement subscriber create, view, edit, search, filtering,
    pagination, and archive.
2.  Store contact details and service address only as required by the
    product.
3.  Implement separate subscription records with package, router,
    lifecycle dates, and state.
4.  Implement PPPoE account creation with tenant-scoped username
    uniqueness rules.
5.  Generate or accept credentials securely; never display a password
    again by default after creation.
6.  Provision PPPoE credentials through the router adapter or the
    selected RADIUS path.
7.  Track desired state and confirmed router state separately.
8.  Add service status actions with permissions and confirmation.
9.  Add subscriber detail page with subscription, router, package,
    invoice, payment, and event history.
10. Provide import/export only after validation, authorization, and
    audit behavior are defined.

### Tests

-   Subscriber CRUD and validation.
-   Duplicate usernames and conflicting router assignments.
-   Cross-tenant access.
-   Failed provisioning and retry.
-   Provisioning success verified against mock/lab router.
-   Password redaction in list/detail/logs.
-   Subscription state transitions.
-   Responsive subscriber forms and table.

### Acceptance criteria

-   An authorized user can add a subscriber, assign a package, and
    provision a PPPoE account.
-   Failures are visible and do not create false success states.
-   Subscriber history remains available.

------------------------------------------------------------------------

## Section 10 --- PPPoE Active Sessions and Usage Monitoring

### Tasks

1.  Implement an adapter method to retrieve active PPP sessions.
2.  Normalize router responses into a stable internal model.
3.  Show username, router, session start time, assigned address, and
    supported traffic counters.
4.  Poll in the background and store recent snapshots only where useful.
5.  Handle sessions that disappear between polls.
6.  Make clear that cached snapshots may be stale.
7.  Add filters by router, status, and subscriber.

### Tests

-   Empty sessions, many sessions, malformed responses, and offline
    routers.
-   Pagination/filter behavior.
-   Stale snapshot behavior.
-   Ensure one router failure does not break the global session page.
-   Validate displayed data against lab router output.

### Acceptance criteria

-   Users can view active PPPoE sessions with clear freshness
    indicators.
-   Monitoring does not create excessive router API load.

------------------------------------------------------------------------

## Section 11 --- Invoice and Billing Ledger

### Tasks

1.  Finalize billing policies: billing date, due date, proration,
    package changes, late fees if any, grace period, and suspension
    rules.
2.  Implement invoice and invoice-line models.
3.  Implement invoice generation for one subscription and for a billing
    run.
4.  Implement draft/issued/partially-paid/paid/void/overdue states with
    validated transitions.
5.  Use database transactions and unique billing-period constraints to
    prevent duplicate invoices.
6.  Implement payment allocation and outstanding balance calculations.
7.  Implement invoice detail, printable receipt/invoice, and billing
    history.
8.  Record adjustments and reversals instead of silently rewriting
    financial history.
9.  Keep currency and timezone rules explicit.
10. Add an idempotent billing-run mechanism.

### Tests

-   Invoice amount and due-date calculations.
-   Duplicate billing run prevention.
-   Partial and full payments.
-   Multiple invoices settled by one payment, if supported.
-   Transaction rollback on failure.
-   Rounding and currency formatting.
-   Timezone and billing-boundary cases.
-   Tenant isolation and audit history.

### Acceptance criteria

-   Billing produces consistent, auditable invoice records.
-   Re-running a billing job cannot create duplicate invoices for the
    same subscription and period.
-   Financial amounts do not use floating-point arithmetic.

------------------------------------------------------------------------

## Section 12 --- Manual Payments and Reconciliation

### Tasks

1.  Implement payment recording for authorized cash/manual payment
    workflows.
2.  Store amount, currency, received time, method, external reference,
    collector, and notes as appropriate.
3.  Implement idempotency and duplicate-reference protection.
4.  Allocate payments to invoices transactionally.
5.  Generate a receipt identifier.
6.  Support payment reversal/refund/adjustment through audited workflows
    rather than deletion.
7.  Implement payment history and reconciliation views.
8.  Separate `pending`, `confirmed`, `failed`, `reversed`, and other
    relevant payment states.

### Tests

-   Correct balance calculation.
-   Duplicate payment submission.
-   Concurrent payment attempts.
-   Partial payment and overpayment policy.
-   Reversal and reallocation behavior.
-   Permission tests for cashier versus admin.
-   Verify every financial mutation creates an audit record.

### Acceptance criteria

-   Authorized staff can record and reconcile payments without
    corrupting balances.
-   Duplicate submissions do not create duplicate financial effects.

------------------------------------------------------------------------

## Section 13 --- Payment Gateway Integration

### Tasks

1.  Select a provider only after the core ledger is stable.
2.  Define a provider-neutral payment interface.
3.  Implement sandbox mode first.
4.  Create a payment initiation record before redirecting or presenting
    payment instructions.
5.  Verify provider callbacks/webhooks server-to-server.
6.  Verify signatures, amounts, currency, merchant identity, and
    transaction references.
7.  Store webhook receipts and process events idempotently.
8.  Reconcile delayed, duplicate, out-of-order, and missing webhooks.
9.  Never trust a client redirect as proof of payment.
10. Document the production configuration and operational recovery
    procedure.

### Tests

-   Valid and invalid signatures.
-   Duplicate and replayed webhooks.
-   Amount/currency mismatch.
-   Out-of-order events.
-   Delayed confirmation.
-   Provider timeout and unavailable service.
-   Sandbox end-to-end payment.
-   Ensure tests never charge real money.

### Acceptance criteria

-   A payment is credited only after authoritative provider
    verification.
-   Repeated callbacks cannot credit the same transaction twice.
-   Unknown payment states can be reconciled safely.

------------------------------------------------------------------------

## Section 14 --- SMS and Notification System

### Tasks

1.  Define a provider-neutral SMS interface.
2.  Implement a fake provider for automated tests and local development.
3.  Add configurable templates for invoice issued, due reminder, payment
    confirmation, suspension warning, and service restored.
4.  Support variable validation and safe template rendering.
5.  Enqueue messages in a background worker.
6.  Track queued, sent/submitted, delivered, failed, and unknown states
    according to provider capabilities.
7.  Add retry policies and rate limits.
8.  Store provider response codes without logging sensitive data.
9.  Add SMS logs, filters, retry controls, and provider settings.
10. Require explicit configuration before enabling live SMS.

### Tests

-   Template rendering and missing variables.
-   Invalid phone number.
-   Provider timeout and error response.
-   Retry and duplicate-send prevention.
-   Delivery receipt processing where supported.
-   Verify automated tests do not contact the real provider.

### Acceptance criteria

-   SMS sending is asynchronous, observable, and recoverable.
-   A temporary provider failure does not block billing operations.

------------------------------------------------------------------------

## Section 15 --- Automated Billing and Service Lifecycle

### Tasks

1.  Implement scheduled billing runs.
2.  Implement due-date reminders with deduplication.
3.  Implement grace periods and suspension eligibility rules.
4.  Ensure payment state is reconciled before suspension.
5.  Queue router/RADIUS suspension as an explicit job.
6.  Restore service after verified payment according to policy.
7.  Keep business payment state independent from router connectivity.
8.  Add a dry-run mode for billing and suspension jobs.
9.  Add an admin view of pending/failed jobs and safe retry actions.
10. Provide a manual override with reason, permissions, and audit trail.
11. Add periodic reconciliation for subscriptions, invoices, and service
    state.

### Tests

-   Due-date boundary cases and tenant timezone.
-   Grace-period behavior.
-   No suspension when payment is pending or confirmed but not yet
    reconciled.
-   Router offline during suspension/reactivation.
-   Retry without duplicate effects.
-   Manual override permission and audit.
-   Dry-run makes no external changes.
-   Verify payment processing is not blocked by router failure.

### Acceptance criteria

-   Automation is deterministic, idempotent, auditable, and recoverable.
-   No real subscriber is automatically suspended until the complete
    policy has passed lab and staging tests.

------------------------------------------------------------------------

## Section 16 --- Dashboard, Reports, and Audit Trail

### Tasks

1.  Build dashboard summaries for active subscribers, online sessions,
    routers online/offline, outstanding invoices, collections, and
    recent events.
2.  Define every metric precisely and document its calculation/window.
3.  Serve expensive summaries through aggregate queries or short-lived
    caches.
4.  Include data freshness timestamps for router metrics.
5.  Implement reports for subscriber counts, collections, overdue
    balances, and router health.
6.  Add date range, router, package, and status filters where relevant.
7.  Implement audit log browsing with safe filtering and pagination.
8.  Ensure reports are tenant-scoped and permission-protected.

### Tests

-   Verify summary calculations against known fixtures.
-   Test empty datasets and large datasets.
-   Tenant isolation.
-   Date/timezone boundaries.
-   Cache invalidation or acceptable staleness.
-   Audit logs for privileged actions.
-   Confirm dashboard requests do not query every router synchronously.

### Acceptance criteria

-   Dashboard figures match source records.
-   Cached operational data is labeled with its freshness.
-   Reports cannot expose another tenant's data.

------------------------------------------------------------------------

## Section 17 --- Performance and Scale

### Tasks

1.  Measure baseline page load, API latency, query duration, and worker
    throughput.
2.  Add indexes based on query patterns and query plans.
3.  Add pagination to all potentially large lists.
4.  Avoid N+1 queries and oversized responses.
5.  Cache safe, nonfinancial summaries where beneficial.
6.  Poll routers in workers with concurrency limits and per-router
    timeouts.
7.  Use bounded queues and backpressure.
8.  Lazy-load heavy charts and nonessential client code.
9.  Avoid unnecessary rerenders and duplicate data requests.
10. Document the target environment and load-test assumptions.

### Suggested initial performance targets

Treat these as targets to measure, not claims: - Typical cached/read API
responses: p95 below 300 ms under the agreed test load. - Typical
indexed database-backed list API: p95 below 500 ms under the agreed test
load, excluding slow external systems. - No unbounded list endpoints. -
Dashboard should render useful summary information before slow network
details arrive. - UI should remain usable while a router is offline. -
Router polling must not create uncontrolled concurrency.

### Tests

-   Load-test representative read and write endpoints.
-   Inspect slow query logs and query plans.
-   Test large subscriber lists.
-   Test many routers timing out simultaneously.
-   Verify background work does not block API request handling.
-   Record measured results and environment in `docs/performance.md`.

### Acceptance criteria

-   Performance claims are backed by repeatable measurements.
-   No known unbounded query or polling behavior remains.

------------------------------------------------------------------------

## Section 18 --- Security Review and Hardening

### Tasks

1.  Review authentication, session handling, CSRF strategy, and
    authorization.
2.  Review tenant isolation across every module.
3.  Review input validation and output redaction.
4.  Review rate limiting and abuse cases.
5.  Review credential encryption and key management.
6.  Review webhook signatures and idempotency.
7.  Review router network exposure and least privilege.
8.  Review dependency vulnerabilities.
9.  Ensure production errors do not leak secrets or stack traces.
10. Add audit coverage for privileged and financial actions.
11. Document incident response, credential rotation, and backup
    recovery.

### Tests

-   Cross-tenant penetration-style tests.
-   Authorization matrix tests.
-   Secret scanning.
-   Dependency audit.
-   Malformed-input tests.
-   Session expiry and invalidation.
-   Webhook replay tests.
-   Verify no management port is accidentally published by default in
    production Compose configuration.

### Acceptance criteria

-   High-severity issues found by the project's automated checks are
    fixed or explicitly documented with mitigation and owner approval.
-   Security limitations are not concealed.

------------------------------------------------------------------------

## Section 19 --- End-to-End Testing and Release Readiness

### Tasks

1.  Create a repeatable staging environment.
2.  Seed it with fake tenants, users, routers, subscribers, packages,
    invoices, and payments.
3.  Run end-to-end tests for the main workflows.
4.  Test background worker restarts and queue recovery.
5.  Test database backup and restore.
6.  Test migration from the previous application version if applicable.
7.  Verify logs, health checks, alerts, and operational runbooks.
8.  Write a release checklist and rollback procedure.
9.  Do a final desktop/mobile UI review.
10. Record known limitations.

### Required end-to-end scenarios

-   ISP registration and login.
-   Tenant A cannot access Tenant B.
-   Register a mock/lab router.
-   Verify router connection failure is displayed accurately.
-   Create a package.
-   Add a subscriber and provision a PPPoE account.
-   Verify provisioning failure is recoverable.
-   Generate an invoice exactly once.
-   Record a manual payment and verify the balance.
-   Process duplicate payment webhook without duplicate credit.
-   Enqueue an SMS and simulate provider failure/retry.
-   Verify grace period and suspension dry-run.
-   Verify restoration after confirmed payment.
-   Verify audit history for privileged changes.
-   Use the main screens at mobile and desktop sizes.

### Acceptance criteria

-   All required end-to-end tests pass.
-   Backup restoration is demonstrated.
-   Release and rollback instructions are usable by someone other than
    the author.

------------------------------------------------------------------------

# 8. Testing Strategy

Use multiple layers. A passing unit test alone does not prove that a
feature works.

## 8.1 Unit tests

Test business rules in isolation: - Invoice calculations - Package
validation - Subscription transitions - Payment allocation - Tenant
authorization helpers - SMS template rendering - Retry/backoff
decisions - Router response normalization

## 8.2 Integration tests

Use a temporary test database and mock external services: - API +
database - Database transactions - BullMQ job handling - Webhook receipt
and processing - Router adapter behavior - Authorization and tenant
filtering

## 8.3 End-to-end tests

Use Playwright against a running test environment: - Authentication -
Subscriber creation - Package creation - Invoice and payment flows -
Error handling - Responsive layouts - Role restrictions

## 8.4 External systems

-   Use a fake RouterOS adapter for most automated tests.
-   Use a dedicated lab router for integration verification.
-   Use payment sandbox credentials only for payment integration tests.
-   Use a fake SMS provider by default.
-   Keep real provider tests opt-in and clearly separated from the
    default test suite.

## 8.5 Required checks after each change

Run the relevant versions of: - Formatter check - Linter - Type
checker - Unit tests - Integration tests - Build - Database migration
validation - Browser tests for UI-critical changes

Use the repository's actual scripts. If scripts do not exist, add them.
Record exact commands and outcomes in `docs/implementation-status.md`.

------------------------------------------------------------------------

# 9. Operational Requirements

## 9.1 Observability

-   Structured logs with request/job IDs
-   Health endpoints
-   Worker/job failure visibility
-   Router last-seen timestamps
-   Provider failure visibility
-   Redaction of secrets and sensitive values
-   Basic metrics for API latency, queue depth, job failures, and router
    connectivity

## 9.2 Backups

-   Automated PostgreSQL backups
-   Defined retention
-   Off-host or otherwise resilient backup storage
-   Documented restore procedure
-   Periodic restore test
-   Protect backup files because they contain customer and billing data

## 9.3 Configuration

-   Keep `.env.example` updated.
-   Validate required environment variables at startup.
-   Fail clearly when required secrets are missing.
-   Never use default production credentials.
-   Separate development, test, staging, and production configuration.

## 9.4 Deployment

-   Build reproducible containers.
-   Use health checks and safe startup ordering.
-   Use TLS at the edge.
-   Restrict database and Redis network exposure.
-   Apply migrations as a deliberate release step.
-   Document rollback limitations for irreversible schema/data changes.

------------------------------------------------------------------------

# 10. Final Acceptance Checklist

Do not declare the platform complete until each applicable item has been
verified.

## Product

-   [ ] ISP can register and log in.
-   [ ] Tenant data is isolated.
-   [ ] Roles and permissions work in the backend.
-   [ ] Router inventory and connection health work.
-   [ ] PPPoE configuration flow is tested against a lab router.
-   [ ] Packages can be created and assigned.
-   [ ] Subscribers and subscriptions can be managed.
-   [ ] Active PPPoE sessions can be inspected.
-   [ ] Invoices are generated without duplication.
-   [ ] Manual payments are recorded and reconciled.
-   [ ] Payment provider callbacks are verified and idempotent.
-   [ ] SMS jobs are queued, tracked, and retried safely.
-   [ ] Automated billing and service lifecycle have dry-run and
    recovery controls.
-   [ ] Dashboard and reports match source records.
-   [ ] Audit logs capture sensitive operations.

## UX and performance

-   [ ] Monochrome design is consistent.
-   [ ] Desktop and mobile layouts are tested.
-   [ ] Loading, empty, error, and success states exist.
-   [ ] No dead buttons or fake success states remain.
-   [ ] Large lists are paginated.
-   [ ] Dashboard does not synchronously query every router.
-   [ ] Performance has been measured and documented.

## Engineering and operations

-   [ ] Formatting, lint, typecheck, tests, and build pass.
-   [ ] Migrations are reproducible.
-   [ ] Secrets are not committed or logged.
-   [ ] Router credentials are encrypted at rest.
-   [ ] No public router management exposure is enabled by default.
-   [ ] Backup and restore have been tested.
-   [ ] Deployment and rollback procedures are documented.
-   [ ] Known limitations are documented honestly.

------------------------------------------------------------------------

# 11. Instructions for the AI Agent: Begin Execution Now

**Do not respond with another high-level plan. Start implementing the
project.**

1.  Inspect the repository and environment.
2.  Report briefly what already exists and any constraints you discover.
3.  Create or update `docs/implementation-status.md`.
4.  Turn this document into a checklist and begin **Section 1 only**.
5.  Execute the checks for Section 1 and fix failures.
6.  Once Section 1 meets its acceptance criteria, proceed to Section 2.
7.  Continue sequentially through the sections. Do not skip testing to
    save time.
8.  After each section, summarize:
    -   What was implemented
    -   Important files changed
    -   Exact checks/tests run and their results
    -   Any issue that remains
    -   The next section to work on
9.  If you have access to terminal, filesystem, browser, and test tools,
    use them to build and verify the real application. Do not merely
    print code for the user to copy.
10. If you cannot execute a required test or interact with a real
    router/provider, say exactly what is blocked, test using a safe
    mock, and leave the real integration clearly marked as unverified.
11. Keep going after each successful section rather than stopping after
    scaffolding or the first screen.
12. Never claim the full product is finished until the final acceptance
    checklist is actually satisfied.

**Start now with repository inspection, then implement Section 1 and
verify it.**

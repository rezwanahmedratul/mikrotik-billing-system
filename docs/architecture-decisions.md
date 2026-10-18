# Architecture Decision Records (ADRs)

## ADR-001: Monorepo Structure and Tooling

- **Status:** Accepted
- **Context:** The platform consists of a frontend web app, a backend REST API, a background worker, a shared database schema, and shared validation/types.
- **Decision:** Use `pnpm` workspaces with TypeScript in strict mode. pnpm provides fast, disk-efficient dependency deduplication and clean workspace linking.
- **Consequences:** All packages share consistent TypeScript and ESLint standards. Code re-use across backend, worker, and frontend is seamless via `@mikrotik-billing/shared` and `@mikrotik-billing/database`.

---

## ADR-002: Multi-Tenant Isolation Strategy

- **Status:** Accepted
- **Context:** Independent ISPs share the platform without seeing or accessing each other's subscribers, credentials, routers, or financial records.
- **Decision:** Implement tenant isolation at the application layer with mandatory `tenantId` foreign keys on all ISP-owned entities. Every authenticated request derives the active `tenantId` securely from verified JWT/session claims. API endpoints enforce tenant scoping in every Prisma query.
- **Consequences:** Low operational overhead compared to separate databases per tenant, with strong tenant boundary enforcement verified via automated cross-tenant security test suites.

---

## ADR-003: Asynchronous Router Operations & Desired State Tracking

- **Status:** Accepted
- **Context:** Direct synchronous communication with remote MikroTik routers during HTTP requests causes timeouts, crashes on unreachable routers, and leaves inconsistent system state.
- **Decision:** All router mutations (PPPoE user creation, profile binding, suspension, reactivation) are enqueued as `RouterJob` tasks processed asynchronously by the BullMQ worker. The database stores both `desiredState` and `confirmedState`.
- **Consequences:** Web API calls respond in sub-second times without blocking on network latency. Failures are captured with retry backoff and observable in the UI.

---

## ADR-004: Financial Ledger and Integer Currency Units

- **Status:** Accepted
- **Context:** Floating-point rounding errors in billing systems create accounting discrepancies and reconciliation failures.
- **Decision:** Represent all monetary amounts (invoice totals, line item prices, payments, adjustments) in integer minor units (e.g. cents, poisha, or minor currency unit). Invoicing operations are wrapped in PostgreSQL transactions.
- **Consequences:** Mathematical precision is guaranteed. Duplicate invoice generation is prevented through database unique constraints on `[subscriptionId, billingPeriodStart]`.

---

## ADR-005: Credential Encryption at Rest

- **Status:** Accepted
- **Context:** MikroTik router passwords and sensitive external gateway keys cannot be hashed one-way, because they must be used to authenticate with routers and providers.
- **Decision:** Encrypt router credentials and API secrets using AES-256-GCM with an application master key configured via environment variable (`APP_ENCRYPTION_KEY`). Never return decrypted credentials in standard API responses or logs.
- **Consequences:** Database compromise does not expose plaintext router credentials. Secrets are decrypted strictly in memory at the time of adapter execution.

---

## ADR-006: UI Foundation & Monochrome Aesthetic

- **Status:** Accepted
- **Context:** Operators need a fast, high-density, professional dashboard suitable for both desktop operations and on-the-go mobile monitoring.
- **Decision:** Build a modern monochrome design system utilizing Next.js, Tailwind CSS, Lucide icons, and responsive layouts. Rely on stark neutrals, subtle borders, high-contrast typography, and purposeful status badges.
- **Consequences:** Clean, clutter-free user experience with zero distractions and responsive layouts tested across 360px, 390px, 768px, 1280px, and 1440px viewports.

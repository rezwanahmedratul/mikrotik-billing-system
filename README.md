# MikroTik ISP Billing & Management Platform

A secure, multi-tenant ISP billing and MikroTik RouterOS management platform.

---

## 1. System Requirements

- **Node.js**: >= 20.0.0 (Tested on Node.js v24)
- **pnpm**: >= 9.0.0 (Workspace enabled)
- **Docker & Docker Compose**: For PostgreSQL, Redis, and local infrastructure

---

## 2. Monorepo Organization

```text
├── apps/
│   ├── api/                  # NestJS REST API with Swagger documentation
│   ├── web/                  # Next.js App Router monochrome operations console
│   └── worker/               # BullMQ background job processing worker
├── packages/
│   ├── database/             # Prisma schema, migrations, seeders, and db client
│   └── shared/               # Shared domain types, enums, validation schemas, and utilities
├── infrastructure/
│   ├── docker-compose.yml    # Development PostgreSQL and Redis services
│   └── docker-compose.test.yml
├── docs/                     # System architecture, ADRs, status tracking
└── README.md
```

---

## 3. Quick Start

### 3.1 Install Dependencies

```bash
pnpm install
```

### 3.2 Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

### 3.3 Start Infrastructure (PostgreSQL & Redis)

```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

### 3.4 Build, Lint & Run Tests

```bash
# Type-checking across all workspaces
pnpm run typecheck

# Run test suites across packages and apps
pnpm run test

# Build all applications and packages
pnpm run build
```

---

## 4. Development Commands

```bash
# Start API dev server (port 4000)
pnpm --filter @mikrotik-billing/api dev

# Start Web console dev server (port 3000)
pnpm --filter @mikrotik-billing/web dev

# Start Background worker
pnpm --filter @mikrotik-billing/worker dev
```

---

## 5. Security & Safety

- Router passwords and API secrets are encrypted at rest using AES-256-GCM (`APP_ENCRYPTION_KEY`).
- Router communication is isolated behind `RouterAdapter`. Unit and CI test suites use `MockRouterAdapter` by default.
- Never commit `.env` or production credentials.

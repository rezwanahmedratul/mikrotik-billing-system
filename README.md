# MikroTik ISP Billing & RouterOS Operations Platform

[![Next.js 15](https://img.shields.io/badge/Next.js-15.5-black?style=flat&logo=next.js)](https://nextjs.org/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=flat&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.x-2D3748?style=flat&logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-v3%2Fv4-06B6D4?style=flat&logo=tailwindcss)](https://tailwindcss.com/)
[![Docker](https://img.shields.io/badge/Docker-Production%20Ready-2496ED?style=flat&logo=docker&logoColor=white)](https://www.docker.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-neutral.svg)](LICENSE)

A modern, multi-tenant ISP billing system and automated MikroTik RouterOS orchestration platform. Engineered with a bespoke monochrome design system, fluid spring animations, real-time PPPoE session telemetry, automated recurring invoice cycles, non-destructive grace period throttling, and carrier-grade network configuration safety bounds.

---

## Visual Platform Tour (Dark & Light Theme)

### 1. Operations Command Center (Dashboard)
Real-time fleet health, 24-hour granular live aggregated PPPoE network throughput telemetry, monthly ledger collection rates, active tariff distribution, and quick cashier actions.

| Dark Theme (Default) | Light Theme |
|:---:|:---:|
| ![Dashboard Dark](screenshots/dashboard-dark.png) | ![Dashboard Light](screenshots/dashboard-light.png) |

---

### 2. MikroTik Router Gateways Fleet
Centralized management of physical CCR appliances, virtual CHRs, and RB-series devices with live CPU/RAM telemetry, connection diagnostic testing, socket health sync, and ROS version tracking.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![Routers Fleet Dark](screenshots/routers-dark.png) | ![Routers Fleet Light](screenshots/routers-light.png) |

---

### 3. Guided Zero-Downtime PPPoE Setup Wizard
Step-by-step interactive configuration wizard for RouterOS devices. Automatically provisions IP pools, PPPoE server services, authentication profiles, and firewall rules with pre-execution dry-run diff safety inspection.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![PPPoE Wizard Dark](screenshots/router-pppoe-wizard-dark.png) | ![PPPoE Wizard Light](screenshots/router-pppoe-wizard-light.png) |

---

### 4. Subscriber Management & Detailed 360° Profile
Customer directory with advanced filtering, real-time service statuses, assigned bandwidth plans, live interface telemetry, billing ledger balances, and payment transaction logs.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![Subscribers List Dark](screenshots/subscribers-dark.png) | ![Subscribers List Light](screenshots/subscribers-light.png) |
| ![Subscriber Detail Dark](screenshots/subscriber-detail-dark.png) | ![Subscriber Detail Light](screenshots/subscriber-detail-light.png) |

---

### 5. Live PPPoE Active Sessions
Real-time subscriber tunnel monitoring polled via MikroTik API `/interface/monitor-traffic`, session duration brackets, core gateway load distribution, and one-click remote session disconnection.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![Sessions Dark](screenshots/sessions-dark.png) | ![Sessions Light](screenshots/sessions-light.png) |

---

### 6. Bandwidth Tariff Packages & Pool Allocation
Broadband rate card management with symmetrical/asymmetrical speeds, burst limits, priority levels, RouterOS PPP profile associations, and pool capacity tracking.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![Packages Dark](screenshots/packages-dark.png) | ![Packages Light](screenshots/packages-light.png) |

---

### 7. Invoices, Billing Cycles & Recurring Runs
Automated recurring invoice generation, prorated billing runs, overdue aging calculations, payment recordings, and printable thermal cashier receipts.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![Invoices Dark](screenshots/invoices-dark.png) | ![Invoices Light](screenshots/invoices-light.png) |
| ![Billing Runs Dark](screenshots/billing-runs-dark.png) | ![Billing Runs Light](screenshots/billing-runs-light.png) |

---

### 8. Subscriber Service Lifecycle & Grace Policies
Automated suspension rules for overdue balances, customizable grace periods, non-destructive speed throttling profiles, and manual administrative overrides.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![Lifecycle Dark](screenshots/lifecycle-dark.png) | ![Lifecycle Light](screenshots/lifecycle-light.png) |

---

### 9. Financial Collections & Audit Trail Logs
Visual revenue channel breakdowns (bKash, Nagad, Bank, Cash), daily collection volume trends, monthly collection rates, and immutable tenant-scoped audit trails.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![Collections Dark](screenshots/reports-collections-dark.png) | ![Collections Light](screenshots/reports-collections-light.png) |
| ![Audit Trail Dark](screenshots/reports-audit-dark.png) | ![Audit Trail Light](screenshots/reports-audit-light.png) |

---

### 10. SMS Alerts, Staff Roles & System Settings
Multi-channel SMS template editor, cashier invite workflows, role-based access permissions, and ISP tenant branding settings.

| Dark Theme | Light Theme |
|:---:|:---:|
| ![Notifications Dark](screenshots/notifications-dark.png) | ![Notifications Light](screenshots/notifications-light.png) |
| ![Staff Roles Dark](screenshots/staff-dark.png) | ![Staff Roles Light](screenshots/staff-light.png) |
| ![Settings Dark](screenshots/settings-dark.png) | ![Settings Light](screenshots/settings-light.png) |

---

### 11. Modal Dialogs & Operational Workflows

| Action | Dark Theme | Light Theme |
|---|:---:|:---:|
| **Record Payment** | ![Record Payment Dark](screenshots/modal-record-payment-dark.png) | ![Record Payment Light](screenshots/modal-record-payment-light.png) |
| **Printable Receipt** | ![Invoice Receipt Dark](screenshots/modal-invoice-receipt-dark.png) | ![Invoice Receipt Light](screenshots/modal-invoice-receipt-light.png) |
| **Register Router** | ![Register Router Dark](screenshots/modal-register-router-dark.png) | ![Register Router Light](screenshots/modal-register-router-light.png) |
| **Router Diagnostics** | ![Diagnostic Test Dark](screenshots/modal-router-test-result-dark.png) | ![Diagnostic Test Light](screenshots/modal-router-test-result-light.png) |
| **Add Subscriber** | ![Add Subscriber Dark](screenshots/modal-add-subscriber-dark.png) | ![Add Subscriber Light](screenshots/modal-add-subscriber-light.png) |
| **Disconnect Session** | ![Disconnect Session Dark](screenshots/modal-disconnect-session-dark.png) | ![Disconnect Session Light](screenshots/modal-disconnect-session-light.png) |

---

## Core Capabilities

- **MikroTik RouterOS Integration**: Supports RouterOS v6 and v7 via REST HTTPS, API-SSL, and Plaintext API sockets.
- **PPPoE Automation**: Dynamic secret creation, profile provisioning, queue shaping, grace-period speed throttling, and session disconnection.
- **Automated Recurring Billing Engine**: Automated monthly invoice dispatching, partial/full payment reconciliations, and overdue interest calculators.
- **Payment Gateways**: Native integration support for bKash, Nagad, Rocket, SSLCommerz, and manual cashier cash receipting.
- **Carrier-Grade Multi-Tenancy**: Strict tenant boundary isolation enforced across all database queries and background queue jobs.
- **Curated Monochrome UI/UX**: Ultra-sleek dark/light theme engine with zero flash of unstyled content (no FOUC), responsive layouts, and spring animations.

---

## Monorepo Architecture

```text
mikrotik-billing-system/
├── apps/
│   ├── api/                  # NestJS REST API with OpenAPI/Swagger & Global CommonModule
│   ├── web/                  # Next.js 15 App Router console with Tailwind CSS & Lucide icons
│   └── worker/               # BullMQ background job processor for recurring billing & health polling
├── packages/
│   ├── database/             # Prisma schema, migrations, seed scripts & client
│   └── shared/               # Shared domain types, DTO schemas, and cryptographic utilities
├── infrastructure/
│   ├── docker-compose.yml    # Development PostgreSQL and Redis services
│   ├── docker-compose.test.yml
│   └── docker-entrypoint-api.sh
├── screenshots/              # High-resolution screenshots of all platform pages and modals
├── Dockerfile                # Production multi-stage Docker build
├── docker-compose.yml        # Complete production full-stack compose deployment
└── README.md
```

---

## Docker Deployment (Production Ready)

Deploy the entire MikroTik ISP Billing & Operations platform (PostgreSQL, Redis, NestJS API with automatic database migrations, BullMQ Worker, and Next.js Web UI) with a single command.

### 1. Prerequisites
- **Docker**: `>= 24.0.0`
- **Docker Compose**: `>= 2.20.0` (Docker Compose V2)

### 2. Environment Configuration & Generating Cryptographic Keys

Create your `.env` file from the provided template:

```bash
cp .env.example .env
```

#### How to Generate Cryptographic Secrets

The platform requires two primary cryptographic keys for secure operation:
1. **`APP_ENCRYPTION_KEY`**: A **32-byte (256-bit) hexadecimal key (exactly 64 hex characters `[0-9a-f]`)** used by the NestJS encryption engine to encrypt RouterOS API passwords and credentials at rest using **AES-256-GCM**.
2. **`JWT_SECRET`**: A **high-entropy cryptographic secret** used to sign and verify operator and cashier JSON Web Tokens for authentication.
3. **`SESSION_SECRET`**: A random key used for administrative session validation and state hashing.

##### Option A: Instant One-Liner (Generates & Updates `.env` Automatically)
Run this single command in your terminal to automatically generate production-grade keys and write them directly into your `.env` file:

```bash
node -e "
const fs = require('fs');
const crypto = require('crypto');
let env = fs.existsSync('.env') ? fs.readFileSync('.env', 'utf8') : fs.readFileSync('.env.example', 'utf8');
env = env.replace(/APP_ENCRYPTION_KEY=.*/, 'APP_ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
env = env.replace(/JWT_SECRET=.*/, 'JWT_SECRET=' + crypto.randomBytes(48).toString('base64'));
env = env.replace(/SESSION_SECRET=.*/, 'SESSION_SECRET=' + crypto.randomBytes(32).toString('hex'));
fs.writeFileSync('.env', env);
console.log('✅ Generated production keys in .env:');
console.log(' - APP_ENCRYPTION_KEY (AES-256-GCM 64-char hex)');
console.log(' - JWT_SECRET (High-entropy base64 string)');
console.log(' - SESSION_SECRET (32-byte hex)');
"
```

##### Option B: Generate Manually Using OpenSSL or Node.js

| Secret Key | Description | OpenSSL Generation Command | Node.js Generation Command |
|---|---|---|---|
| **`APP_ENCRYPTION_KEY`** | Exactly 64 hex characters (32 bytes) for AES-256-GCM | `openssl rand -hex 32` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **`JWT_SECRET`** | High-entropy signing key for auth tokens | `openssl rand -base64 48` | `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"` |
| **`SESSION_SECRET`** | Random session validation key | `openssl rand -hex 32` | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| **`DB_PASSWORD`** | Secure password for PostgreSQL | `openssl rand -base64 18 \| tr -dc 'a-zA-Z0-9'` | `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"` |

#### Understanding Environment Configuration Variables

| Variable | Default (Docker) | Default (Local) | Purpose |
|---|---|---|---|
| `APP_ENCRYPTION_KEY` | *(Generated 64-char hex)* | *(Generated 64-char hex)* | AES-256-GCM database credential encryption key |
| `JWT_SECRET` | *(Generated base64)* | *(Generated base64)* | Token signature secret for bearer authorization |
| `SESSION_SECRET` | *(Generated hex)* | *(Generated hex)* | Internal session and CSRF signature string |
| `DATABASE_URL` | `postgresql://billing_user:...@postgres:5432/mikrotik_billing?schema=public` | `postgresql://...localhost:5432/...` | PostgreSQL connection URL |
| `REDIS_HOST` | `redis` | `localhost` | Redis container host for BullMQ queues and cache |
| `REDIS_PORT` | `6379` | `6379` | Redis TCP service port |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `http://localhost:4000` | URL of the NestJS API accessed by the browser UI |
| `ROUTER_MOCK_MODE` | `true` | `true` | Set to `false` when connecting to real physical RouterOS hardware |
| `SMS_MOCK_MODE` | `true` | `true` | Set to `false` when connecting to live telecom SMS gateway APIs |
| `PAYMENT_MOCK_MODE` | `true` | `true` | Set to `false` when using live bKash/Nagad/SSLCommerz merchant accounts |

### 3. Build & Launch Containers (Alpine Linux)

The platform is containerized using ultra-lightweight **Alpine Linux** (`node:20-alpine`, `postgres:16-alpine`, `redis:7-alpine`) with automated mirror failovers for fast, secure builds.

Run the root Docker Compose file to build images and launch all containers in detached mode:

```bash
docker compose up --build -d
```

> [!TIP]
> **VPS Network Optimization:** If your cloud host or VPS provider has strict DNS or outbound firewall rules during container builds, you can run:
> ```bash
> DOCKER_BUILDKIT=0 docker compose up --build -d
> ```

### 4. Automatic Database Migrations & Seeding
The API container automatically runs database migrations upon startup via [`infrastructure/docker-entrypoint-api.sh`](infrastructure/docker-entrypoint-api.sh).

To seed initial demo data (FastNet Broadband tenant, tariff packages, sample subscribers, and mock routers):

```bash
docker compose exec api pnpm --filter @mikrotik-billing/database prisma db seed
```

### 5. Services & Port Map

Once running, the platform services are accessible at:

| Component | Endpoint | Default Port | Description |
|---|---|---|---|
| **Web Console** | [http://localhost:3000](http://localhost:3000) | `3000` | Next.js 15 Monochrome Operations UI |
| **REST API** | [http://localhost:4000/api/v1](http://localhost:4000/api/v1) | `4000` | Multi-Tenant ISP Operations API |
| **Swagger Docs** | [http://localhost:4000/api/docs](http://localhost:4000/api/docs) | `4000` | Interactive OpenAPI Documentation |
| **Health Check** | [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health) | `4000` | Service Liveness & DB Connectivity Probe |
| **PostgreSQL** | `localhost:5432` | `5432` | Relational Storage (Prisma ORM) |
| **Redis** | `localhost:6379` | `6379` | Telemetry Cache & BullMQ Queue Broker |
| **Worker** | Background Process | — | Billing scheduler, session polling & sync |

### 6. Container Management & Useful Commands

```bash
# View live streaming logs across all containers
docker compose logs -f

# View logs for a specific service (e.g. API or Worker)
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f web

# Check health and status of running containers
docker compose ps

# Restart a specific service
docker compose restart web

# Shut down and remove containers while preserving database volume
docker compose down

# Shut down and erase all persistent database volumes (Clean Reset)
docker compose down -v
```

---

## Local Development (Non-Docker)

If you prefer running services directly on your host machine:

### 1. Install Node.js & pnpm
- **Node.js**: `>= 20.0.0`
- **pnpm**: `>= 9.0.0`

### 2. Start PostgreSQL & Redis
```bash
docker compose -f infrastructure/docker-compose.yml up -d
```

### 3. Install Monorepo Dependencies
```bash
pnpm install
```

### 4. Database Setup & Seeding
```bash
pnpm --filter @mikrotik-billing/database prisma migrate deploy
pnpm --filter @mikrotik-billing/database prisma db seed
```

### 5. Start Development Servers
```bash
# Run all apps concurrently (Web on :3000, API on :4000, Worker in background)
pnpm dev
```
Or start individual workspaces:
```bash
# API Server
pnpm --filter @mikrotik-billing/api dev

# Web Console
pnpm --filter @mikrotik-billing/web dev

# Background Worker
pnpm --filter @mikrotik-billing/worker dev
```

---

## Testing & Quality Assurance

The codebase includes comprehensive test suites across backend and frontend packages:

```bash
# Run all unit and integration test suites
pnpm run test

# Run API test suites (15 test suites, 91 tests)
pnpm --filter @mikrotik-billing/api test

# Run Web test suites (Component & render tests)
pnpm --filter @mikrotik-billing/web test

# Run TypeScript typechecks across the monorepo
pnpm run typecheck

# Build all applications for production verification
pnpm run build
```

---

## Security & Reliability Standards

- **AES-256-GCM Encryption**: All MikroTik router passwords and API credentials are encrypted at rest using AES-256-GCM (`APP_ENCRYPTION_KEY`).
- **Bounded Router Adapters**: Router operations execute through bounded adapters with timeout guarantees, circuit breakers, and mock test fixtures.
- **Tenant Boundary Isolation**: Every database query is strictly scoped by `tenantId`.
- **Zero-FOUC Theme Engine**: Synchronous script-level theme hydration in [`layout.tsx`](apps/web/src/app/layout.tsx) prevents flash of light mode on refreshed views.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

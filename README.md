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

## Visual Platform Highlights

Here is a glimpse of the platform in both dark and light modes, featuring our bespoke monochrome design system, fluid spring animations, and real-time network telemetry:

| Operations Command Center (Dark Theme) | Operations Command Center (Light Theme) |
|:---:|:---:|
| ![Dashboard Dark](screenshots/dashboard-dark.png) | ![Dashboard Light](screenshots/dashboard-light.png) |

| MikroTik Router Gateways Fleet | Guided Zero-Downtime PPPoE Wizard |
|:---:|:---:|
| ![Routers Fleet Dark](screenshots/routers-dark.png) | ![PPPoE Wizard Dark](screenshots/router-pppoe-wizard-dark.png) |

<br />

<div align="center">
  <a href="SCREENSHOTS.md">
    <img src="https://img.shields.io/badge/📸_VIEW_FULL_SCREENSHOT_GALLERY_(42+_VIEWS)-000000?style=for-the-badge&logoColor=white" alt="View All Screenshots" height="42" />
  </a>
  <p>
    <strong><a href="SCREENSHOTS.md">👉 Click here to view all 42+ screenshots in SCREENSHOTS.md (Dark & Light Themes) →</a></strong><br />
    <em>Explore all modules including Subscribers 360°, Live Sessions, Invoices, Billing Cycles, Service Lifecycle, Reports, and Interactive Dialogs.</em>
  </p>
</div>

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

| Variable | Default (Host Mode & Local) | Purpose |
|---|---|---|
| `APP_ENCRYPTION_KEY` | *(Generated 64-char hex)* | AES-256-GCM database credential encryption key |
| `JWT_SECRET` | *(Generated base64)* | Token signature secret for bearer authorization |
| `SESSION_SECRET` | *(Generated hex)* | Internal session and CSRF signature string |
| `DATABASE_URL` | `postgresql://postgres:postgres@127.0.0.1:5432/mikrotik_billing?schema=public` | PostgreSQL connection URL (binds directly to host) |
| `REDIS_URL` | `redis://127.0.0.1:6379` | Redis TCP service URL (binds directly to host) |
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | URL of the NestJS API accessed by the browser UI |
| `ROUTER_MOCK_MODE` | `true` | Set to `false` when connecting to real physical RouterOS hardware |
| `SMS_MOCK_MODE` | `true` | Set to `false` when connecting to live telecom SMS gateway APIs |
| `PAYMENT_MOCK_MODE` | `true` | Set to `false` when using live bKash/Nagad/SSLCommerz merchant accounts |

---

### 3. Network Architecture: Host Network Mode (`network_mode: host`)

This project is configured to run natively in **Network Mode Host** (`network_mode: host`) across all services (PostgreSQL, Redis, NestJS API, BullMQ Worker, and Next.js Web UI).

#### Why Host Networking is Critical for MikroTik Operations:
1. **Direct Layer 2/3 Router Reachability**: The NestJS API and background worker communicate directly with physical CCR, CHR, and RB devices across local management subnets (e.g. `10.x.x.x`, `192.168.x.x`, VLANs) without Docker bridge NAT traversal hurdles or IP masquerade issues.
2. **RADIUS Accounting & Authentication**: Enables direct reception of incoming UDP RADIUS packets (`1812`/`1813`) from RouterOS without port forwarding collisions.
3. **High-Throughput Telemetry**: Zero network translation overhead for continuous PPPoE interface traffic polling (`/interface/monitor-traffic`) and active connection tracking.
4. **Unified Localhost Loopback**: PostgreSQL, Redis, API, and Worker communicate with sub-millisecond latency over `127.0.0.1`.

---

### 4. How to Build the Docker Images as Network Mode Host

When building Docker containers on cloud VPS servers (such as DigitalOcean, Hetzner, AWS, Linode, or bare-metal ISP servers), Docker's default bridge network may experience DNS resolution timeouts (`dl-cdn.alpinelinux.org` or `registry.npmjs.org` failure) due to provider firewall rules or `systemd-resolved` loopback bindings.

Building with **Network Mode Host** allows the build process to share the host's direct network connection and DNS resolver.

#### Method A: Direct Docker CLI (Recommended)
You can build all container stages with host networking in one command using the pre-configured script or standard Docker CLI:

```bash
# Using pnpm monorepo shortcut:
pnpm docker:build:host

# Or using Docker CLI directly:
docker build --network=host --target api -t mikrotik-billing-api:latest .
docker build --network=host --target worker -t mikrotik-billing-worker:latest .
docker build --network=host --target web -t mikrotik-billing-web:latest .
```

#### Method B: Docker Compose with Host Build Override
We provide [`docker-compose.host-build.yml`](docker-compose.host-build.yml) which sets `network: host` for all service build configurations:

```bash
# Using pnpm monorepo shortcut:
pnpm docker:host:build

# Or using Docker Compose directly:
DOCKER_BUILDKIT=0 docker compose -f docker-compose.yml -f docker-compose.host-build.yml build
```

---

### 5. Launching the Platform (Network Mode Host)

Once the images are built (or to build and launch in one step):

```bash
# Start all containers in detached mode (using host networking)
docker compose up -d

# Or build and launch simultaneously:
docker compose up --build -d
```

> [!TIP]
> **VPS DNS / BuildKit Optimization:** If your VPS provider requires legacy builder fallback:
> ```bash
> DOCKER_BUILDKIT=0 docker compose -f docker-compose.yml -f docker-compose.host-build.yml up --build -d
> ```

---

### 6. Automatic Database Migrations & Seeding
The API container automatically runs database migrations upon startup via [`infrastructure/docker-entrypoint-api.sh`](infrastructure/docker-entrypoint-api.sh).

To seed initial demo data (FastNet Broadband tenant, tariff packages, sample subscribers, and mock routers):

```bash
docker compose exec api pnpm --filter @mikrotik-billing/database prisma db seed
```

---

### 7. Services & Port Map

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

---

### 8. Container Management & Useful Commands

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

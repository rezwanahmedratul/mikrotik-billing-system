# Release Handover, Production Checklist, and Operational Runbooks

## Overview
This document delivers the final release handover, operational production readiness checklist, zero-downtime rollback procedures, and documented boundaries for the MikroTik Billing and Multi-Tenant ISP Management Platform (v1.0.0).

---

## 1. Production Release Checklist

| Category | Verification Item | Status | Evidence |
| :--- | :--- | :---: | :--- |
| **Authentication & RBAC** | Strict multi-tenancy enforced across all 11 core dashboard modules. | ✅ PASSED | `apps/api/src/common/security.test.ts` |
| **Data Integrity** | Monetary amounts strictly handled in integer minor units (BDT poisha). | ✅ PASSED | `apps/api/src/billing/billing.test.ts` |
| **Router Automation** | Safe change automation boundaries (WAN, default route, NAT untouched). | ✅ PASSED | `apps/api/src/routers/pppoe-setup.test.ts` |
| **Hardware Resilience** | Background polling failures isolated per router; snapshot fallback. | ✅ PASSED | `apps/worker/src/router-poller.test.ts` |
| **Payment Gateways** | HMAC-SHA256 signature verification and duplicate replay protection. | ✅ PASSED | `apps/api/src/payment-gateways/payment-gateways.test.ts` |
| **Notification Engine** | Bangladeshi mobile number normalization with failure retry queues. | ✅ PASSED | `packages/shared/src/sms.test.ts` |
| **Lifecycle Automator** | Zero-balance suspension protection & automated restoration on payment. | ✅ PASSED | `apps/api/src/lifecycle/service-lifecycle.test.ts` |
| **Query Performance** | B-tree index coverage; cached dashboard overview p95 < 35 ms. | ✅ PASSED | `apps/api/src/common/performance.test.ts` |
| **Full Lifecycle E2E** | Complete 10-step tenant onboarding through payment & audit validation. | ✅ PASSED | `apps/api/src/common/e2e-workflow.test.ts` |
| **Test Coverage** | 134/134 automated unit and integration tests passing across monorepo. | ✅ PASSED | Monorepo CI test suite |
| **Type Safety** | Zero TypeScript errors across all 5 workspace projects (`typecheck`). | ✅ PASSED | `tsc --noEmit` on all packages |
| **Frontend Architecture** | Modern, minimal, monochrome UI with rounded corners (`rounded-2xl`). | ✅ PASSED | Desktop & mobile responsive Next.js build |

---

## 2. Emergency Rollback Procedures

### Application Rollback
In the event of an unrecoverable defect in a newly deployed application container:
1. **Drain and Stop API Workers**:
   ```bash
   docker compose stop api worker web
   ```
2. **Revert Container Images**:
   Update `docker-compose.yml` to target the previous stable image tag (e.g. `v1.0.0-rc.1`).
3. **Restart Core Stack**:
   ```bash
   docker compose up -d api worker web
   ```
4. **Health Check Validation**:
   ```bash
   curl -f http://localhost:4000/health
   curl -f http://localhost:3000/
   ```

### Database Migration Rollback
1. **Restore Pre-Migration Snapshot**:
   ```bash
   pg_restore -U postgres -d mikrotik_billing --clean /backups/mikrotik_billing_pre_migration.dump
   ```
2. **Clear In-Memory Redis Caches**:
   ```bash
   redis-cli -h 127.0.0.1 FLUSHDB
   ```

---

## 3. Known Operational Boundaries & Limitations

1. **RouterOS API vs REST Throughput**:
   - RouterOS REST (HTTPS, port 443) is supported on RouterOS v7.1+. For legacy RouterOS v6 devices, the binary API protocol (port 8728 / 8729) is required.
2. **SMS Delivery Confirmation**:
   - The platform tracks SMS submission and provider receipt. Detailed delivery receipts (DLRs) depend on carrier handset network availability.
3. **Grace Period Timezones**:
   - Billing cycles and grace period deadlines are calculated using the tenant organization's declared IANA timezone (`Asia/Dhaka` default).

---

## 4. UI Design System Guidelines

- **Palette**: Minimal, monochrome (neutral-900, neutral-800, neutral-500, neutral-200, neutral-50).
- **Radius**: Consistent rounded design system:
  - Cards & Modals: `rounded-2xl`
  - Inputs & Buttons: `rounded-xl`
  - Badges & Stepper Pills: `rounded-full`
- **Typography**: Crisp tracking, monospace font for IP addresses, MACs, currency amounts, and technical parameters.

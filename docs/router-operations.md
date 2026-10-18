# MikroTik RouterOS Operations Specification

## 1. Overview and Architecture Principles

The MikroTik ISP Billing & Management platform interacts with MikroTik RouterOS devices to manage PPPoE access, bandwidth limits, subscriber credentials, and session state.

To guarantee carrier-grade operational reliability and protect tenant network integrity:
1. **Safety Boundaries:** The platform never modifies WAN interfaces, NAT rules, system user databases, route tables, or firewall filter rules outside of explicitly documented billing address-lists.
2. **Idempotence:** Every operation is designed to produce the identical desired state regardless of how many times it is applied.
3. **Auditability:** Every privileged router change is recorded as a `RouterJob` in PostgreSQL with attempt logs, raw payload, execution results, and initiator identity.
4. **Pre-Flight Inspection & Dry-Run:** Privileged configuration changes must first produce a verifiable plan and require explicit confirmation.
5. **Post-Change Verification:** After applying changes, the platform reads the state back from the hardware device to confirm success.

---

## 2. Supported RouterOS Versions and Protocols

| Version | Status | Recommended Protocol | Notes |
| :--- | :--- | :--- | :--- |
| **RouterOS v7.12 - v7.16+** | Primary (Production) | `REST_HTTPS` (Port 443 / 8728) | High throughput, TLS encryption, native JSON responses. |
| **RouterOS v7.6 - v7.11** | Supported | `REST_HTTPS` / `API_SSL` | Supported for core PPPoE, queues, and address lists. |
| **RouterOS v6.48 - v6.49 (Legacy)** | Supported via binary API | `API_SSL` (Port 8729) / `API_PLAIN` | Long-term support releases using standard RouterOS binary API. |
| **Development Mock** | Fully Supported | `MockRouterAdapter` | Local tests and CI without physical hardware dependencies. |

---

## 3. Scope of Router Operations

### Allowed Operations (MVP)
- **Identity & Health Probes:**
  - `GET /system/identity`
  - `GET /system/resource` (CPU load, memory, uptime, board model)
  - `GET /interface` (Running interfaces and MAC addresses)
- **IP Pool Management:**
  - `GET /ip/pool`
  - `PUT /ip/pool` / `PATCH /ip/pool/:id` (Scoped strictly to designated subscriber pools, e.g. `pppoe-pool-1`)
- **PPP Profile Management:**
  - `GET /ppp/profile`
  - `PUT /ppp/profile` / `PATCH /ppp/profile/:id` (Bandwidth speed tiers: `rate-limit`, `local-address`, `remote-address`, `dns-server`, `only-one=yes`)
- **PPPoE Server Service:**
  - `GET /interface/pppoe-server/server`
  - `PUT /interface/pppoe-server/server` (Binding PPPoE service to specified LAN/Bridge interface with MTU 1480, default profile)
- **Subscriber Secret Management:**
  - `GET /ppp/secret`
  - `PUT /ppp/secret` / `PATCH /ppp/secret/:id`
  - `DELETE /ppp/secret/:id`
- **Active Session Management:**
  - `GET /ppp/active`
  - `DELETE /ppp/active/:id` (Disconnect session to enforce speed change or payment suspension)
- **Address Lists (Suspension / Walled Garden):**
  - `GET /ip/firewall/address-list`
  - `PUT /ip/firewall/address-list` (Scoped strictly to `list=suspended_subscribers`)

### Prohibited Operations (Strict Safety Guardrails)
- NO modification of `/ip/firewall/filter` (firewall rules).
- NO modification of `/ip/firewall/nat` masquerade rules.
- NO alteration of `/ip/route` (default gateway and BGP/OSPF routing).
- NO modification of `/user` or administrative accounts.
- NO execution of `/system/reset-configuration` or reboot commands.

---

## 4. Guided PPPoE Setup Workflow

1. **Step 1: Read-Only Inspection (`POST /routers/:id/pppoe/inspect`)**
   - Reads available interfaces, existing IP pools, existing PPP profiles, and existing PPPoE servers.
   - Evaluates prerequisites (e.g. at least one LAN interface is running).
2. **Step 2: Configuration Planning (`POST /routers/:id/pppoe/plan`)**
   - Takes proposed pool name, IP range (e.g. `10.10.20.2-10.10.20.254`), local gateway IP (e.g. `10.10.20.1`), DNS servers, and target interface.
   - Compiles a diff:
     - What will be added (e.g. Pool `pppoe-pool-1`, Profile `default-pppoe`, Server on `ether2-lan`).
     - What is already configured (no-op).
   - Issues a unique `planId` and checksum.
3. **Step 3: Explicit Confirmation (`POST /routers/:id/pppoe/apply`)**
   - Requires `{ confirmed: true, planId: "..." }`.
   - Records a `RouterJob` in `PENDING` state.
   - Applies changes in transaction order:
     1. Create / verify IP Pool.
     2. Create / verify PPP Profile with DNS & Local Address.
     3. Create / enable PPPoE Server on designated interface.
4. **Step 4: Post-Change Verification**
   - Immediately reads back the router configuration.
   - Verifies all 3 components exist and match the plan parameters.
   - Updates `RouterJob` status to `SUCCEEDED` with verification proof.
5. **Step 5: Failure Recovery**
   - If any step fails, records error details in `RouterJob` and marks `FAILED`.
   - Platform exposes a "Retry Safe Sync" action that re-evaluates the state and resumes from the unapplied step.

import Link from 'next/link';
import {
  ShieldCheck,
  Network,
  Users,
  CreditCard,
  ArrowRight,
  Zap,
  Lock,
  Layers,
  Activity,
  CheckCircle2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50/50 text-neutral-900 selection:bg-neutral-900 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 font-mono text-base font-bold text-white shadow-xs">
              MT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-neutral-900">
                  MikroTik ISP Platform
                </span>
                <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 hidden sm:block">Carrier-Grade Multi-Tenant Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <span>Operations Console</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1 text-xs font-medium text-neutral-700 shadow-xs">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Production Ready Multi-Tenant Architecture
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-900 sm:text-5xl lg:text-6xl leading-[1.12]">
            Unified MikroTik Network Management & Automated Subscriber Billing
          </h1>
          <p className="mt-5 text-base text-neutral-600 sm:text-lg leading-relaxed">
            Provision PPPoE credentials, monitor live RouterOS sessions, automate recurring invoicing,
            and enforce grace-period service suspensions with an immutable, audited financial ledger.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              Launch Console <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              Register Organization
            </Link>
          </div>
        </div>

        {/* Live Status Chip Banner */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">REST / API Protocol</div>
            <div className="mt-1 text-lg font-bold font-mono text-neutral-900">RouterOS v7+</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="h-3 w-3" /> TLS / AES-256 Encrypted
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Financial Precision</div>
            <div className="mt-1 text-lg font-bold font-mono text-neutral-900">BDT Poisha</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Zero Floating-Point Drift
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Automated Lifecycle</div>
            <div className="mt-1 text-lg font-bold font-mono text-neutral-900">Zero-Touch</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Auto Restore on Payment
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider">Multi-Tenant Isolation</div>
            <div className="mt-1 text-lg font-bold font-mono text-neutral-900">Strict RBAC</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
              <CheckCircle2 className="h-3 w-3" /> PostgreSQL Scoped Data
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 mb-4">Core Operating Modules</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition hover:border-neutral-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
                <Network className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-neutral-900">Router Fleet Orchestration</h3>
              <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                Direct REST/API integration with RouterOS. Hardware telemetry polling, credential encryption at rest, and automated PPPoE server provisioning.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition hover:border-neutral-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-neutral-900">PPPoE Provisioning</h3>
              <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                Deterministic subscriber provisioning with state reconciliation, profile binding, and live session disconnect controls.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition hover:border-neutral-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-neutral-900">Audited Billing & Gateways</h3>
              <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                Deterministic monthly billing runs, FIFO payment allocations, reversals, and server-to-server webhook reconciliation (bKash, Nagad, Stripe).
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition hover:border-neutral-400">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-neutral-900">Lifecycle & Tamper Audit</h3>
              <p className="mt-1.5 text-xs text-neutral-600 leading-relaxed">
                Automated restorations upon payment, 48h reminder deduplication, zero-balance suspension protection, and immutable audit trails.
              </p>
            </div>
          </div>
        </div>

        {/* Console Quick Launch Banner */}
        <div className="mt-12 flex flex-col items-start justify-between gap-6 rounded-2xl border border-neutral-800 bg-neutral-950 p-8 text-white sm:flex-row sm:items-center shadow-sm">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-neutral-800/80 px-3 py-1 font-mono text-[11px] text-neutral-300">
              <Activity className="h-3 w-3 text-emerald-400" /> All Services Operational
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight">Access the Operations Console</h2>
            <p className="mt-1 text-xs text-neutral-400">
              Manage routers, subscribers, packages, billing, live traffic sessions, and financial reports.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-semibold text-neutral-950 transition hover:bg-neutral-100 shrink-0"
          >
            Launch Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white px-6 py-6 text-center text-xs text-neutral-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 sm:flex-row">
          <span>MikroTik ISP Billing & Management Platform &middot; Production Ready</span>
          <span className="font-mono text-[11px] text-neutral-400">REST &bull; API &bull; AES-256 &bull; Strict RBAC</span>
        </div>
      </footer>
    </div>
  );
}

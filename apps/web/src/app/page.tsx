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
import { ThemeToggle } from '@/components/theme/ThemeToggle';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-neutral-50/50 text-neutral-900 selection:bg-neutral-900 selection:text-white dark:bg-neutral-950 dark:text-neutral-100 dark:selection:bg-neutral-100 dark:selection:text-neutral-900 transition-colors">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/80 backdrop-blur-md px-6 py-4 dark:border-neutral-800 dark:bg-neutral-900/80 transition-colors">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-900 font-mono text-base font-bold text-white shadow-xs dark:bg-white dark:text-neutral-900">
              MT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold tracking-tight text-neutral-900 dark:text-white">
                  MikroTik ISP Platform
                </span>
                <span className="rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 font-mono text-[11px] font-medium text-neutral-600 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-400">
                  v1.0.0
                </span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 hidden sm:block">Carrier-Grade Multi-Tenant Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
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
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1 text-xs font-medium text-neutral-700 shadow-xs dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Production Ready Multi-Tenant Architecture
          </div>
          <h1 className="mt-6 text-4xl font-bold tracking-tight text-neutral-900 dark:text-white sm:text-5xl lg:text-6xl leading-[1.12]">
            Unified MikroTik Network Management & Automated Subscriber Billing
          </h1>
          <p className="mt-5 text-base text-neutral-600 dark:text-neutral-400 sm:text-lg leading-relaxed">
            Provision PPPoE credentials, monitor live RouterOS sessions, automate recurring invoicing,
            and enforce grace-period service suspensions with an immutable, audited financial ledger.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-5 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
            >
              Launch Console <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-3 text-sm font-semibold text-neutral-800 shadow-xs transition hover:border-neutral-300 hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700"
            >
              Register Organization
            </Link>
          </div>
        </div>

        {/* Live Status Chip Banner */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">REST / API Protocol</div>
            <div className="mt-1 text-lg font-bold font-mono text-neutral-900 dark:text-white">RouterOS v7+</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3" /> TLS / AES-256 Encrypted
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">Financial Precision</div>
            <div className="mt-1 text-lg font-bold font-mono text-neutral-900 dark:text-white">BDT Poisha</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Zero Floating-Point Drift
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">Automated Lifecycle</div>
            <div className="mt-1 text-lg font-bold font-mono text-neutral-900 dark:text-white">Zero-Touch</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3" /> Auto Restore on Payment
            </div>
          </div>
          <div className="rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-xs dark:border-neutral-800 dark:bg-neutral-900">
            <div className="text-[11px] font-medium text-neutral-500 uppercase tracking-wider dark:text-neutral-400">Multi-Tenant Isolation</div>
            <div className="mt-1 text-lg font-bold font-mono text-neutral-900 dark:text-white">Strict RBAC</div>
            <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="h-3 w-3" /> PostgreSQL Scoped Data
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="mt-12">
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">Core Operating Modules</div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <Network className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-neutral-900 dark:text-white">Router Fleet Orchestration</h3>
              <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Direct REST/API integration with RouterOS. Hardware telemetry polling, credential encryption at rest, and automated PPPoE server provisioning.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-neutral-900 dark:text-white">PPPoE Provisioning</h3>
              <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Deterministic subscriber provisioning with state reconciliation, profile binding, and live session disconnect controls.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <CreditCard className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-neutral-900 dark:text-white">Automated Invoicing & MFS</h3>
              <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Scheduled monthly billing batches, automated bKash/Nagad webhooks with HMAC validation, and printable customer tax receipts.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-xs transition hover:border-neutral-400 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-neutral-900 dark:text-white">Security & Audit Trails</h3>
              <p className="mt-1.5 text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Tamper-evident operations log, multi-tenant row isolation, AES-256-GCM secret protection, and zero floating-point financial precision.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 bg-white px-6 py-8 text-xs text-neutral-500 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-400 transition-colors">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            &copy; {new Date().getFullYear()} MikroTik Billing System. Production Edition.
          </div>
          <div className="flex items-center gap-4 text-neutral-600 dark:text-neutral-400">
            <span>PostgreSQL 16</span>
            <span>&bull;</span>
            <span>Redis 7</span>
            <span>&bull;</span>
            <span>RouterOS v7+ API</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

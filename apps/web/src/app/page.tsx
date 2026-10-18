import Link from 'next/link';
import { ShieldCheck, Network, Users, CreditCard, ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-neutral-900 bg-neutral-900 text-white font-mono font-bold text-base">
              MT
            </div>
            <div>
              <span className="font-semibold tracking-tight text-neutral-900">
                MikroTik ISP Platform
              </span>
              <span className="ml-2 rounded border border-neutral-200 bg-neutral-100 px-1.5 py-0.5 font-mono text-[11px] text-neutral-600">
                v1.0.0
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="rounded border border-neutral-300 bg-white px-3.5 py-1.5 text-xs font-medium text-neutral-800 transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-neutral-400"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded bg-neutral-900 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              Open Console
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-12">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Carrier-Grade Multi-Tenant ISP Operations
          </div>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Unified MikroTik Network Management & Automated Subscriber Billing
          </h1>
          <p className="mt-3 text-base text-neutral-600 leading-relaxed">
            Provision PPPoE credentials, monitor live RouterOS sessions, automate invoicing and
            grace-period service suspensions with an audit-ready financial ledger.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded border border-border bg-surface p-5 shadow-sm transition hover:border-neutral-400">
            <Network className="h-5 w-5 text-neutral-900" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">Router Inventory</h3>
            <p className="mt-1 text-xs text-neutral-600 leading-normal">
              Direct REST/API integration with RouterOS. Encrypted credentials at rest with health
              polling.
            </p>
          </div>

          <div className="rounded border border-border bg-surface p-5 shadow-sm transition hover:border-neutral-400">
            <Users className="h-5 w-5 text-neutral-900" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">PPPoE Provisioning</h3>
            <p className="mt-1 text-xs text-neutral-600 leading-normal">
              Subscriber management with desired vs confirmed state tracking and automated profile
              assignment.
            </p>
          </div>

          <div className="rounded border border-border bg-surface p-5 shadow-sm transition hover:border-neutral-400">
            <CreditCard className="h-5 w-5 text-neutral-900" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">Idempotent Billing</h3>
            <p className="mt-1 text-xs text-neutral-600 leading-normal">
              Integer minor currency accounting, automated cycle invoicing, bKash/Nagad/manual
              reconciliation.
            </p>
          </div>

          <div className="rounded border border-border bg-surface p-5 shadow-sm transition hover:border-neutral-400">
            <ShieldCheck className="h-5 w-5 text-neutral-900" />
            <h3 className="mt-3 text-sm font-semibold text-neutral-900">Tenant Isolation</h3>
            <p className="mt-1 text-xs text-neutral-600 leading-normal">
              Role-based access control, tenant boundary enforcement, and immutable audit logging.
            </p>
          </div>
        </div>

        {/* Console Quick Launch Banner */}
        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded border border-neutral-300 bg-neutral-900 p-6 text-white sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-semibold">Access the Operations Console</h2>
            <p className="mt-1 text-xs text-neutral-300">
              Manage routers, subscribers, packages, invoices, and service lifecycle.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded bg-white px-4 py-2 text-xs font-semibold text-neutral-900 transition hover:bg-neutral-100"
          >
            Go to Dashboard <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-surface px-6 py-4 text-center text-xs text-neutral-500">
        MikroTik ISP Billing & Management Platform &middot; Production Ready
      </footer>
    </div>
  );
}
